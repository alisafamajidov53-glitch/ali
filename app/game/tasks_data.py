"""Static task catalog. Completion checked client-side + backend trust."""

from __future__ import annotations

TASKS: list[dict] = [
    {
        "key": "subscribe_channel",
        "title": "Подписаться на канал",
        "description": "Подпишись на наш Telegram-канал",
        "url": "https://t.me/your_channel",
        "reward": 100,
        "currency": "coins",
        "repeatable": False,
    },
    {
        "key": "invite_friend",
        "title": "Пригласить друга",
        "description": "Пригласи хотя бы одного друга по реферальной ссылке",
        "url": None,
        "reward": 200,
        "currency": "coins",
        "repeatable": False,
        "check": "referral_count>=1",
    },
    {
        "key": "daily_bonus",
        "title": "Ежедневный бонус",
        "description": "Забирай бонус раз в 24 часа",
        "url": None,
        "reward": 50,
        "currency": "coins",
        "repeatable": True,
    },
]


def find_task(key: str) -> dict | None:
    for t in TASKS:
        if t["key"] == key:
            return t
    return None
