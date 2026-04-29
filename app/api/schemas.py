from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class UserOut(BaseModel):
    tg_id: int
    username: str | None
    first_name: str | None
    photo_url: str | None
    balance: int
    stars: int
    level: int
    xp: int
    total_spins: int
    total_won: int
    referral_count: int

    class Config:
        from_attributes = True


class SpinRequest(BaseModel):
    bet: Literal["1x", "10x", "100x"]


class PrizeOut(BaseModel):
    type: Literal["coins", "stars", "item"]
    amount: int = 0
    key: str | None = None
    qty: int = 0
    name: str | None = None
    emoji: str | None = None


class SpinResponse(BaseModel):
    prize: PrizeOut
    new_balance: int
    new_stars: int
    bet_amount: int


class InventoryItemOut(BaseModel):
    key: str
    name: str
    emoji: str
    rarity: str
    qty: int


class HistoryOut(BaseModel):
    id: int
    type: str
    amount: int
    item_key: str | None
    details: str | None
    created_at: datetime


class ShopItemOut(BaseModel):
    key: str
    name: str
    emoji: str
    price: int
    currency: str


class ShopBuyRequest(BaseModel):
    key: str


class TaskOut(BaseModel):
    key: str
    title: str
    description: str
    url: str | None
    reward: int
    currency: str
    repeatable: bool
    completed: bool
    can_claim: bool


class TaskClaimRequest(BaseModel):
    key: str


class ReferralInfo(BaseModel):
    link: str
    count: int
    reward_per_invite: int
