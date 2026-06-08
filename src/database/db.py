"""
Инициализация и управление подключением к SQLite.
"""

import aiosqlite
from src.config import config
from src.database.models import TABLES_SQL


_db_connection: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """Получить подключение к базе данных."""
    global _db_connection
    if _db_connection is None:
        _db_connection = await aiosqlite.connect(config.DB_PATH)
        _db_connection.row_factory = aiosqlite.Row
        await _db_connection.execute("PRAGMA journal_mode=WAL")
        await _db_connection.execute("PRAGMA foreign_keys=ON")
    return _db_connection


async def init_db() -> None:
    """Создать таблицы, если они не существуют."""
    db = await get_db()
    await db.executescript(TABLES_SQL)
    await db.commit()
    print("[OK] Baza dannyh inicializirovana.")


async def close_db() -> None:
    """Закрыть подключение к базе данных."""
    global _db_connection
    if _db_connection is not None:
        await _db_connection.close()
        _db_connection = None
        print("[OK] Podklyuchenie k BD zakryto.")
