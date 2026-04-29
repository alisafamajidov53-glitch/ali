from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.schemas import ReferralInfo
from app.auth import current_user
from app.config import get_settings
from app.models import User

router = APIRouter(prefix="/api/referral", tags=["referral"])


@router.get("", response_model=ReferralInfo)
async def referral_info(user: User = Depends(current_user)) -> ReferralInfo:
    s = get_settings()
    link = f"https://t.me/{s.bot_username}?start=ref_{user.tg_id}"
    return ReferralInfo(link=link, count=user.referral_count, reward_per_invite=s.referral_reward)
