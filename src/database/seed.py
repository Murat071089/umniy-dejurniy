"""
Заполнение базы данных тестовыми данными для MVP.
Данные привязаны к реальным датам (сегодня/завтра), чтобы демо всегда было актуальным.
"""

import json
from datetime import date, timedelta
from src.database.db import get_db


async def seed_database() -> None:
    """Заполнить БД демо-данными, если она пуста."""
    db = await get_db()

    # Проверяем, есть ли уже данные
    cursor = await db.execute("SELECT COUNT(*) FROM buildings")
    row = await cursor.fetchone()
    if row[0] > 0:
        print("[OK] Dannye uzhe zagruzheny, propuskaem seed.")
        return

    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    # =============================================
    # ГРУППЫ
    # =============================================
    groups = [
        ("ИС-21", "Информационные системы", 2),
        ("ЭК-11", "Экономика", 1),
        ("ЮР-32", "Юриспруденция", 3),
    ]
    await db.executemany(
        "INSERT INTO groups_table (name, faculty, course) VALUES (?, ?, ?)",
        groups,
    )

    # =============================================
    # КОРПУСА
    # =============================================
    buildings = [
        (
            1,
            "Главный корпус",
            "ул. Ленина, 1",
            "Главный учебный корпус, рядом деканат и актовый зал. "
            "Здесь находится приёмная комиссия, бухгалтерия и столовая.",
            "https://yandex.ru/maps/?text=ул.+Ленина+1",
        ),
        (
            3,
            "Корпус информационных систем",
            "ул. Ленина, 14",
            "Здесь проходят пары по программированию, математике и базам данных. "
            "От главного корпуса пешком около 4 минут.",
            "https://yandex.ru/maps/?text=ул.+Ленина+14",
        ),
        (
            5,
            "Лабораторный корпус",
            "ул. Университетская, 7",
            "Корпус с лабораториями, компьютерными классами и кафедрой физики. "
            "Рядом с главным входом со стороны улицы Ленина. "
            "Пешком от главного корпуса — примерно 6 минут.",
            "https://yandex.ru/maps/?text=ул.+Университетская+7",
        ),
    ]
    await db.executemany(
        "INSERT INTO buildings (number, name, address, description, map_url) "
        "VALUES (?, ?, ?, ?, ?)",
        buildings,
    )

    # =============================================
    # АУДИТОРИИ
    # =============================================
    # Получаем ID корпусов
    cursor = await db.execute("SELECT id, number FROM buildings")
    building_rows = await cursor.fetchall()
    building_ids = {row[1]: row[0] for row in building_rows}

    rooms = [
        # Корпус 1
        (building_ids[1], "110", 1, "Лекционная аудитория, 1 этаж, направо от входа"),
        (building_ids[1], "118", 1, "Аудитория для семинаров, 1 этаж, в конце коридора"),
        (building_ids[1], "201", 2, "Кабинет деканата, 2 этаж"),
        # Корпус 3
        (building_ids[3], "204", 2, "Аудитория на 2 этаже, направо от лестницы"),
        (building_ids[3], "205", 2, "Компьютерный класс, 2 этаж"),
        (building_ids[3], "305", 3, "Лаборатория программирования, 3 этаж"),
        (building_ids[3], "307", 3, "Аудитория баз данных, 3 этаж, налево от лестницы"),
        # Корпус 5
        (building_ids[5], "101", 1, "Физическая лаборатория, 1 этаж"),
        (building_ids[5], "202", 2, "Компьютерный класс, 2 этаж"),
    ]
    await db.executemany(
        "INSERT INTO rooms (building_id, room_number, floor, description) "
        "VALUES (?, ?, ?, ?)",
        rooms,
    )

    # =============================================
    # ПРЕДМЕТЫ
    # =============================================
    subjects = [
        ("Математический анализ", json.dumps(["матан", "мат анализ", "мат.анализ", "математика"], ensure_ascii=False)),
        ("История", json.dumps(["история", "истор"], ensure_ascii=False)),
        ("Английский язык", json.dumps(["инглиш", "англ", "английский", "англ яз", "англ.яз"], ensure_ascii=False)),
        ("Программирование", json.dumps(["прога", "программ", "програм"], ensure_ascii=False)),
        ("Базы данных", json.dumps(["бд", "базы", "базы данных", "бд"], ensure_ascii=False)),
        ("Физическая культура", json.dumps(["физра", "физ-ра", "физкультура"], ensure_ascii=False)),
        ("Информатика", json.dumps(["инфа", "информ"], ensure_ascii=False)),
        ("Безопасность жизнедеятельности", json.dumps(["бжд", "безопасность"], ensure_ascii=False)),
    ]
    await db.executemany(
        "INSERT INTO subjects (name, aliases) VALUES (?, ?)",
        subjects,
    )

    # =============================================
    # ПРЕПОДАВАТЕЛИ
    # =============================================
    teachers = [
        ("Иванова Наталья Александровна", "Иванова Н.А.", "Кафедра математики"),
        ("Петров Сергей Константинович", "Петров С.К.", "Кафедра гуманитарных наук"),
        ("Соколова Мария Игоревна", "Соколова М.И.", "Кафедра иностранных языков"),
        ("Ахмедов Руслан Тимурович", "Ахмедов Р.Т.", "Кафедра информатики"),
        ("Орлова Елена Викторовна", "Орлова Е.В.", "Кафедра информатики"),
    ]
    await db.executemany(
        "INSERT INTO teachers (full_name, short_name, department) VALUES (?, ?, ?)",
        teachers,
    )

    # Связь преподавателей и предметов
    teacher_subjects = [
        (1, 1),  # Иванова — Мат. анализ
        (2, 2),  # Петров — История
        (3, 3),  # Соколова — Англ. язык
        (4, 4),  # Ахмедов — Программирование
        (5, 5),  # Орлова — Базы данных
    ]
    await db.executemany(
        "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)",
        teacher_subjects,
    )

    # =============================================
    # РАСПИСАНИЕ ИС-21 — СЕГОДНЯ
    # =============================================
    schedule_today = [
        ("ИС-21", today, "09:00", "10:30", "Математический анализ", "Иванова Н.А.", 3, "204"),
        ("ИС-21", today, "10:45", "12:15", "Программирование", "Ахмедов Р.Т.", 3, "305"),
        ("ИС-21", today, "13:00", "14:30", "Английский язык", "Соколова М.И.", 1, "118"),
    ]

    # =============================================
    # РАСПИСАНИЕ ИС-21 — ЗАВТРА
    # =============================================
    schedule_tomorrow = [
        ("ИС-21", tomorrow, "09:00", "10:30", "История", "Петров С.К.", 1, "110"),
        ("ИС-21", tomorrow, "10:45", "12:15", "Базы данных", "Орлова Е.В.", 3, "307"),
        ("ИС-21", tomorrow, "13:00", "14:30", "Физическая культура", None, None, "спортзал"),
    ]

    all_schedule = schedule_today + schedule_tomorrow
    await db.executemany(
        "INSERT INTO schedule (group_name, date, time_start, time_end, subject_name, "
        "teacher_name, building_number, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        all_schedule,
    )

    # =============================================
    # ЗАПИСИ ЛЕКЦИЙ
    # =============================================
    lecture_records = [
        (
            "История",
            "Российская империя в XIX веке",
            "2026-05-12",
            "Петров С.К.",
            "https://example.com/lectures/history-19-century",
        ),
        (
            "Математический анализ",
            "Производные и пределы",
            "2026-05-10",
            "Иванова Н.А.",
            "https://example.com/lectures/math-derivatives",
        ),
        (
            "Базы данных",
            "Введение в SQL",
            "2026-05-15",
            "Орлова Е.В.",
            "https://example.com/lectures/sql-intro",
        ),
    ]
    await db.executemany(
        "INSERT INTO lecture_records (subject_name, title, date, teacher_name, url) "
        "VALUES (?, ?, ?, ?, ?)",
        lecture_records,
    )

    # =============================================
    # ТЕСТОВЫЕ СТУДЕНТЫ
    # =============================================
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    seven_min_ago = (now - timedelta(minutes=7)).isoformat()
    twelve_min_ago = (now - timedelta(minutes=12)).isoformat()

    users = [
        (None, "Петя Иванов", "ИС-21", "student", 1, "3 корпус, аудитория 205", seven_min_ago),
        (None, "Анна Смирнова", "ИС-21", "student", 0, None, None),
        (None, "Максим Орлов", "ЭК-11", "student", 1, "Библиотека", twelve_min_ago),
    ]
    await db.executemany(
        "INSERT INTO users (telegram_id, full_name, group_name, role, location_access, "
        "last_location_name, last_location_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        users,
    )

    await db.commit()
    print("[OK] Testovye dannye zagruzheny!")
