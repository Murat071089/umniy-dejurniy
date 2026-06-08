"""
Главный модуль приложения.
Инициализирует бота, базу данных и запускает polling.
"""

import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from src.config import Config
from src.database.db import init_db, close_db
from src.database.seed import seed_database
from src.bot.handlers import router


# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("smart_duty")


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
