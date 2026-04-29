from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from aiogram.types import Update
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import history, inventory, referral, roulette, shop, tasks, users
from app.bot import create_bot, dp, set_menu_button
from app.config import get_settings
from app.db import init_db

log = logging.getLogger(__name__)

_bot_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bot_task
    await init_db()
    s = get_settings()
    bot = create_bot() if s.telegram_bot_token else None
    app.state.bot = bot

    if bot:
        if s.use_webhook:
            webhook_url = f"{s.webapp_url}/tg/webhook"
            await bot.set_webhook(
                url=webhook_url,
                secret_token=s.webhook_secret,
                drop_pending_updates=True,
            )
            await set_menu_button(bot)
            log.info("webhook set to %s", webhook_url)
        else:
            await bot.delete_webhook(drop_pending_updates=True)
            await set_menu_button(bot)
            _bot_task = asyncio.create_task(dp.start_polling(bot, handle_signals=False))
            log.info("bot polling started")

    try:
        yield
    finally:
        if _bot_task:
            _bot_task.cancel()
            try:
                await _bot_task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
        if bot:
            await bot.session.close()


def create_app() -> FastAPI:
    app = FastAPI(title="VIRUS GAME BOT", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(users.router)
    app.include_router(roulette.router)
    app.include_router(inventory.router)
    app.include_router(shop.router)
    app.include_router(tasks.router)
    app.include_router(history.router)
    app.include_router(referral.router)

    @app.post("/tg/webhook")
    async def tg_webhook(
        request: Request,
        x_telegram_bot_api_secret_token: str | None = Header(None),
    ) -> dict:
        s = get_settings()
        if s.use_webhook and x_telegram_bot_api_secret_token != s.webhook_secret:
            raise HTTPException(status_code=401, detail="bad secret")
        bot = request.app.state.bot
        if not bot:
            raise HTTPException(status_code=503, detail="bot not running")
        data = await request.json()
        update = Update.model_validate(data, context={"bot": bot})
        await dp.feed_update(bot, update)
        return {"ok": True}

    @app.get("/healthz")
    async def healthz() -> dict:
        return {"ok": True}

    app.mount("/static", StaticFiles(directory="web"), name="static")

    @app.get("/")
    async def index() -> FileResponse:
        return FileResponse("web/index.html")

    return app


app = create_app()
