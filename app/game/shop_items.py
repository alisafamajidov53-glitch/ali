"""Static shop catalog."""

from __future__ import annotations

SHOP: list[dict] = [
    {"key": "birthday", "name": "День рождения", "emoji": "🎂", "price": 100, "currency": "coins"},
    {"key": "teddy", "name": "Мишка", "emoji": "🧸", "price": 500, "currency": "coins"},
    {"key": "gift", "name": "Подарок", "emoji": "🎁", "price": 750, "currency": "coins"},
    {"key": "deer", "name": "Олень", "emoji": "🦌", "price": 2000, "currency": "coins"},
    {"key": "heart_key", "name": "Сердце-ключ", "emoji": "💖", "price": 5, "currency": "stars"},
]


def find_shop_item(key: str) -> dict | None:
    for it in SHOP:
        if it["key"] == key:
            return it
    return None
