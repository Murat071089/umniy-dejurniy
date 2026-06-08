"""
Сервис поиска корпусов и аудиторий.
"""

from src.database.db import get_db


async def find_building(number: int) -> str:
    """Найти информацию о корпусе по номеру."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT number, name, address, description, map_url FROM buildings WHERE number = ?",
        (number,),
    )
    row = await cursor.fetchone()

    if not row:
        return f"🏫 Корпус {number} не найден в базе данных."

    b_number = row[0]
    name = row[1]
    address = row[2]
    description = row[3]
    map_url = row[4]

    lines = [
        f"🏫 {b_number} корпус — {name}.",
        f"📍 Адрес: {address}.",
    ]

    if description:
        lines.append(f"ℹ️ {description}")

    if map_url:
        lines.append(f"🗺 Открыть на карте: {map_url}")

    return "\n".join(lines)


async def find_room(room_number: str) -> str:
    """Найти информацию об аудитории."""
    db = await get_db()

    cursor = await db.execute(
        """
        SELECT r.room_number, r.floor, r.description, b.number, b.name, b.address
        FROM rooms r
        JOIN buildings b ON r.building_id = b.id
        WHERE r.room_number = ?
        """,
        (room_number,),
    )
    row = await cursor.fetchone()

    if not row:
        return f"🚪 Аудитория {room_number} не найдена в базе данных."

    r_number = row[0]
    floor = row[1]
    description = row[2]
    b_number = row[3]
    b_name = row[4]
    b_address = row[5]

    lines = [
        f"🚪 Аудитория {r_number} находится в {b_number} корпусе ({b_name}).",
        f"📍 Адрес корпуса: {b_address}.",
        f"🏢 Этаж: {floor}.",
    ]

    if description:
        lines.append(f"ℹ️ {description}")

    return "\n".join(lines)


async def get_all_buildings() -> str:
    """Получить список всех корпусов."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT number, name, address FROM buildings ORDER BY number ASC"
    )
    rows = await cursor.fetchall()

    if not rows:
        return "🏫 Список корпусов пока пуст."

    lines = ["🏫 Список корпусов:\n"]
    for row in rows:
        lines.append(f"  {row[0]} корпус — {row[1]}")
        lines.append(f"  📍 {row[2]}\n")

    return "\n".join(lines).strip()
