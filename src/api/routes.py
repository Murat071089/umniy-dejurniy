from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from datetime import date, timedelta
import json

from src.database.db import get_db
from src.nlp.intent_parser import parse_intent
from src.nlp.aliases import PLACE_INFO
from src.services.schedule_service import (
    get_schedule_today,
    get_schedule_tomorrow,
    get_next_lesson,
)
from src.services.building_service import find_building, find_room, get_all_buildings
from src.services.teacher_service import find_teacher_by_subject, get_all_teachers
from src.services.lecture_service import find_recording
from src.services.location_service import find_student_location
from src.services.user_service import (
    get_or_create_user,
    toggle_location,
    change_group,
)

router = APIRouter()
security = HTTPBasic()

DEFAULT_WEB_USER_ID = 0

def check_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# ==========================================
# ОСНОВНЫЕ ENDPOINTS ДЛЯ WEB APP
# ==========================================

@router.post("/query")
async def process_query(payload: dict):
    text = payload.get("text", "")
    group = payload.get("group", "ИС-21")
    if not text:
        raise HTTPException(status_code=400, detail="Текст запроса не может быть пустым")

    intent = parse_intent(text)
    
    response_text = ""
    try:
        if intent.intent == "schedule_today":
            response_text = await get_schedule_today(group)
        elif intent.intent == "schedule_tomorrow":
            response_text = await get_schedule_tomorrow(group)
        elif intent.intent == "next_lesson":
            response_text = await get_next_lesson(group)
        elif intent.intent == "find_building":
            if intent.building_number:
                response_text = await find_building(intent.building_number)
            else:
                response_text = await get_all_buildings()
        elif intent.intent == "find_room":
            if intent.room_number:
                response_text = await find_room(intent.room_number)
            else:
                response_text = "🚪 Укажите номер аудитории. Например: 'где аудитория 204?'"
        elif intent.intent == "find_place":
            if intent.place_name and intent.place_name in PLACE_INFO:
                response_text = f"📍 {PLACE_INFO[intent.place_name]}"
            else:
                response_text = "📍 Не нашёл это место. Попробуй написать точнее."
        elif intent.intent == "find_teacher":
            if intent.subject:
                response_text = await find_teacher_by_subject(intent.subject, group)
            else:
                response_text = await get_all_teachers()
        elif intent.intent == "lecture_recording":
            response_text = await find_recording(intent.subject)
        elif intent.intent == "student_location":
            if intent.student_name:
                response_text = await find_student_location(intent.student_name)
            else:
                response_text = "📍 Кого именно вы хотите найти? Например: 'где сейчас Петя Иванов?'"
        else:
            response_text = "Извините, я не понял вопрос. Спросите про расписание, корпуса, преподавателей или лекции."
    except Exception as e:
        response_text = f"⚠️ Ошибка при обработке: {str(e)}"
        
    return {
        "intent": intent.intent,
        "confidence": intent.confidence,
        "subject": intent.subject,
        "building_number": intent.building_number,
        "room_number": intent.room_number,
        "student_name": intent.student_name,
        "group_name": intent.group_name or group,
        "place_name": intent.place_name,
        "answer": response_text
    }

@router.get("/schedule")
async def get_schedule(group: str = "ИС-21", day: str = "today"):
    db = await get_db()
    
    target_date = None
    if day == "today":
        target_date = date.today().isoformat()
    elif day == "tomorrow":
        target_date = (date.today() + timedelta(days=1)).isoformat()
        
    if target_date:
        cursor = await db.execute(
            """
            SELECT id, subject_name, teacher_name, building_number, room_number,
                   time_start, time_end, date
            FROM schedule
            WHERE group_name = ? AND date = ?
            ORDER BY time_start ASC
            """,
            (group, target_date)
        )
    else:
        # Все расписания (вкладка Неделя/Все)
        cursor = await db.execute(
            """
            SELECT id, subject_name, teacher_name, building_number, room_number,
                   time_start, time_end, date
            FROM schedule
            WHERE group_name = ?
            ORDER BY date ASC, time_start ASC
            """,
            (group,)
        )
        
    rows = await cursor.fetchall()
    
    lessons = []
    for r in rows:
        lessons.append({
            "id": r[0],
            "subject": r[1],
            "teacher": r[2] or "—",
            "building": r[3],
            "room": r[4] or "—",
            "time_start": r[5],
            "time_end": r[6],
            "date": r[7]
        })
    return lessons

