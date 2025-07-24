"""Recovery score calculation utility."""
from typing import Dict, List
from datetime import datetime, timedelta

# Muscle list for reference
COMMON_MUSCLES = [
    "quads", "hamstrings", "glutes", "calves", "chest", "back", "shoulders", "biceps", "triceps", "core", "forearms"
]

RECENT_HOURS = 24
RECENTLY_TRAINED_HOURS = 48


def calc_recovery(
    logs: List[dict],
    now: datetime
) -> Dict[str, int]:
    """Calculate recovery scores for each muscle group."""
    scores = {m: 100 for m in COMMON_MUSCLES}
    last_trained = {m: None for m in COMMON_MUSCLES}
    doms = {m: 0 for m in COMMON_MUSCLES}
    for log in logs:
        ts = log.get("ts")
        if not ts:
            continue
        for m in log.get("muscles", []):
            if last_trained[m] is None or ts > last_trained[m]:
                last_trained[m] = ts
            doms[m] = max(doms[m], log.get("soreness", 0))
    for m in COMMON_MUSCLES:
        # -40 if trained in last 24h
        if last_trained[m] and (now - last_trained[m]).total_seconds() < RECENT_HOURS * 3600:
            scores[m] -= 40
        # -30 * (DOMS_scale/10)
        scores[m] -= int(30 * (doms[m] / 10))
        # Sleep/HRV always zero for demo
        # Clamp
        scores[m] = max(0, min(100, scores[m]))
    return scores

def recommend_trainable(scores: Dict[str, int], last_trained: Dict[str, datetime], now: datetime) -> List[str]:
    """Return list of trainable muscles (score>=71, not trained <48h), else ['Rest / Mobility']."""
    trainable = [
        m for m, s in scores.items()
        if s >= 71 and (not last_trained[m] or (now - last_trained[m]).total_seconds() > RECENTLY_TRAINED_HOURS * 3600)
    ]
    return trainable if trainable else ["Rest / Mobility"] 