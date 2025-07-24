"""Pydantic models for API requests and responses."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

COMMON_MUSCLES = [
    "quads", "hamstrings", "glutes", "calves", "chest", "back", "shoulders", "biceps", "triceps", "core", "forearms"
]

class ChatMsg(BaseModel):
    """Chat message from user to coach."""
    uid: str
    message: str

class RecoveryScore(BaseModel):
    """Recovery scores and recommendations."""
    muscle_scores: Dict[str, int]
    recommended: List[str]
    updated_at: datetime

class WorkoutLog(BaseModel):
    """Workout log entry."""
    uid: str
    muscles: List[str]
    effort: int = Field(..., ge=1, le=10)
    soreness: int = Field(..., ge=0, le=10)
    duration_min: int
    ts: Optional[datetime] = None 