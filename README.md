# VIRUS GAME BOT — Telegram WebApp

Полный клон Telegram Mini App с рулеткой, инвентарём, заданиями, магазином, историей и реферальной системой.

## Стек

- **Backend**: Python 3.12, FastAPI, aiogram 3, SQLAlchemy 2 (async), SQLite (aiosqlite)
- **Frontend**: Vanilla JS (ES modules), Telegram WebApp SDK
- **Деплой**: Fly.io (single Docker image, persistent volume для SQLite)

## Структура

```
app/
  main.py            FastAPI + lifespan: запуск бота (polling | webhook)
  bot.py             aiogram dispatcher и хендлеры
  config.py          pydantic-settings
  db.py              async engine + sessionmaker
  models.py          ORM-модели (User, InventoryItem, HistoryEntry, ...)
  auth.py            валидация Telegram initData (HMAC)
  game/
    prizes.py        призовые таблицы рулетки
    shop_items.py    каталог магазина
    tasks_data.py    задания
  api/
    users.py         GET /api/me
    roulette.py      POST /api/roulette/spin
    inventory.py     GET /api/inventory
    shop.py          GET /api/shop, POST /api/shop/buy
    tasks.py         GET /api/tasks, POST /api/tasks/claim
    history.py       GET /api/history
    referral.py      GET /api/referral
web/
  index.html
  css/styles.css
  js/
    app.js           роутер + загрузка пользователя
    api.js           fetch helper, прикрепляет initData
    ui.js            DOM-helper, тосты, модалки
    screens/
      home.js
      roulette.js
      tasks.js
      shop.js
      history.js
      inventory.js   (модалка)
      referral.js    (модалка)
```

## Локальный запуск

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # заполнить TELEGRAM_BOT_TOKEN, BOT_USERNAME, WEBAPP_URL
uvicorn app.main:app --reload
```

В dev-режиме (`USE_WEBHOOK=false`) бот работает на long polling.
В проде на Fly.io (`USE_WEBHOOK=true`) — webhook `/tg/webhook` с секретом.

## Деплой на Fly.io

```bash
fly launch --no-deploy        # один раз; создаст приложение
fly volumes create virus_data --region fra --size 1
fly secrets set \
  TELEGRAM_BOT_TOKEN=... \
  WEBAPP_URL=https://<your-app>.fly.dev \
  WEBHOOK_SECRET=$(openssl rand -hex 24)
fly deploy
```

После первого деплоя приложение само установит вебхук и задаст menu-button с WebApp URL.

## Как работает авторизация

Каждый запрос фронта шлёт заголовок `X-Telegram-Init-Data`. Бэк валидирует HMAC-SHA256 от bot token (стандартная Telegram схема), парсит `user`, заводит/находит запись в БД и возвращает её. Если ссылка открыта по `?start=ref_<tg_id>`, на бэке начисляется реферальный бонус приглашающему.

## Конфигурация призов

Правьте `app/game/prizes.py` — веса (вероятности) и сами призы. Аналогично `shop_items.py` и `tasks_data.py`.

## Команды бота

- `/start` — открыть приложение (с inline-кнопкой WebApp)
- `/start ref_<tg_id>` — реферальный заход
- `/ref` — личная реферальная ссылка
- `/help`
