from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import HistoryOut
from app.auth import current_user
from app.db import get_session
from app.models import HistoryEntry, User

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryOut])
async def list_history(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
) -> list[HistoryOut]:
    rows = (
        await session.execute(
            select(HistoryEntry)
            .where(HistoryEntry.user_id == user.id)
            .order_by(HistoryEntry.created_at.desc())
            .limit(min(limit, 200))
        )
    ).scalars().all()
    return [
        HistoryOut(
            id=r.id,
            type=r.type,
            amount=r.amount,
            item_key=r.item_key,
            details=r.details,
            created_at=r.created_at,
        )
        for r in rows
    ]
