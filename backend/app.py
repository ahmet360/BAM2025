"""FastAPI app for the fitness demo backend."""
from fastapi import FastAPI, Request, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
import asyncio
import json
from openai import AsyncAzureOpenAI
from datetime import datetime, timezone
import httpx
import sys
sys.path.append(r'C:/Users/ahmtt/Documents/VS/API KEY')
from secret import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT

import models, store, recovery, secret_loader
from models import ChatMsg, WorkoutLog, RecoveryScore
from store import store
from secret_loader import load_secrets
from recovery import calc_recovery, recommend_trainable, COMMON_MUSCLES

app = FastAPI()

# Allow localhost frontend ports (5173 for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok"}

# Placeholder endpoints for MVP contract
@app.post("/chat/stream")
async def chat_stream(request: Request):
    """Stream chat responses from Azure OpenAI."""
    try:
        data = await request.json()
        msg = ChatMsg(**data)
    except (ValidationError, Exception):
        raise HTTPException(status_code=400, detail="Invalid request body.")

    # Simple rate limit: max 3 requests per 10s per uid
    uid = msg.uid
    rate = store.chat_rate.get(uid, 0)
    if rate > 2:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait.")
    store.chat_rate[uid] = rate + 1
    async def reset_rate():
        await asyncio.sleep(10)
        store.chat_rate[uid] = max(0, store.chat_rate[uid] - 1)
    asyncio.create_task(reset_rate())

    # Load secrets
    try:
        secrets = load_secrets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Prepare OpenAI client
    client = AsyncAzureOpenAI(
        api_key=secrets.AZURE_OPENAI_API_KEY,
        azure_endpoint=secrets.AZURE_OPENAI_ENDPOINT,
        api_version="2023-07-01-preview",
    )
    deployment = secrets.AZURE_OPENAI_DEPLOYMENT

    # Append user message to history
    store.append_chat(uid, "user", msg.message)
    history = store.get_chat_history(uid)[-20:]

    # Compose messages for OpenAI
    messages = [{"role": m["role"], "content": m["content"]} for m in history]

    async def token_stream():
        full_reply = ""
        try:
            stream = await client.chat.completions.create(
                model=deployment,
                messages=messages,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
                if delta:
                    full_reply += delta
                    yield delta
        except Exception as e:
            yield f"\n[Error: {str(e)}]"
        # Append assistant reply to history
        store.append_chat(uid, "assistant", full_reply)

    return StreamingResponse(token_stream(), media_type="text/plain")

@app.post("/log/workout")
async def log_workout(log: WorkoutLog = Body(...)):
    """Log a workout for a user."""
    try:
        entry = log.dict()
        if not entry.get("ts"):
            entry["ts"] = datetime.now(timezone.utc)
        store.log_workout(log.uid, entry)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid workout log: {str(e)}")

@app.get("/recovery", response_model=RecoveryScore)
async def get_recovery(uid: str = Query(...)):
    """Get recovery scores and recommendations for a user."""
    try:
        logs = store.get_workouts(uid)
        now = datetime.now(timezone.utc)
        scores = calc_recovery(logs, now)
        # Find last trained per muscle
        last_trained = {m: None for m in COMMON_MUSCLES}
        for log in logs:
            ts = log.get("ts")
            for m in log.get("muscles", []):
                if ts and (last_trained[m] is None or ts > last_trained[m]):
                    last_trained[m] = ts
        recommended = recommend_trainable(scores, last_trained, now)
        return RecoveryScore(
            muscle_scores=scores,
            recommended=recommended,
            updated_at=now
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to calculate recovery: {str(e)}")

@app.post("/api/azure-chat")
async def azure_chat(request: Request):
    data = await request.json()
    user_message = data.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")
    headers = {
        "api-key": AZURE_OPENAI_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 256
    }
    url = f"{AZURE_OPENAI_ENDPOINT}/openai/deployments/{AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Azure OpenAI error: {response.text}")
        result = response.json()
        ai_message = result["choices"][0]["message"]["content"]
        return {"response": ai_message} 