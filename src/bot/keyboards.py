"""
Inline-клавиатуры для Telegram-бота.
"""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def main_menu_keyboard() -> InlineKeyboardMarkup:
    """Главное меню."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📅 Расписание", callback_data="menu_schedule"),
            InlineKeyboardButton(text="🏫 Корпуса", callback_data="menu_buildings"),
        ],
        [
            InlineKeyboardButton(text="👨‍🏫 Преподаватели", callback_data="menu_teachers"),
            InlineKeyboardButton(text="🎧 Записи лекций", callback_data="menu_records"),
        ],
        [
            InlineKeyboardButton(text="📍 Найти студента", callback_data="menu_location"),
            InlineKeyboardButton(text="❓ Помощь", callback_data="menu_help"),
        ],
    ])


def schedule_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура для расписания."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📅 Сегодня", callback_data="schedule_today"),
            InlineKeyboardButton(text="📅 Завтра", callback_data="schedule_tomorrow"),
        ],
        [
            InlineKeyboardButton(text="⏭ Следующая пара", callback_data="schedule_next"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu"),
        ],
    ])


def building_keyboard(building_number: int | None = None) -> InlineKeyboardMarkup:
    """Клавиатура после информации о корпусе."""
    buttons = []

    if building_number:
        buttons.append([
            InlineKeyboardButton(
                text="🗺 Открыть карту",
                url=f"https://yandex.ru/maps/?text=корпус+{building_number}",
            ),
        ])
        buttons.append([
            InlineKeyboardButton(text="🚪 Найти аудиторию", callback_data="find_room_prompt"),
        ])

    buttons.append([
        InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu"),
    ])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


def buildings_list_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура со списком корпусов."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="1️⃣ Главный корпус", callback_data="building_1"),
            InlineKeyboardButton(text="3️⃣ Корпус ИС", callback_data="building_3"),
        ],
        [
            InlineKeyboardButton(text="5️⃣ Лабораторный", callback_data="building_5"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu"),
        ],
    ])


def records_keyboard(url: str | None = None) -> InlineKeyboardMarkup:
    """Клавиатура после записи лекции."""
    buttons = []

    if url:
        buttons.append([
            InlineKeyboardButton(text="▶️ Открыть запись", url=url),
        ])

    buttons.append([
        InlineKeyboardButton(text="🔍 Найти другую лекцию", callback_data="find_record_prompt"),
    ])
    buttons.append([
        InlineKeyboardButton(text="📅 Показать расписание", callback_data="menu_schedule"),
    ])
    buttons.append([
        InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu"),
    ])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


def profile_keyboard(location_enabled: bool) -> InlineKeyboardMarkup:
    """Клавиатура профиля."""
    if location_enabled:
        location_btn = InlineKeyboardButton(
            text="📍 Выключить геолокацию",
            callback_data="location_off",
        )
    else:
        location_btn = InlineKeyboardButton(
            text="📍 Включить геолокацию",
            callback_data="location_on",
        )

    return InlineKeyboardMarkup(inline_keyboard=[
        [location_btn],
        [InlineKeyboardButton(text="🎓 Изменить группу", callback_data="change_group_prompt")],
        [InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu")],
    ])


def groups_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура выбора группы."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="ИС-21", callback_data="set_group_ИС-21"),
            InlineKeyboardButton(text="ЭК-11", callback_data="set_group_ЭК-11"),
        ],
        [
            InlineKeyboardButton(text="ЮР-32", callback_data="set_group_ЮР-32"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="menu_profile"),
        ],
    ])


def back_to_menu_keyboard() -> InlineKeyboardMarkup:
    """Простая кнопка возврата в меню."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад в меню", callback_data="back_to_menu")],
    ])
