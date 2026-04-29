from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import InventoryItemOut
from app.auth import current_user
from app.db import get_session
from app.game.prizes import ITEMS
from app.models import InventoryItem, User

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryItemOut])
async def list_inventory(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[InventoryItemOut]:
    rows = (
        await session.execute(
            select(InventoryItem).where(InventoryItem.user_id == user.id, InventoryItem.qty > 0)
        )
    ).scalars().all()
    out: list[InventoryItemOut] = []
    for r in rows:
        info = ITEMS.get(r.item_key, {"name": r.item_key, "emoji": "❔", "rarity": "common"})
        out.append(
            InventoryItemOut(
                key=r.item_key,
                name=info["name"],
                emoji=info["emoji"],
                rarity=info["rarity"],
                qty=r.qty,
            )
        )
    return out
