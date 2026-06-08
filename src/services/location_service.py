"""
Сервис геолокации студентов.
Показывает местоположение студента, если он дал на это разрешение.
"""

from datetime import datetime, timezone
from src.database.db import get_db
from fuzzywuzzy import fuzz, process


async def find_student_location(name: str) -> str:
    """
    Найти местоположение студента по имени.
    Проверяет разрешение на показ геолокации.
    """
    db = await get_db()

    # Ищем студента по имени (точное совпадение)
    cursor = await db.execute(
        """
        SELECT full_name, group_name, location_access,
               last_location_name, last_location_updated_at
        FROM users
        WHERE LOWER(full_name) = LOWER(?)
        """,
        (name,),
    )
    row = await cursor.fetchone()

    # Если не нашли точно — пробуем fuzzy match
    if not row:
        cursor = await db.execute("SELECT full_name FROM users")
        all_names = [r[0] for r in await cursor.fetchall()]

        match = process.extractOne(name, all_names, scorer=fuzz.ratio)
        if match and match[1] >= 70:
            cursor = await db.execute(
                """
                SELECT full_name, group_name, location_access,
                       last_location_name, last_location_updated_at
                FROM users
                WHERE full_name = ?
                """,
                (match[0],),
            )
            row = await cursor.fetchone()

    if not row:
        return (
            f"👤 Студент «{name}» не найден в базе.\n"
            f"Проверь правильность имени и фамилии."
        )

    full_name = row[0]
    group_name = row[1]
    location_access = row[2]
    location_name = row[3]
    updated_at = row[4]

    # Проверяем разрешение
    if not location_access:
        return (
            f"🔒 {full_name} не открыл(а) доступ к своей геолокации.\n"
            f"Я не могу показывать местоположение без разрешения."
        )

    # Разрешение есть — показываем локацию
    if not location_name:
        return (
            f"📍 У {full_name} включён доступ к геолокации, "
            f"но местоположение пока неизвестно."
        )

    # Рассчитываем, сколько минут назад обновлено
    time_ago = _calculate_time_ago(updated_at)

    return (
        f"📍 {full_name} сейчас в: {location_name}.\n"
        f"🕐 Обновлено {time_ago}."
    )


def _calculate_time_ago(updated_at: str | None) -> str:
    """Рассчитать, сколько времени прошло с обновления."""
    if not updated_at:
        return "время неизвестно"

    try:
        updated = datetime.fromisoformat(updated_at)
        now = datetime.now(timezone.utc)

        # Если updated не timezone-aware, делаем его таким
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=timezone.utc)

        delta = now - updated
        minutes = int(delta.total_seconds() / 60)

        if minutes < 1:
            return "только что"
        elif minutes < 60:
            return f"{minutes} мин. назад"
        elif minutes < 1440:
            hours = minutes // 60
            return f"{hours} ч. назад"
        else:
            days = minutes // 1440
            return f"{days} дн. назад"
    except (ValueError, TypeError):
        return "время неизвестно"
