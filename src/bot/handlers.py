"""
Обработчики команд и сообщений Telegram-бота.
Все обработчики защищены от молчаливых падений — при любой ошибке
пользователь получит сообщение об ошибке вместо тишины.
"""

import logging
import functools
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.enums import ParseMode

from src.bot.keyboards import (
    main_menu_keyboard,
    schedule_keyboard,
    building_keyboard,
    buildings_list_keyboard,
    records_keyboard,
    profile_keyboard,
    groups_keyboard,
    back_to_menu_keyboard,
)
from src.bot.messages import (
    WELCOME_MESSAGE,
    HELP_MESSAGE,
    VOICE_FALLBACK,
    UNKNOWN_INTENT,
    LOCATION_PROMPT,
    ROOM_PROMPT,
    RECORD_PROMPT,
)
from src.nlp.intent_parser import parse_intent
from src.nlp.aliases import PLACE_INFO
from src.services.schedule_service import (
    get_schedule_today,
    get_schedule_tomorrow,
    get_next_lesson,
)
from src.services.building_service import find_building, find_room, get_all_buildings
from src.services.teacher_service import find_teacher_by_subject, get_all_teachers
from src.services.lecture_service import find_recording, get_all_recordings
from src.services.location_service import find_student_location
from src.services.user_service import (
    get_or_create_user,
    get_profile,
    toggle_location,
    change_group,
    get_user_group,
)

logger = logging.getLogger(__name__)

# Создаём роутер
router = Router()

ERROR_MESSAGE = "⚠️ Произошла ошибка. Попробуй ещё раз или выбери действие из меню."


# ==========================================
# ДЕКОРАТОРЫ ЗАЩИТЫ ОТ МОЛЧАЛИВЫХ ПАДЕНИЙ
# ==========================================


def safe_message_handler(func):
    """Декоратор: оборачивает обработчик сообщений в try/except.
    При любой ошибке — отправляет пользователю сообщение об ошибке."""
    @functools.wraps(func)
    async def wrapper(message: Message, *args, **kwargs):
        try:
            return await func(message, *args, **kwargs)
        except Exception as e:
            logger.error(f"Ошибка в {func.__name__}: {e}", exc_info=True)
            try:
                await message.answer(ERROR_MESSAGE, reply_markup=main_menu_keyboard())
            except Exception:
                pass  # Не можем отправить даже ошибку — сеть недоступна
    return wrapper


def safe_callback_handler(func):
    """Декоратор: оборачивает callback-обработчик в try/except.
    При любой ошибке — отвечает пользователю и показывает сообщение."""
    @functools.wraps(func)
    async def wrapper(callback: CallbackQuery, *args, **kwargs):
        try:
            return await func(callback, *args, **kwargs)
        except Exception as e:
            logger.error(f"Ошибка в {func.__name__}: {e}", exc_info=True)
            try:
                await callback.message.edit_text(
                    ERROR_MESSAGE, reply_markup=main_menu_keyboard()
                )
            except Exception:
                pass
            try:
                await callback.answer("⚠️ Ошибка")
            except Exception:
                pass
    return wrapper


# ==========================================
# КОМАНДЫ
# ==========================================


@router.message(Command("start"))
@safe_message_handler
async def cmd_start(message: Message) -> None:
    """Обработчик команды /start."""
    user = message.from_user
    if user:
        await get_or_create_user(
            telegram_id=user.id,
            full_name=user.full_name or "Студент",
        )

    await message.answer(
        WELCOME_MESSAGE,
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu_keyboard(),
    )


@router.message(Command("help"))
@safe_message_handler
async def cmd_help(message: Message) -> None:
    """Обработчик команды /help."""
    await message.answer(
        HELP_MESSAGE,
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu_keyboard(),
    )


@router.message(Command("schedule"))
@safe_message_handler
async def cmd_schedule(message: Message) -> None:
    """Обработчик команды /schedule."""
    await message.answer(
        "📅 Выбери, какое расписание показать:",
        reply_markup=schedule_keyboard(),
    )


@router.message(Command("buildings"))
@safe_message_handler
async def cmd_buildings(message: Message) -> None:
    """Обработчик команды /buildings."""
    text = await get_all_buildings()
    await message.answer(text, reply_markup=buildings_list_keyboard())


@router.message(Command("teachers"))
@safe_message_handler
async def cmd_teachers(message: Message) -> None:
    """Обработчик команды /teachers."""
    text = await get_all_teachers()
    await message.answer(text, reply_markup=back_to_menu_keyboard())


@router.message(Command("records"))
@safe_message_handler
async def cmd_records(message: Message) -> None:
    """Обработчик команды /records."""
    text = await get_all_recordings()
    await message.answer(text, reply_markup=records_keyboard())


@router.message(Command("profile"))
@safe_message_handler
async def cmd_profile(message: Message) -> None:
    """Обработчик команды /profile."""
    user = message.from_user
    if not user:
        return

    await get_or_create_user(user.id, user.full_name or "Студент")
    text = await get_profile(user.id)

    # Получаем текущий статус геолокации
    from src.database.db import get_db
    db = await get_db()
    cursor = await db.execute(
        "SELECT location_access FROM users WHERE telegram_id = ?",
        (user.id,),
    )
    row = await cursor.fetchone()
    location_on = bool(row[0]) if row else False

    await message.answer(text, reply_markup=profile_keyboard(location_on))


