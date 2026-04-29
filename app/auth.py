from __future__ import annotations

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.models import User

MAX_INIT_DATA_AGE = 24 * 60 * 60  # 24h


def verify_init_data(init_data: str, bot_token: str, max_age: int = MAX_INIT_DATA_AGE) -> dict:
    """Validate Telegram WebApp initData and return parsed fields.

    Raises ValueError on any failure.
    """
    if not init_data:
        raise ValueError("empty init data")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("missing hash")

    # build data_check_string
    data_check_string = "\n".join(f"{k}={parsed[k]}" for k in sorted(parsed.keys()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("bad hash")

    auth_date = int(parsed.get("auth_date", "0"))
    if auth_date and time.time() - auth_date > max_age:
        raise ValueError("init data expired")

    user_raw = parsed.get("user")
    if user_raw:
        parsed["user"] = json.loads(user_raw)

    start_param = parsed.get("start_param")
    if start_param:
        parsed["start_param"] = start_param

    return parsed


async def _get_or_create_user(session: AsyncSession, tg_user: dict, start_param: str | None) -> User:
    settings = get_settings()
    tg_id = int(tg_user["id"])
    result = await session.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()
    if user:
        # refresh changeable fields
        changed = False
        if tg_user.get("username") and user.username != tg_user.get("username"):
            user.username = tg_user.get("username")
            changed = True
        if tg_user.get("first_name") and user.first_name != tg_user.get("first_name"):
            user.first_name = tg_user.get("first_name")
            changed = True
        if tg_user.get("photo_url") and user.photo_url != tg_user.get("photo_url"):
            user.photo_url = tg_user.get("photo_url")
            changed = True
        if changed:
            await session.flush()
        return user

    user = User(
        tg_id=tg_id,
        username=tg_user.get("username"),
        first_name=tg_user.get("first_name"),
        language_code=tg_user.get("language_code"),
        photo_url=tg_user.get("photo_url"),
        balance=settings.start_balance,
    )
    session.add(user)
    await session.flush()

    # referral
    if start_param and start_param.startswith("ref_"):
        try:
            inviter_tg_id = int(start_param[4:])
        except ValueError:
            inviter_tg_id = 0
        if inviter_tg_id and inviter_tg_id != tg_id:
            inviter = (await session.execute(select(User).where(User.tg_id == inviter_tg_id))).scalar_one_or_none()
            if inviter:
                from app.models import HistoryEntry, Referral

                user.referred_by_id = inviter.id
                inviter.referral_count += 1
                inviter.balance += settings.referral_reward
                session.add(Referral(inviter_id=inviter.id, invitee_id=user.id, reward_paid=True))
                session.add(
                    HistoryEntry(
                        user_id=inviter.id,
                        type="referral",
                        amount=settings.referral_reward,
                        details=f"Referral from {user.tg_id}",
                    )
                )
                await session.flush()

    return user


async def current_user(
    x_telegram_init_data: str | None = Header(None, alias="X-Telegram-Init-Data"),
    session: AsyncSession = Depends(get_session),
) -> User:
    settings = get_settings()
    if not x_telegram_init_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing init data")
    try:
        data = verify_init_data(x_telegram_init_data, settings.telegram_bot_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"bad init data: {e}") from e

    tg_user = data.get("user")
    if not tg_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing user")

    user = await _get_or_create_user(session, tg_user, data.get("start_param"))
    await session.commit()
    return user
