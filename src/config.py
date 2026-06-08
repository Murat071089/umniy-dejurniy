"""
Конфигурация приложения.
Загружает переменные окружения из файла .env.
"""

import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()


class Config:
    """Настройки приложения."""

    # Токен Telegram-бота
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

    # Группа по умолчанию
    DEFAULT_GROUP: str = os.getenv("DEFAULT_GROUP", "ИС-21")

    # Путь к файлу базы данных
    DB_PATH: str = os.getenv("DB_PATH", "smart_duty.db")

    @classmethod
    def validate(cls) -> None:
        """Проверяет, что все обязательные настройки заданы."""
        if not cls.BOT_TOKEN or cls.BOT_TOKEN == "your_bot_token_here":
            raise ValueError(
                "ERROR: BOT_TOKEN not set!\n"
                "1. Create bot via @BotFather in Telegram.\n"
                "2. Copy the token.\n"
                "3. Create .env file and add: BOT_TOKEN=your_token"
            )


config = Config()