# ==========================================
# ГОЛОСОВЫЕ СООБЩЕНИЯ
# ==========================================


@router.message(F.voice)
@safe_message_handler
async def handle_voice(message: Message) -> None:
    """Обработчик голосовых сообщений — заглушка для MVP."""
    await message.answer(
        VOICE_FALLBACK,
        reply_markup=main_menu_keyboard(),
    )


# ==========================================
# ТЕКСТОВЫЕ СООБЩЕНИЯ (NLP)
# ==========================================


@router.message(F.text)
@safe_message_handler
async def handle_text(message: Message) -> None:
    """Обработчик текстовых сообщений — основная NLP-логика."""
    text = message.text
    if not text:
        return

    user = message.from_user
    if user:
        await get_or_create_user(user.id, user.full_name or "Студент")

    # Парсим намерение
    intent = parse_intent(text)
    logger.info(f"Intent: {intent.intent} | Confidence: {intent.confidence} | Text: {text}")

    # Получаем группу пользователя
    group = intent.group_name
    if not group and user:
        group = await get_user_group(user.id)
    if not group:
        group = "ИС-21"

    # Маршрутизация по намерению
    if intent.intent == "schedule_today":
        response = await get_schedule_today(group)
        await message.answer(response, reply_markup=schedule_keyboard())

    elif intent.intent == "schedule_tomorrow":
        response = await get_schedule_tomorrow(group)
        await message.answer(response, reply_markup=schedule_keyboard())

    elif intent.intent == "next_lesson":
        response = await get_next_lesson(group)
        await message.answer(response, reply_markup=schedule_keyboard())

    elif intent.intent == "find_building":
        if intent.building_number:
            response = await find_building(intent.building_number)
            await message.answer(
                response,
                reply_markup=building_keyboard(intent.building_number),
            )
        else:
            response = await get_all_buildings()
            await message.answer(response, reply_markup=buildings_list_keyboard())

    elif intent.intent == "find_room":
        if intent.room_number:
            response = await find_room(intent.room_number)
            await message.answer(response, reply_markup=back_to_menu_keyboard())
        else:
            await message.answer(ROOM_PROMPT, reply_markup=back_to_menu_keyboard())

    elif intent.intent == "find_place":
        if intent.place_name and intent.place_name in PLACE_INFO:
            response = PLACE_INFO[intent.place_name]
            await message.answer(
                f"📍 {response}",
                reply_markup=back_to_menu_keyboard(),
            )
        else:
            await message.answer(
                "📍 Не нашёл это место. Попробуй написать точнее.",
                reply_markup=main_menu_keyboard(),
            )

    elif intent.intent == "find_teacher":
        if intent.subject:
            response = await find_teacher_by_subject(intent.subject, group)
            await message.answer(response, reply_markup=back_to_menu_keyboard())
        else:
            response = await get_all_teachers()
            await message.answer(response, reply_markup=back_to_menu_keyboard())

    elif intent.intent == "lecture_recording":
        response = await find_recording(intent.subject)
        # Пытаемся извлечь URL для кнопки
        url = None
        if "Смотреть:" in response:
            url = response.split("Смотреть: ")[-1].strip()
        await message.answer(response, reply_markup=records_keyboard(url))

    elif intent.intent == "student_location":
        if intent.student_name:
            response = await find_student_location(intent.student_name)
            await message.answer(response, reply_markup=back_to_menu_keyboard())
        else:
            await message.answer(LOCATION_PROMPT, reply_markup=back_to_menu_keyboard())

    else:
        # unknown
        await message.answer(UNKNOWN_INTENT, reply_markup=main_menu_keyboard())


# ==========================================
# CALLBACK-ОБРАБОТЧИКИ (Inline-кнопки)
# ==========================================


@router.callback_query(F.data == "back_to_menu")
@safe_callback_handler
async def cb_back_to_menu(callback: CallbackQuery) -> None:
    """Вернуться в главное меню."""
    await callback.message.edit_text(
        "🏠 Главное меню. Выбери действие или задай вопрос:",
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "menu_schedule")
@safe_callback_handler
async def cb_menu_schedule(callback: CallbackQuery) -> None:
    """Меню расписания."""
    await callback.message.edit_text(
        "📅 Выбери, какое расписание показать:",
        reply_markup=schedule_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "schedule_today")
@safe_callback_handler
async def cb_schedule_today(callback: CallbackQuery) -> None:
    """Расписание на сегодня."""
    user = callback.from_user
    group = await get_user_group(user.id) if user else "ИС-21"
    response = await get_schedule_today(group)
    await callback.message.edit_text(response, reply_markup=schedule_keyboard())
    await callback.answer()


