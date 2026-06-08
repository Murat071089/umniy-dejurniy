"""
Сервис управления профилями пользователей.
"""

from src.database.db import get_db
from src.config import config


async def get_or_create_user(telegram_id: int, full_name: str) -> dict:
    """Получить или создать пользователя по telegram_id."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT id, telegram_id, full_name, group_name, role, location_access "
        "FROM users WHERE telegram_id = ?",
        (telegram_id,),
    )
    row = await cursor.fetchone()

    if row:
        return {
            "id": row[0],
            "telegram_id": row[1],
            "full_name": row[2],
            "group_name": row[3],
            "role": row[4],
            "location_access": bool(row[5]),
        }

    # Создаём нового пользователя
    await db.execute(
        """
        INSERT INTO users (telegram_id, full_name, group_name, role, location_access)
        VALUES (?, ?, ?, 'student', 0)
        """,
        (telegram_id, full_name, config.DEFAULT_GROUP),
    )
    await db.commit()

    return {
        "id": None,
        "telegram_id": telegram_id,
        "full_name": full_name,
        "group_name": config.DEFAULT_GROUP,
        "role": "student",
        "location_access": False,
    }


async def get_profile(telegram_id: int) -> str:
    """Получить профиль пользователя в виде текста."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT full_name, group_name, location_access FROM users WHERE telegram_id = ?",
        (telegram_id,),
    )
    row = await cursor.fetchone()

    if not row:
        return "👤 Профиль не найден. Напиши /start, чтобы зарегистрироваться."

    name = row[0]
    group = row[1] or "не указана"
    location = "✅ включена" if row[2] else "❌ выключена"

    return (
        f"👤 Твой профиль:\n\n"
        f"📛 Имя: {name}\n"
        f"🎓 Группа: {group}\n"
        f"📍 Геолокация: {location}\n\n"
        f"Ты можешь включить доступ к геолокации для друзей из группы."
    )


async def toggle_location(telegram_id: int, enable: bool) -> str:
    """Включить или выключить геолокацию."""
    db = await get_db()

    await db.execute(
        "UPDATE users SET location_access = ? WHERE telegram_id = ?",
        (1 if enable else 0, telegram_id),
    )
    await db.commit()

    if enable:
        return "✅ Геолокация включена! Теперь друзья могут видеть твоё местоположение."
    else:
        return "❌ Геолокация выключена. Твоё местоположение скрыто."


async def change_group(telegram_id: int, group_name: str) -> str:
    """Изменить группу пользователя."""
    db = await get_db()

    # Проверяем, что такая группа существует
    cursor = await db.execute(
        "SELECT name FROM groups_table WHERE name = ?",
        (group_name,),
    )
    row = await cursor.fetchone()

    if not row:
        # Показываем доступные группы
        cursor = await db.execute("SELECT name FROM groups_table ORDER BY name")
        groups = [r[0] for r in await cursor.fetchall()]
        groups_str = ", ".join(groups)
        return (
            f"❌ Группа «{group_name}» не найдена.\n"
            f"Доступные группы: {groups_str}"
        )

    await db.execute(
        "UPDATE users SET group_name = ? WHERE telegram_id = ?",
        (group_name, telegram_id),
    )
    await db.commit()

    return f"✅ Группа изменена на {group_name}."


async def get_user_group(telegram_id: int) -> str:
    """Получить группу пользователя."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT group_name FROM users WHERE telegram_id = ?",
        (telegram_id,),
    )
    row = await cursor.fetchone()

    if row and row[0]:
        return row[0]

    return config.DEFAULT_GROUP
