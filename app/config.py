from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    telegram_bot_token: str = ""
    bot_username: str = "virus_play_bot"
    webapp_url: str = "http://localhost:8000"
    webhook_secret: str = "change-me"
    use_webhook: bool = False

    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    start_balance: int = 100
    referral_reward: int = 50

    admin_ids: str = ""

    @property
    def admin_id_list(self) -> list[int]:
        return [int(x.strip()) for x in self.admin_ids.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
