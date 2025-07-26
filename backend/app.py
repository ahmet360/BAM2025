"""FastAPI app for the fitness demo backend."""
from fastapi import FastAPI, Request, HTTPException, Body, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
import asyncio
import json
from openai import AsyncAzureOpenAI
from datetime import datetime, timezone
import httpx
import sys
import os
# Ensure the path to 'secret.py' is added only once and before import
secret_path = os.path.abspath(r'C:/Users/ahmtt/Documents/VS/API KEY')
if secret_path not in sys.path:
    sys.path.insert(0, secret_path)
import openai
from secret import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT # type: ignore

import models, store, recovery, secret_loader
from models import ChatMsg, WorkoutLog, RecoveryScore
from store import store
from secret_loader import load_secrets
from recovery import calc_recovery, recommend_trainable, COMMON_MUSCLES
import io

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
    _rate_task = asyncio.create_task(reset_rate())

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
        last_trained = dict.fromkeys(COMMON_MUSCLES, None)
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

@app.post("/chat")
async def chat(request: Request):
    """Chat endpoint for Azure OpenAI integration."""
    data = await request.json()
    user_message = data.get("message", "")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")
    try:
        secrets = load_secrets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading secrets: {str(e)}")
    try:
        print("Task started with Chat API")
        client = openai.AzureOpenAI(
            api_key=secrets.AZURE_OPENAI_API_KEY,
            api_version="2023-05-15",
            azure_endpoint=secrets.AZURE_OPENAI_ENDPOINT,
        )
        response = client.chat.completions.create(
            model=secrets.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are Vitalis, a highly knowledgeable, friendly, and supportive personal AI health companion. Your mission is to help users reach, understand, and maintain their fitness goals through education, motivation, and practical advice. Always keep answers extremely concise (1-2 sentences), but make them packed with value, encouragement, and actionable tips. You specialize in fitness, nutrition, recovery, motivation, and healthy habits. When responding, always:\n- Greet the user warmly and positively.\n- Give advice that is clear, practical, and easy to follow.\n- Motivate and encourage the user to keep going, even if they face setbacks.\n- Educate the user about the science and benefits behind your advice.\n- Use simple, friendly language and avoid jargon.\n- Be empathetic, supportive, and never judgmental.\n- If the user asks about goals, progress, or struggles, offer specific encouragement and a quick tip.\n- If the user asks about workouts, nutrition, or recovery, give a short, science-backed suggestion.\n- Never give medical advice, but always encourage healthy habits and consulting professionals for serious issues.\n- End every reply with a positive, motivational note.\nYou are always super friendly, energetic, and focused on helping the user succeed in their health journey."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=128,
            temperature=0.7
        )
        ai_message = response.choices[0].message.content
        print("Task complete Chat API")
        return {"response": ai_message}
    except Exception as e:
        print("Chat exception:", e)
        raise HTTPException(status_code=500, detail=f"Error from OpenAI: {str(e)}")

@app.get("/voice-assistant")
async def voice_assistant():
    """Return a predefined workout voice assistant flow with messages and durations."""
    # Simple 1-2 minute workout sequence
    steps = [
        {"message": "Warm up! March in place for 30 seconds.", "duration": 30},
        {"message": "Do jumping jacks for 30 seconds. Keep moving!", "duration": 30},
        {"message": "Take a 10-second rest and breathe deeply.", "duration": 10},
        {"message": "Perform push-ups for 30 seconds. You got this!", "duration": 30},
        {"message": "Cool down with gentle stretches for 20 seconds.", "duration": 20},
    ]
    return {"steps": steps}
 
# Speech-to-Text endpoint: convert user audio to text
@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """Convert uploaded audio file to text via Azure Speech API."""
    try:
        secrets = load_secrets()
        audio_bytes = await file.read()
        # Use STT credentials and endpoint
        headers = {
            'Ocp-Apim-Subscription-Key': secrets.AZURE_SPEECH_STT_KEY,
            'Ocp-Apim-Subscription-Region': secrets.AZURE_SPEECH_STT_REGION,
            'Content-Type': 'application/octet-stream',
        }
        print("Task started with Speech-to-Text API")
        async with httpx.AsyncClient() as client:
            resp = await client.post(secrets.AZURE_SPEECH_STT_ENDPOINT, content=audio_bytes, headers=headers)
        resp.raise_for_status()
        print("Task complete Speech-to-Text API")
        data = resp.json()
        text = data.get('DisplayText') or data.get('text', '')
        return {'text': text}
    except Exception as e:
        print("Speech-to-text exception:", e)
        raise HTTPException(status_code=500, detail=f"Speech-to-text error: {str(e)}")

# Text-to-Speech endpoint: convert AI text response to audio
@app.post("/text-to-speech")
async def text_to_speech(body: dict = Body(...)):
    """Convert provided text to speech audio via Azure TTS API."""
    try:
        text = body.get('text', '')
        secrets = load_secrets()
        # Use TTS credentials and endpoint
        tts_url = secrets.AZURE_SPEECH_TTS_ENDPOINT
        ssml = (
            """<speak version='1.0' xml:lang='en-US'>"""
            f"<voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>{text}</voice>"
            """</speak>"""
        )
        headers = {
            'Ocp-Apim-Subscription-Key': secrets.AZURE_SPEECH_TTS_KEY,
            'Ocp-Apim-Subscription-Region': secrets.AZURE_SPEECH_TTS_REGION,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3'
        }
        print("Task started with Text-to-Speech API")
        async with httpx.AsyncClient() as client:
            resp = await client.post(tts_url, content=ssml.encode('utf-8'), headers=headers)
        resp.raise_for_status()
        print("Task complete Text-to-Speech API")
        return StreamingResponse(io.BytesIO(resp.content), media_type='audio/mpeg')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech error: {str(e)}")