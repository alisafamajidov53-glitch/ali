from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ShopBuyRequest, ShopItemOut
from app.auth import current_user
from app.db import get_session
from app.game.shop_items import SHOP, find_shop_item
from app.models import HistoryEntry, InventoryItem, User

router = APIRouter(prefix="/api/shop", tags=["shop"])


@router.get("", response_model=list[ShopItemOut])
async def list_shop() -> list[ShopItemOut]:
    return [ShopItemOut(**it) for it in SHOP]


@router.post("/buy")
async def buy(
    req: ShopBuyRequest,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    item = find_shop_item(req.key)
    if not item:
        raise HTTPException(status_code=404, detail="item not found")
    user_db = (await session.execute(select(User).where(User.id == user.id))).scalar_one()
    price = int(item["price"])
    currency = item["currency"]
    if currency == "coins":
        if user_db.balance < price:
            raise HTTPException(status_code=400, detail="insufficient balance")
        user_db.balance -= price
    elif currency == "stars":
        if user_db.stars < price:
            raise HTTPException(status_code=400, detail="insufficient stars")
        user_db.stars -= price
    else:
        raise HTTPException(status_code=400, detail="bad currency")

    existing = (
        await session.execute(
            select(InventoryItem).where(InventoryItem.user_id == user_db.id, InventoryItem.item_key == item["key"])
        )
    ).scalar_one_or_none()
    if existing:
        existing.qty += 1
    else:
        session.add(InventoryItem(user_id=user_db.id, item_key=item["key"], qty=1))

    session.add(
        HistoryEntry(
            user_id=user_db.id,
            type="shop_buy",
            amount=-price,
            item_key=item["key"],
            details=f"{currency}",
        )
    )
    await session.commit()
    await session.refresh(user_db)
    return {
        "ok": True,
        "new_balance": user_db.balance,
        "new_stars": user_db.stars,
    }