@router.callback_query(F.data == "schedule_tomorrow")
@safe_callback_handler
async def cb_schedule_tomorrow(callback: CallbackQuery) -> None:
    """Расписание на завтра."""
    user = callback.from_user
    group = await get_user_group(user.id) if user else "ИС-21"
    response = await get_schedule_tomorrow(group)
    await callback.message.edit_text(response, reply_markup=schedule_keyboard())
    await callback.answer()


@router.callback_query(F.data == "schedule_next")
@safe_callback_handler
async def cb_schedule_next(callback: CallbackQuery) -> None:
    """Следующая пара."""
    user = callback.from_user
    group = await get_user_group(user.id) if user else "ИС-21"
    response = await get_next_lesson(group)
    await callback.message.edit_text(response, reply_markup=schedule_keyboard())
    await callback.answer()


@router.callback_query(F.data == "menu_buildings")
@safe_callback_handler
async def cb_menu_buildings(callback: CallbackQuery) -> None:
    """Список корпусов."""
    text = await get_all_buildings()
    await callback.message.edit_text(text, reply_markup=buildings_list_keyboard())
    await callback.answer()


@router.callback_query(F.data.startswith("building_"))
@safe_callback_handler
async def cb_building_detail(callback: CallbackQuery) -> None:
    """Информация о конкретном корпусе."""
    number = int(callback.data.split("_")[1])
    response = await find_building(number)
    await callback.message.edit_text(
        response,
        reply_markup=building_keyboard(number),
    )
    await callback.answer()


@router.callback_query(F.data == "find_room_prompt")
@safe_callback_handler
async def cb_find_room_prompt(callback: CallbackQuery) -> None:
    """Запрос номера аудитории."""
    await callback.message.edit_text(ROOM_PROMPT, reply_markup=back_to_menu_keyboard())
    await callback.answer()


@router.callback_query(F.data == "menu_teachers")
@safe_callback_handler
async def cb_menu_teachers(callback: CallbackQuery) -> None:
    """Список преподавателей."""
    text = await get_all_teachers()
    await callback.message.edit_text(text, reply_markup=back_to_menu_keyboard())
    await callback.answer()


@router.callback_query(F.data == "menu_records")
@safe_callback_handler
async def cb_menu_records(callback: CallbackQuery) -> None:
    """Записи лекций."""
    text = await get_all_recordings()
    await callback.message.edit_text(text, reply_markup=records_keyboard())
    await callback.answer()


@router.callback_query(F.data == "find_record_prompt")
@safe_callback_handler
async def cb_find_record_prompt(callback: CallbackQuery) -> None:
    """Запрос предмета для записи лекции."""
    await callback.message.edit_text(RECORD_PROMPT, reply_markup=back_to_menu_keyboard())
    await callback.answer()


@router.callback_query(F.data == "menu_location")
@safe_callback_handler
async def cb_menu_location(callback: CallbackQuery) -> None:
    """Поиск студента."""
    await callback.message.edit_text(LOCATION_PROMPT, reply_markup=back_to_menu_keyboard())
    await callback.answer()


@router.callback_query(F.data == "menu_help")
@safe_callback_handler
async def cb_menu_help(callback: CallbackQuery) -> None:
    """Справка."""
    await callback.message.edit_text(
        HELP_MESSAGE,
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "menu_profile")
@safe_callback_handler
async def cb_menu_profile(callback: CallbackQuery) -> None:
    """Профиль."""
    user = callback.from_user
    if not user:
        return

    text = await get_profile(user.id)

    from src.database.db import get_db
    db = await get_db()
    cursor = await db.execute(
        "SELECT location_access FROM users WHERE telegram_id = ?",
        (user.id,),
    )
    row = await cursor.fetchone()
    location_on = bool(row[0]) if row else False

    await callback.message.edit_text(text, reply_markup=profile_keyboard(location_on))
    await callback.answer()


@router.callback_query(F.data == "location_on")
@safe_callback_handler
async def cb_location_on(callback: CallbackQuery) -> None:
    """Включить геолокацию."""
    user = callback.from_user
    if user:
        response = await toggle_location(user.id, True)
        await callback.message.edit_text(
            response,
            reply_markup=profile_keyboard(True),
        )
    await callback.answer()


@router.callback_query(F.data == "location_off")
@safe_callback_handler
async def cb_location_off(callback: CallbackQuery) -> None:
    """Выключить геолокацию."""
    user = callback.from_user
    if user:
        response = await toggle_location(user.id, False)
        await callback.message.edit_text(
            response,
            reply_markup=profile_keyboard(False),
        )
    await callback.answer()


@router.callback_query(F.data == "change_group_prompt")
@safe_callback_handler
async def cb_change_group_prompt(callback: CallbackQuery) -> None:
    """Выбор группы."""
    await callback.message.edit_text(
        "🎓 Выбери свою группу:",
        reply_markup=groups_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("set_group_"))
@safe_callback_handler
async def cb_set_group(callback: CallbackQuery) -> None:
    """Установить группу."""
    group_name = callback.data.replace("set_group_", "")
    user = callback.from_user
    if user:
        response = await change_group(user.id, group_name)
        await callback.message.edit_text(
            response,
            reply_markup=profile_keyboard(False),
        )
    await callback.answer()
