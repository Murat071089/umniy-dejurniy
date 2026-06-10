"""
Главный модуль приложения.
Инициализирует бота, базу данных и запускает polling.
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Update
from aiogram.dispatcher.middlewares.base import BaseMiddleware
from typing import Callable, Dict, Any, Awaitable

from src.config import Config
from src.database.db import init_db, close_db
from src.database.seed import seed_database
from src.bot.handlers import router


# Настройка логирования (консоль + файл с ротацией логов)
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(log_dir, exist_ok=True)
bot_log_path = os.path.join(log_dir, "bot.log")

log_formatter = logging.Formatter(
    fmt="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

file_handler = RotatingFileHandler(
    bot_log_path,
    maxBytes=5 * 1024 * 1024,  # 5 MB
    backupCount=3,
    encoding="utf-8",
)
file_handler.setFormatter(log_formatter)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.handlers.clear()
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)

logger = logging.getLogger("smart_duty")


class LoggingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        try:
            if event.message:
                msg = event.message
                user = msg.from_user
                user_info = f"User(id={user.id}, username={user.username})" if user else "UnknownUser"
                logger.info(f"Incoming Message from {user_info}: text='{msg.text}' voice={bool(msg.voice)}")
            elif event.callback_query:
                cb = event.callback_query
                user = cb.from_user
                user_info = f"User(id={user.id}, username={user.username})" if user else "UnknownUser"
                logger.info(f"Incoming CallbackQuery from {user_info}: data='{cb.data}'")
            else:
                logger.info(f"Incoming Update: ID={event.update_id}")
        except Exception as e:
            logger.error(f"Error in LoggingMiddleware: {e}")
        return await handler(event, data)


async def main() -> None:
    """Точка входа: инициализация и запуск бота."""

    # Проверяем конфигурацию
    Config.validate()

    logger.info("Zapusk bota 'Umniy dezhurniy'...")

    # Инициализируем базу данных
    await init_db()
    await seed_database()

    # Создаём бота
    bot = Bot(
        token=Config.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    # Создаём диспетчер
    dp = Dispatcher()
    dp.update.outer_middleware(LoggingMiddleware())
    dp.include_router(router)

    logger.info("Bot zapuschen i ozhidaet soobscheniya.")
    logger.info("   Press Ctrl+C to stop.")

    try:
        # Удаляем вебхук, если был установлен
        await bot.delete_webhook(drop_pending_updates=True)
        # Запускаем polling
        await dp.start_polling(bot)
    finally:
        await close_db()
        await bot.session.close()
        logger.info("Bot ostanovlen.")
