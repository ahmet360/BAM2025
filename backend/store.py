"""In-memory store for chat and workout logs."""
from typing import Dict, List, Any
from collections import deque
from datetime import datetime

CHAT_HISTORY_LIMIT = 20

class Store:
    """Simple in-memory store for user data."""
    def __init__(self):
        self.chat_history: Dict[str, deque] = {}
        self.workout_logs: Dict[str, List[dict]] = {}
        self.chat_rate: Dict[str, int] = {}

    def append_chat(self, uid: str, role: str, content: str):
        """Append a chat message to history, capped."""
        if uid not in self.chat_history:
            self.chat_history[uid] = deque(maxlen=CHAT_HISTORY_LIMIT * 2)
        self.chat_history[uid].append({"role": role, "content": content})

    def get_chat_history(self, uid: str) -> List[dict]:
        """Get recent chat history for user."""
        return list(self.chat_history.get(uid, []))[-CHAT_HISTORY_LIMIT*2:]

    def log_workout(self, uid: str, log: dict):
        """Log a workout for user."""
        if uid not in self.workout_logs:
            self.workout_logs[uid] = []
        self.workout_logs[uid].append(log)

    def get_workouts(self, uid: str) -> List[dict]:
        """Get all workout logs for user."""
        return self.workout_logs.get(uid, [])

store = Store() 