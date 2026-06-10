"""
Инициализация и управление подключением к SQLite.
Автоматически чистит stale-блокировки при запуске.
Автоматически переподключается при потере соединения.
"""

import os
import logging
import asyncio
import aiosqlite
from src.config import config
from src.database.models import TABLES_SQL

logger = logging.getLogger(__name__)

_db_connection: aiosqlite.Connection | None = None
_db_lock = asyncio.Lock()


def _cleanup_stale_locks(db_path: str) -> None:
    """
    Удалить stale WAL/SHM файлы, если они остались от предыдущего
    некорректного завершения (закрытие терминала, kill процесса и т.д.).
    Это предотвращает ошибку 'database is locked' при повторном запуске.
    """
    shm_path = db_path + "-shm"
    wal_path = db_path + "-wal"

    for path in (shm_path, wal_path):
        if os.path.exists(path):
            try:
                os.remove(path)
                logger.info(f"Удалён stale-файл: {os.path.basename(path)}")
            except OSError:
                pass  # Файл занят — значит БД уже используется другим процессом


async def _create_connection() -> aiosqlite.Connection:
    """Создать новое подключение к БД с нужными настройками."""
    conn = await aiosqlite.connect(config.DB_PATH)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA foreign_keys=ON")
    # Таймаут ожидания блокировки — 10 секунд вместо мгновенной ошибки
    await conn.execute("PRAGMA busy_timeout=10000")
    return conn


async def get_db() -> aiosqlite.Connection:
    """Получить подключение к базе данных. Автоматически переподключается."""
    global _db_connection

    async with _db_lock:
        if _db_connection is not None:
            # Проверяем, живо ли соединение
            try:
                await _db_connection.execute("SELECT 1")
            except Exception:
                logger.warning("Соединение с БД потеряно, переподключаюсь...")
                try:
                    await _db_connection.close()
                except Exception:
                    pass
                _db_connection = None

        if _db_connection is None:
            _db_connection = await _create_connection()

        return _db_connection


async def init_db() -> None:
    """Создать таблицы, если они не существуют."""
    # Чистим stale-блокировки перед подключением
    _cleanup_stale_locks(config.DB_PATH)

    db = await get_db()
    await db.executescript(TABLES_SQL)
    await db.commit()
    logger.info("База данных инициализирована.")


async def close_db() -> None:
    """Закрыть подключение к базе данных."""
    global _db_connection
    async with _db_lock:
        if _db_connection is not None:
            # Принудительно сбрасываем WAL в основной файл перед закрытием
            try:
                await _db_connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            except Exception:
                pass
            try:
                await _db_connection.close()
            except Exception:
                pass
            _db_connection = None
            logger.info("Подключение к БД закрыто.")
