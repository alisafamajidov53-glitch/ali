from __future__ import annotations

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import PrizeOut, SpinRequest, SpinResponse
from app.auth import current_user
from app.db import get_session
from app.game.prizes import BET_COST, ITEMS, PRIZES
from app.models import HistoryEntry, InventoryItem, User

router = APIRouter(prefix="/api/roulette", tags=["roulette"])


def _roll_prize(bet: str) -> dict:
    table = PRIZES[bet]
    total = sum(w for w, _ in table)
    roll = random.uniform(0, total)
    acc = 0.0
    for w, prize in table:
        acc += w
        if roll <= acc:
            return prize
    return table[-1][1]


@router.post("/spin", response_model=SpinResponse)
async def spin(
    req: SpinRequest,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> SpinResponse:
    if req.bet not in BET_COST:
        raise HTTPException(status_code=400, detail="bad bet")
    cost = BET_COST[req.bet]

    # re-load user in this session
    user_db = (await session.execute(select(User).where(User.id == user.id))).scalar_one()

    if user_db.balance < cost:
        raise HTTPException(status_code=400, detail="insufficient balance")

    user_db.balance -= cost
    user_db.total_spins += 1

    prize = _roll_prize(req.bet)
    awarded_coins = 0
    awarded_stars = 0
    item_key: str | None = None
    item_qty = 0

    if prize["type"] == "coins":
        awarded_coins = int(prize["amount"])
        user_db.balance += awarded_coins
        user_db.total_won += awarded_coins
    elif prize["type"] == "stars":
        awarded_stars = int(prize["amount"])
        user_db.stars += awarded_stars
    elif prize["type"] == "item":
        item_key = prize["key"]
        item_qty = int(prize.get("qty", 1))
        existing = (
            await session.execute(
                select(InventoryItem).where(InventoryItem.user_id == user_db.id, InventoryItem.item_key == item_key)
            )
        ).scalar_one_or_none()
        if existing:
            existing.qty += item_qty
        else:
            session.add(InventoryItem(user_id=user_db.id, item_key=item_key, qty=item_qty))

    won = prize["type"] != "coins" or awarded_coins > 0
    session.add(
        HistoryEntry(
            user_id=user_db.id,
            type="spin_win" if won else "spin_loss",
            amount=awarded_coins - cost if prize["type"] == "coins" else -cost,
            item_key=item_key,
            details=f"bet={req.bet} cost={cost}",
        )
    )

    await session.commit()
    await session.refresh(user_db)

    item_info = ITEMS.get(item_key) if item_key else None
    prize_out = PrizeOut(
        type=prize["type"],
        amount=awarded_coins if prize["type"] == "coins" else awarded_stars,
        key=item_key,
        qty=item_qty,
        name=item_info["name"] if item_info else None,
        emoji=item_info["emoji"] if item_info else None,
    )
    return SpinResponse(
        prize=prize_out,
        new_balance=user_db.balance,
        new_stars=user_db.stars,
        bet_amount=cost,
    )