@router.get("/buildings")
async def get_buildings():
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, number, name, address, description, map_url FROM buildings ORDER BY number ASC"
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": r[0],
            "number": r[1],
            "name": r[2],
            "address": r[3],
            "description": r[4],
            "map_url": r[5]
        } for r in rows
    ]

@router.get("/lectures")
async def get_lectures():
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, subject_name, title, date, teacher_name, url FROM lecture_records ORDER BY date DESC"
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": r[0],
            "subject": r[1],
            "title": r[2],
            "date": r[3],
            "teacher": r[4] or "—",
            "url": r[5]
        } for r in rows
    ]

@router.get("/teachers")
async def get_teachers():
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, full_name, short_name, department FROM teachers ORDER BY full_name"
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": r[0],
            "full_name": r[1],
            "short_name": r[2],
            "department": r[3] or "—"
        } for r in rows
    ]

@router.get("/students")
async def get_students():
    db = await get_db()
    cursor = await db.execute(
        """
        SELECT id, full_name, group_name, location_access, last_location_name, last_location_updated_at
        FROM users
        ORDER BY full_name ASC
        """
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": r[0],
            "full_name": r[1],
            "group_name": r[2] or "—",
            "location_access": bool(r[3]),
            "last_location_name": r[4] if r[3] else None,
            "last_location_updated_at": r[5] if r[3] else None
        } for r in rows
    ]

