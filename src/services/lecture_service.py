"""
Сервис записей лекций.
"""

from src.database.db import get_db
from src.nlp.aliases import SUBJECT_ALIASES
from fuzzywuzzy import fuzz, process


async def find_recording(subject_name: str | None = None) -> str:
    """Найти запись лекции по названию предмета."""
    db = await get_db()

    if subject_name:
        # Ищем по точному названию предмета
        cursor = await db.execute(
            """
            SELECT subject_name, title, date, teacher_name, url
            FROM lecture_records
            WHERE subject_name = ?
            ORDER BY date DESC
            LIMIT 1
            """,
            (subject_name,),
        )
        row = await cursor.fetchone()

        if row:
            return _format_recording(row)

        # Fuzzy search по всем записям
        cursor = await db.execute("SELECT DISTINCT subject_name FROM lecture_records")
        subjects = [r[0] for r in await cursor.fetchall()]

        match = process.extractOne(subject_name, subjects, scorer=fuzz.ratio)
        if match and match[1] >= 60:
            cursor = await db.execute(
                """
                SELECT subject_name, title, date, teacher_name, url
                FROM lecture_records
                WHERE subject_name = ?
                ORDER BY date DESC
                LIMIT 1
                """,
                (match[0],),
            )
            row = await cursor.fetchone()
            if row:
                return _format_recording(row)

        return (
            f"🎧 Записей лекций по предмету «{subject_name}» пока нет.\n"
            f"Могу показать список доступных записей — напиши «записи лекций»."
        )

    # Если предмет не указан — показать все записи
    return await get_all_recordings()


async def get_all_recordings() -> str:
    """Получить список всех доступных записей лекций."""
    db = await get_db()

    cursor = await db.execute(
        """
        SELECT subject_name, title, date, teacher_name, url
        FROM lecture_records
        ORDER BY date DESC
        """
    )
    rows = await cursor.fetchall()

    if not rows:
        return "🎧 Записей лекций пока нет."

    lines = ["🎧 Доступные записи лекций:\n"]
    for row in rows:
        subject = row[0]
        title = row[1]
        record_date = row[2]
        teacher = row[3]

        lines.append(f"📚 {subject}")
        lines.append(f"   Тема: «{title}»")
        lines.append(f"   📅 Дата: {record_date}")
        if teacher:
            lines.append(f"   👨‍🏫 {teacher}")
        lines.append("")

    return "\n".join(lines).strip()


def _format_recording(row) -> str:
    """Форматировать запись лекции."""
    subject = row[0]
    title = row[1]
    record_date = row[2]
    teacher = row[3]
    url = row[4]

    lines = [
        f"🎧 Да, есть запись лекции по {subject.lower()}:",
        f"📝 Тема: «{title}»",
        f"📅 Дата: {record_date}",
    ]

    if teacher:
        lines.append(f"👨‍🏫 Преподаватель: {teacher}")

    if url:
        lines.append(f"▶️ Смотреть: {url}")

    return "\n".join(lines)
