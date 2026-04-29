"""Roulette prize tables per bet tier.

Each tier has a list of (weight, prize) pairs. Prize is a dict with either
{"type": "coins", "amount": int}, {"type": "stars", "amount": int} or
{"type": "item", "key": str, "qty": int}.

Tune weights freely — bigger weight = more common outcome.
"""

from __future__ import annotations

BET_COST = {
    "1x": 10,
    "10x": 100,
    "100x": 1000,
}

PRIZES: dict[str, list[tuple[int, dict]]] = {
    "1x": [
        (40, {"type": "coins", "amount": 0}),
        (30, {"type": "coins", "amount": 5}),
        (15, {"type": "coins", "amount": 15}),
        (8, {"type": "coins", "amount": 25}),
        (5, {"type": "coins", "amount": 50}),
        (1, {"type": "item", "key": "birthday", "qty": 1}),
        (1, {"type": "stars", "amount": 1}),
    ],
    "10x": [
        (35, {"type": "coins", "amount": 50}),
        (25, {"type": "coins", "amount": 100}),
        (15, {"type": "coins", "amount": 200}),
        (10, {"type": "coins", "amount": 500}),
        (5, {"type": "coins", "amount": 1000}),
        (5, {"type": "item", "key": "teddy", "qty": 1}),
        (4, {"type": "item", "key": "gift", "qty": 1}),
        (1, {"type": "stars", "amount": 5}),
    ],
    "100x": [
        (25, {"type": "coins", "amount": 500}),
        (20, {"type": "coins", "amount": 1500}),
        (15, {"type": "coins", "amount": 3000}),
        (10, {"type": "coins", "amount": 5000}),
        (5, {"type": "coins", "amount": 10000}),
        (10, {"type": "item", "key": "teddy", "qty": 1}),
        (7, {"type": "item", "key": "gift", "qty": 1}),
        (5, {"type": "item", "key": "deer", "qty": 1}),
        (2, {"type": "item", "key": "heart_key", "qty": 1}),
        (1, {"type": "stars", "amount": 25}),
    ],
}

ITEMS: dict[str, dict] = {
    "birthday": {"name": "День рождения", "emoji": "🎂", "rarity": "common"},
    "teddy": {"name": "Мишка", "emoji": "🧸", "rarity": "rare"},
    "gift": {"name": "Подарок", "emoji": "🎁", "rarity": "rare"},
    "deer": {"name": "Олень", "emoji": "🦌", "rarity": "epic"},
    "heart_key": {"name": "Сердце-ключ", "emoji": "💖", "rarity": "legendary"},
    "dog": {"name": "Пёс", "emoji": "🐶", "rarity": "common"},
}
