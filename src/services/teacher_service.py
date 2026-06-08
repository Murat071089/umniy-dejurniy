"""
Сервис поиска преподавателей.
"""

from src.database.db import get_db
from src.nlp.aliases import SUBJECT_ALIASES
from src.services.schedule_service import get_schedule_for_subject


async def find_teacher_by_subject(subject_name: str, group_name: str = "ИС-21") -> str:
    """Найти преподавателя по названию предмета."""
    db = await get_db()

    # Ищем предмет в базе
    cursor = await db.execute(
        """
        SELECT t.full_name, t.department, s.name
        FROM teachers t
        JOIN teacher_subjects ts ON t.id = ts.teacher_id
        JOIN subjects s ON s.id = ts.subject_id
        WHERE s.name = ?
        """,
        (subject_name,),
    )
    row = await cursor.fetchone()

    if not row:
        return (
            f"👨‍🏫 Не нашёл преподавателя по предмету «{subject_name}».\n"
            f"Попробуй написать полное название предмета."
        )

    teacher_name = row[0]
    department = row[1]
    full_subject = row[2]

    lines = [
        f"👨‍🏫 {full_subject} у группы {group_name} ведёт {teacher_name}.",
    ]

    if department:
        lines.append(f"🏛 {department}.")

    # Пытаемся найти ближайшую пару
    schedule_info = await get_schedule_for_subject(group_name, full_subject)
    if "не найдено" not in schedule_info.lower():
        lines.append("")
        lines.append(schedule_info)

    return "\n".join(lines)


async def get_all_teachers() -> str:
    """Получить список всех преподавателей."""
    db = await get_db()

    cursor = await db.execute(
        """
        SELECT t.full_name, GROUP_CONCAT(s.name, ', ')
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
        LEFT JOIN subjects s ON s.id = ts.subject_id
        GROUP BY t.id
        ORDER BY t.full_name
        """
    )
    rows = await cursor.fetchall()

    if not rows:
        return "👨‍🏫 Список преподавателей пока пуст."

    lines = ["👨‍🏫 Преподаватели:\n"]
    for row in rows:
        name = row[0]
        subjects = row[1] if row[1] else "—"
        lines.append(f"  • {name}")
        lines.append(f"    📚 {subjects}\n")

    return "\n".join(lines).strip()
