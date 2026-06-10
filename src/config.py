import os
from pathlib import Path
from dotenv import load_dotenv

# Путь к корню проекта
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

# Загружаем .env файл по абсолютному пути
load_dotenv(dotenv_path=env_path)


class Config:
    """Настройки приложения."""

    # Токен Telegram-бота
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

    # Группа по умолчанию
    DEFAULT_GROUP: str = os.getenv("DEFAULT_GROUP", "ИС-21")

    # Путь к файлу базы данных (всегда приводим к абсолютному относительно корня проекта)
    _db_path = os.getenv("DB_PATH", "smart_duty.db")
    DB_PATH: str = (
        _db_path if os.path.isabs(_db_path) else str(BASE_DIR / _db_path)
    )

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
