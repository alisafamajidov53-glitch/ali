from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from app.config import get_settings

log = logging.getLogger(__name__)

dp = Dispatcher()


def _main_kb(webapp_url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎰 Открыть приложение", web_app=WebAppInfo(url=webapp_url))],
        ]
    )


@dp.message(CommandStart(deep_link=True))
async def start_with_ref(message: Message, command: CommandObject) -> None:
    s = get_settings()
    ref = command.args or ""
    url = s.webapp_url
    if ref:
        # pass start_param through; Telegram forwards ?startapp=... via WebApp initData
        url = f"{s.webapp_url}?tgWebAppStartParam={ref}"
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎰 Открыть приложение", web_app=WebAppInfo(url=url))],
        ]
    )
    await message.answer(
        "<b>VIRUS GAME BOT</b>\nДобро пожаловать! Нажми кнопку ниже, чтобы открыть приложение.",
        reply_markup=kb,
    )


@dp.message(CommandStart())
async def start(message: Message) -> None:
    s = get_settings()
    await message.answer(
        "<b>VIRUS GAME BOT</b>\nДобро пожаловать! Нажми кнопку ниже, чтобы открыть приложение.",
        reply_markup=_main_kb(s.webapp_url),
    )


@dp.message(Command("help"))
async def help_cmd(message: Message) -> None:
    await message.answer(
        "Команды:\n"
        "/start — открыть приложение\n"
        "/ref — твоя реферальная ссылка\n"
        "/help — помощь",
    )


@dp.message(Command("ref"))
async def ref_cmd(message: Message) -> None:
    s = get_settings()
    tg_id = message.from_user.id if message.from_user else 0
    link = f"https://t.me/{s.bot_username}?start=ref_{tg_id}"
    await message.answer(f"Твоя реферальная ссылка:\n{link}")


@dp.message(F.text)
async def fallback(message: Message) -> None:
    s = get_settings()
    await message.answer("Открой приложение, чтобы играть:", reply_markup=_main_kb(s.webapp_url))


async def set_menu_button(bot: Bot) -> None:
    s = get_settings()
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Открыть", web_app=WebAppInfo(url=s.webapp_url))
        )
    except Exception as e:  # noqa: BLE001
        log.warning("failed to set menu button: %s", e)


def create_bot() -> Bot:
    s = get_settings()
    return Bot(
        token=s.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


async def run_polling() -> None:
    bot = create_bot()
    await set_menu_button(bot)
    await dp.start_polling(bot, handle_signals=False)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_polling())