@router.get("/profile")
async def get_web_profile(user_id: int = DEFAULT_WEB_USER_ID):
    db = await get_db()
    await get_or_create_user(user_id, "Артём")
    
    cursor = await db.execute(
        "SELECT id, telegram_id, full_name, group_name, role, location_access FROM users WHERE telegram_id = ?",
        (user_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {
        "id": row[0],
        "telegram_id": row[1],
        "full_name": row[2],
        "group_name": row[3],
        "role": row[4],
        "location_access": bool(row[5])
    }

@router.post("/profile/location")
async def update_location(payload: dict):
    user_id = payload.get("user_id", DEFAULT_WEB_USER_ID)
    enabled = payload.get("enabled", False)
    await get_or_create_user(user_id, "Артём")
    
    res = await toggle_location(user_id, enabled)
    return {"status": "success", "message": res, "location_access": enabled}

@router.post("/profile/group")
async def update_group(payload: dict):
    user_id = payload.get("user_id", DEFAULT_WEB_USER_ID)
    group = payload.get("group_name", "ИС-21")
    await get_or_create_user(user_id, "Артём")
    
    res = await change_group(user_id, group)
    if "❌" in res:
        raise HTTPException(status_code=400, detail=res)
    return {"status": "success", "message": res, "group_name": group}

# ==========================================
# АДМИНИСТРАТИВНАЯ ПАНЕЛЬ (CRUD)
# ==========================================

@router.get("/admin/summary", dependencies=[Depends(check_admin)])
async def get_admin_summary():
    db = await get_db()
    
    counts = {}
    for table in ["schedule", "buildings", "teachers", "lecture_records", "users"]:
        cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
        row = await cursor.fetchone()
        counts[table] = row[0]
        
    return counts

# CRUD: Расписание
@router.get("/admin/schedule", dependencies=[Depends(check_admin)])
async def admin_get_schedule():
    db = await get_db()
    cursor = await db.execute("SELECT id, group_name, date, time_start, time_end, subject_name, teacher_name, building_number, room_number FROM schedule ORDER BY date DESC, time_start ASC")
    rows = await cursor.fetchall()
    return [
        {
            "id": r[0],
            "group_name": r[1],
            "date": r[2],
            "time_start": r[3],
            "time_end": r[4],
            "subject_name": r[5],
            "teacher_name": r[6],
            "building_number": r[7],
            "room_number": r[8]
        } for r in rows
    ]

@router.post("/admin/schedule", dependencies=[Depends(check_admin)])
async def admin_create_schedule(item: dict):
    db = await get_db()
    await db.execute(
        """
        INSERT INTO schedule (group_name, date, time_start, time_end, subject_name, teacher_name, building_number, room_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            item.get("group_name"),
            item.get("date"),
            item.get("time_start"),
            item.get("time_end"),
            item.get("subject_name"),
            item.get("teacher_name"),
            item.get("building_number"),
            item.get("room_number")
        )
    )
    await db.commit()
    return {"status": "success"}

@router.put("/admin/schedule/{item_id}", dependencies=[Depends(check_admin)])
async def admin_update_schedule(item_id: int, item: dict):
    db = await get_db()
    await db.execute(
        """
        UPDATE schedule
        SET group_name = ?, date = ?, time_start = ?, time_end = ?, subject_name = ?, teacher_name = ?, building_number = ?, room_number = ?
        WHERE id = ?
        """,
        (
            item.get("group_name"),
            item.get("date"),
            item.get("time_start"),
            item.get("time_end"),
            item.get("subject_name"),
            item.get("teacher_name"),
            item.get("building_number"),
            item.get("room_number"),
            item_id
        )
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/admin/schedule/{item_id}", dependencies=[Depends(check_admin)])
async def admin_delete_schedule(item_id: int):
    db = await get_db()
    await db.execute("DELETE FROM schedule WHERE id = ?", (item_id,))
    await db.commit()
    return {"status": "success"}

# CRUD: Корпуса
@router.post("/admin/buildings", dependencies=[Depends(check_admin)])
async def admin_create_building(item: dict):
    db = await get_db()
    await db.execute(
        """
        INSERT INTO buildings (number, name, address, description, map_url)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            item.get("number"),
            item.get("name"),
            item.get("address"),
            item.get("description"),
            item.get("map_url")
        )
    )
    await db.commit()
    return {"status": "success"}

@router.put("/admin/buildings/{item_id}", dependencies=[Depends(check_admin)])
async def admin_update_building(item_id: int, item: dict):
    db = await get_db()
    await db.execute(
        """
        UPDATE buildings
        SET number = ?, name = ?, address = ?, description = ?, map_url = ?
        WHERE id = ?
        """,
        (
            item.get("number"),
            item.get("name"),
            item.get("address"),
            item.get("description"),
            item.get("map_url"),
            item_id
        )
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/admin/buildings/{item_id}", dependencies=[Depends(check_admin)])
async def admin_delete_building(item_id: int):
    db = await get_db()
    await db.execute("DELETE FROM buildings WHERE id = ?", (item_id,))
    await db.commit()
    return {"status": "success"}

# CRUD: Преподаватели
@router.post("/admin/teachers", dependencies=[Depends(check_admin)])
async def admin_create_teacher(item: dict):
    db = await get_db()
    await db.execute(
        "INSERT INTO teachers (full_name, short_name, department) VALUES (?, ?, ?)",
        (item.get("full_name"), item.get("short_name"), item.get("department"))
    )
    await db.commit()
    return {"status": "success"}

@router.put("/admin/teachers/{item_id}", dependencies=[Depends(check_admin)])
async def admin_update_teacher(item_id: int, item: dict):
    db = await get_db()
    await db.execute(
        "UPDATE teachers SET full_name = ?, short_name = ?, department = ? WHERE id = ?",
        (item.get("full_name"), item.get("short_name"), item.get("department"), item_id)
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/admin/teachers/{item_id}", dependencies=[Depends(check_admin)])
async def admin_delete_teacher(item_id: int):
    db = await get_db()
    await db.execute("DELETE FROM teachers WHERE id = ?", (item_id,))
    await db.commit()
    return {"status": "success"}

# CRUD: Лекции
@router.post("/admin/lectures", dependencies=[Depends(check_admin)])
async def admin_create_lecture(item: dict):
    db = await get_db()
    await db.execute(
        "INSERT INTO lecture_records (subject_name, title, date, teacher_name, url) VALUES (?, ?, ?, ?, ?)",
        (
            item.get("subject_name"),
            item.get("title"),
            item.get("date"),
            item.get("teacher_name"),
            item.get("url")
        )
    )
    await db.commit()
    return {"status": "success"}

@router.put("/admin/lectures/{item_id}", dependencies=[Depends(check_admin)])
async def admin_update_lecture(item_id: int, item: dict):
    db = await get_db()
    await db.execute(
        "UPDATE lecture_records SET subject_name = ?, title = ?, date = ?, teacher_name = ?, url = ? WHERE id = ?",
        (
            item.get("subject_name"),
            item.get("title"),
            item.get("date"),
            item.get("teacher_name"),
            item.get("url"),
            item_id
        )
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/admin/lectures/{item_id}", dependencies=[Depends(check_admin)])
async def admin_delete_lecture(item_id: int):
    db = await get_db()
    await db.execute("DELETE FROM lecture_records WHERE id = ?", (item_id,))
    await db.commit()
    return {"status": "success"}
