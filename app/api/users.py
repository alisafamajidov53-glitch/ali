from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.schemas import UserOut
from app.auth import current_user
from app.models import User

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("", response_model=UserOut)
async def get_me(user: User = Depends(current_user)) -> User:
    return user
