from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import TaskClaimRequest, TaskOut
from app.auth import current_user
from app.db import get_session
from app.game.tasks_data import TASKS, find_task
from app.models import CompletedTask, HistoryEntry, User

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _daily_ready(last: datetime | None) -> bool:
    if last is None:
        return True
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last >= timedelta(hours=24)


async def _task_state(session: AsyncSession, user: User, task: dict) -> tuple[bool, bool]:
    """Return (completed, can_claim)."""
    if task["key"] == "daily_bonus":
        ready = _daily_ready(user.last_daily_bonus_at)
        return (False, ready)
    if task.get("check") == "referral_count>=1":
        done = user.referral_count >= 1
    else:
        done = False
    row = (
        await session.execute(
            select(CompletedTask).where(CompletedTask.user_id == user.id, CompletedTask.task_key == task["key"])
        )
    ).scalar_one_or_none()
    already = row is not None
    if task["key"] == "subscribe_channel":
        # trust-based — user can claim once
        return (already, not already)
    return (already, done and not already)


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[TaskOut]:
    out: list[TaskOut] = []
    for t in TASKS:
        completed, can_claim = await _task_state(session, user, t)
        out.append(
            TaskOut(
                key=t["key"],
                title=t["title"],
                description=t["description"],
                url=t.get("url"),
                reward=t["reward"],
                currency=t["currency"],
                repeatable=t["repeatable"],
                completed=completed,
                can_claim=can_claim,
            )
        )
    return out


@router.post("/claim")
async def claim(
    req: TaskClaimRequest,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    task = find_task(req.key)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    user_db = (await session.execute(select(User).where(User.id == user.id))).scalar_one()
    completed, can_claim = await _task_state(session, user_db, task)
    if not can_claim:
        raise HTTPException(status_code=400, detail="not claimable")

    reward = int(task["reward"])
    currency = task["currency"]
    if currency == "coins":
        user_db.balance += reward
    elif currency == "stars":
        user_db.stars += reward

    if task["key"] == "daily_bonus":
        user_db.last_daily_bonus_at = datetime.now(timezone.utc)
    else:
        session.add(CompletedTask(user_id=user_db.id, task_key=task["key"]))

    session.add(
        HistoryEntry(
            user_id=user_db.id,
            type="task_claim",
            amount=reward,
            details=task["key"],
        )
    )
    await session.commit()
    await session.refresh(user_db)
    return {"ok": True, "new_balance": user_db.balance, "new_stars": user_db.stars}
