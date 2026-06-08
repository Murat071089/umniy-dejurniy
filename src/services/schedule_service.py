"""
Сервис расписания.
Получает расписание из БД и форматирует в читаемый вид.
"""

from datetime import date, datetime, timedelta
from src.database.db import get_db


async def get_schedule_today(group_name: str) -> str:
    """Получить расписание на сегодня для группы."""
    today = date.today().isoformat()
    return await _get_schedule_for_date(group_name, today, "сегодня")


async def get_schedule_tomorrow(group_name: str) -> str:
    """Получить расписание на завтра для группы."""
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    return await _get_schedule_for_date(group_name, tomorrow, "завтра")


async def get_next_lesson(group_name: str) -> str:
    """Получить ближайшую следующую пару."""
    db = await get_db()
    now = datetime.now()
    today = date.today().isoformat()
    current_time = now.strftime("%H:%M")

    # Ищем ближайшую пару сегодня
    cursor = await db.execute(
        """
        SELECT subject_name, teacher_name, building_number, room_number,
               time_start, time_end
        FROM schedule
        WHERE group_name = ? AND date = ? AND time_start > ?
        ORDER BY time_start ASC
        LIMIT 1
        """,
        (group_name, today, current_time),
    )
    row = await cursor.fetchone()

    if row:
        return _format_single_lesson(row, "Следующая пара сегодня")

    # Если сегодня пар нет, ищем первую пару завтра
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    cursor = await db.execute(
        """
        SELECT subject_name, teacher_name, building_number, room_number,
               time_start, time_end
        FROM schedule
        WHERE group_name = ? AND date = ?
        ORDER BY time_start ASC
        LIMIT 1
        """,
        (group_name, tomorrow),
    )
    row = await cursor.fetchone()

    if row:
        return _format_single_lesson(row, "Ближайшая пара — завтра")

    return "📅 Ближайших пар не найдено. Возможно, расписание ещё не добавлено."


async def get_schedule_for_subject(group_name: str, subject_name: str) -> str:
    """Найти ближайшую пару по конкретному предмету."""
    db = await get_db()
    today = date.today().isoformat()

    cursor = await db.execute(
        """
        SELECT subject_name, teacher_name, building_number, room_number,
               time_start, time_end, date
        FROM schedule
        WHERE group_name = ? AND subject_name = ? AND date >= ?
        ORDER BY date ASC, time_start ASC
        LIMIT 1
        """,
        (group_name, subject_name, today),
    )
    row = await cursor.fetchone()

    if row:
        date_str = row[6]
        if date_str == today:
            label = "Сегодня"
        elif date_str == (date.today() + timedelta(days=1)).isoformat():
            label = "Завтра"
        else:
            label = f"Дата: {date_str}"
        return _format_single_lesson(row, f"Ближайшая пара «{subject_name}» — {label}")

    return f"📅 Пар по предмету «{subject_name}» в ближайшее время не найдено."


async def _get_schedule_for_date(group_name: str, date_str: str, day_label: str) -> str:
    """Получить расписание на конкретную дату."""
    db = await get_db()

    cursor = await db.execute(
        """
        SELECT subject_name, teacher_name, building_number, room_number,
               time_start, time_end
        FROM schedule
        WHERE group_name = ? AND date = ?
        ORDER BY time_start ASC
        """,
        (group_name, date_str),
    )
    rows = await cursor.fetchall()

    if not rows:
        return (
            f"📅 Расписание на {day_label} для группы {group_name} не найдено.\n"
            f"Возможно, пар нет или расписание ещё не добавлено."
        )

    lines = [f"📅 Расписание на {day_label} для группы {group_name}:\n"]

    for row in rows:
        subject = row[0]
        teacher = row[1]
        building = row[2]
        room = row[3]
        time_start = row[4]
        time_end = row[5]

        lines.append(f"🕐 {time_start}–{time_end} — {subject}")

        if building:
            lines.append(f"   🏫 {building} корпус, аудитория {room}")
        elif room:
            lines.append(f"   📍 {room}")

        if teacher:
            lines.append(f"   👨‍🏫 {teacher}")

        lines.append("")  # пустая строка между парами

    return "\n".join(lines).strip()


def _format_single_lesson(row, title: str) -> str:
    """Форматировать одну пару."""
    subject = row[0]
    teacher = row[1]
    building = row[2]
    room = row[3]
    time_start = row[4]
    time_end = row[5]

    lines = [f"📅 {title}:\n"]
    lines.append(f"🕐 {time_start}–{time_end} — {subject}")

    if building:
        lines.append(f"🏫 {building} корпус, аудитория {room}")
    elif room:
        lines.append(f"📍 {room}")

    if teacher:
        lines.append(f"👨‍🏫 Преподаватель: {teacher}")

    return "\n".join(lines)
