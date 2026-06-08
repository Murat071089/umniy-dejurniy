"""
Парсер намерений (intent parser).
Определяет, что хочет узнать пользователь, на основе текста сообщения.
Использует гибридный подход: regex-правила + fuzzy matching для опечаток.
"""

import re
from dataclasses import dataclass, field
from fuzzywuzzy import fuzz, process

from src.nlp.aliases import SUBJECT_ALIASES, PLACE_ALIASES


@dataclass
class ParsedIntent:
    """Результат разбора намерения пользователя."""

    intent: str  # Тип намерения
    subject: str | None = None  # Название предмета (полное)
    building_number: int | None = None  # Номер корпуса
    room_number: str | None = None  # Номер аудитории
    student_name: str | None = None  # Имя студента
    group_name: str | None = None  # Группа
    place_name: str | None = None  # Название места (деканат и т.д.)
    raw_text: str = ""  # Исходный текст
    confidence: float = 0.0  # Уверенность (0.0 - 1.0)


def normalize_text(text: str) -> str:
    """Нормализация текста: нижний регистр, удаление лишних символов."""
    text = text.lower().strip()
    # Убираем лишние пробелы
    text = re.sub(r'\s+', ' ', text)
    # Убираем знаки препинания в конце
    text = text.rstrip('?!.,;:')
    return text


def fuzzy_match_subject(text: str) -> str | None:
    """Поиск предмета с учётом опечаток через fuzzy matching."""
    # Сначала точное совпадение
    text_lower = text.lower()
    if text_lower in SUBJECT_ALIASES:
        return SUBJECT_ALIASES[text_lower]

    # Fuzzy matching по алиасам
    aliases = list(SUBJECT_ALIASES.keys())
    match = process.extractOne(text_lower, aliases, scorer=fuzz.ratio)
    if match and match[1] >= 70:  # порог совпадения 70%
        return SUBJECT_ALIASES[match[0]]

    return None


def fuzzy_match_place(text: str) -> str | None:
    """Поиск места с учётом опечаток."""
    text_lower = text.lower()
    if text_lower in PLACE_ALIASES:
        return PLACE_ALIASES[text_lower]

    places = list(PLACE_ALIASES.keys())
    match = process.extractOne(text_lower, places, scorer=fuzz.ratio)
    if match and match[1] >= 75:
        return PLACE_ALIASES[match[0]]

    return None


def extract_building_number(text: str) -> int | None:
    """Извлечь номер корпуса из текста."""
    patterns = [
        r'(\d+)\s*корпус',
        r'корпус\s*[№#]?\s*(\d+)',
        r'корпус\s+(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return int(match.group(1))
    return None


def extract_room_number(text: str) -> str | None:
    """Извлечь номер аудитории из текста."""
    patterns = [
        r'аудитори[яию]\s*[№#]?\s*(\d+\w*)',
        r'кабинет\s*[№#]?\s*(\d+\w*)',
        r'ауд\.?\s*[№#]?\s*(\d+\w*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def extract_student_name(text: str) -> str | None:
    """Извлечь имя студента из текста."""
    # Паттерны для поиска имени
    patterns = [
        r'где\s+(?:сейчас\s+)?(?:находится\s+)?([А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+)',
        r'где\s+(?:щас\s+)?([А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+)',
        r'найти\s+(?:студента?\s+)?([А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+)',
        r'местоположение\s+([А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Исключаем общие слова, которые не являются именами
            skip_words = {
                'сейчас', 'находится', 'будет', 'пара', 'лекция',
                'корпус', 'аудитория', 'кабинет', 'группа', 'студент',
                'анна смирнова', 'петя иванов', 'максим орлов'
            }
            # Проверяем, что это выглядит как имя (два слова с заглавными)
            words = name.split()
            if len(words) == 2:
                return name.title()
    return None


def extract_group_name(text: str) -> str | None:
    """Извлечь название группы из текста."""
    match = re.search(r'([А-ЯЁа-яё]{2,4})[- ]?(\d{2})', text)
    if match:
        return f"{match.group(1).upper()}-{match.group(2)}"
    return None


def extract_subject_from_text(text: str) -> str | None:
    """Извлечь предмет из контекста вопроса."""
    # Паттерны контекста
    patterns = [
        r'(?:кто\s+)?вед[её]т\s+(.+?)(?:\s*\?|$)',
        r'преподаватель\s+(?:по\s+)?(.+?)(?:\s*\?|$)',
        r'препод\s+(?:по\s+)?(.+?)(?:\s*\?|$)',
        r'запись\s+(?:лекции?\s+)?(?:по\s+)?(.+?)(?:\s*\?|$)',
        r'пропустил[аи]?\s+(?:лекцию?\s+)?(?:по\s+)?(.+?)(?:\s*\?|$)',
        r'лекци[яию]\s+(?:по\s+)?(.+?)(?:\s*\?|$)',
        r'(?:по\s+предмету\s+)(.+?)(?:\s*\?|$)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            subject_text = match.group(1).strip()
            # Пытаемся найти предмет через алиасы
            result = fuzzy_match_subject(subject_text)
            if result:
                return result

    # Попробуем найти предмет напрямую в тексте
    for alias, full_name in SUBJECT_ALIASES.items():
        if alias in text.lower():
            return full_name

    return None


def parse_intent(text: str) -> ParsedIntent:
    """
    Определить намерение пользователя из текста сообщения.

    Возвращает ParsedIntent с типом намерения и извлечёнными параметрами.
    """
    normalized = normalize_text(text)
    result = ParsedIntent(intent="unknown", raw_text=text)

    # ==========================================
    # 1. РАСПИСАНИЕ НА СЕГОДНЯ
    # ==========================================
    schedule_today_patterns = [
        r'расписание\s+(?:на\s+)?сегодня',
        r'пары\s+сегодня',
        r'какие\s+(?:сегодня\s+)?пары',
        r'сегодня\s+(?:какие\s+)?пары',
        r'что\s+сегодня',
        r'расписание\s+на\s+сегодн',
        r'распасание\s+(?:на\s+)?сегодня',  # опечатка
    ]
    for pattern in schedule_today_patterns:
        if re.search(pattern, normalized):
            result.intent = "schedule_today"
            result.group_name = extract_group_name(normalized)
            result.confidence = 0.95
            return result

    # ==========================================
    # 2. РАСПИСАНИЕ НА ЗАВТРА
    # ==========================================
    schedule_tomorrow_patterns = [
        r'расписание\s+(?:на\s+)?завтра',
        r'пары\s+завтра',
        r'завтра\s+(?:какие\s+)?пары',
        r'что\s+завтра',
        r'распасание\s+(?:на\s+)?завтра',  # опечатка
    ]
    for pattern in schedule_tomorrow_patterns:
        if re.search(pattern, normalized):
            result.intent = "schedule_tomorrow"
            result.group_name = extract_group_name(normalized)
            result.confidence = 0.95
            return result

    # ==========================================
    # 3. СЛЕДУЮЩАЯ ПАРА
    # ==========================================
    next_lesson_patterns = [
        r'следующая\s+пара',
        r'какая\s+следующая',
        r'когда\s+следующая',
        r'ближайшая\s+пара',
        r'что\s+дальше',
        r'где\s+(?:будет\s+)?следующая\s+пара',
    ]
    for pattern in next_lesson_patterns:
        if re.search(pattern, normalized):
            result.intent = "next_lesson"
            result.group_name = extract_group_name(normalized)
            result.confidence = 0.9
            return result

    # ==========================================
    # 4. РАСПИСАНИЕ (общее — без привязки к дню)
    # ==========================================
    if re.search(r'расписани|распасани', normalized):
        result.intent = "schedule_today"  # по умолчанию — сегодня
        result.group_name = extract_group_name(normalized)
        result.confidence = 0.7
        return result

    # ==========================================
    # 5. ПОИСК СТУДЕНТА (геолокация)
    # ==========================================
    student_location_patterns = [
        r'где\s+(?:сейчас\s+|щас\s+)?(?:находится\s+)?[А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+',
        r'найти\s+студент',
        r'местоположение\s+',
        r'локация\s+',
    ]
    # Проверяем, но исключаем вопросы про корпуса/аудитории/места
    is_place_question = bool(re.search(
        r'корпус|аудитори|кабинет|деканат|библиотек|столов|спортзал|актовый',
        normalized
    ))

    if not is_place_question:
        for pattern in student_location_patterns:
            if re.search(pattern, normalized):
                name = extract_student_name(normalized)
                if name:
                    result.intent = "student_location"
                    result.student_name = name
                    result.confidence = 0.9
                    return result

    # ==========================================
    # 6. ПОИСК КОРПУСА
    # ==========================================
    building_number = extract_building_number(normalized)
    building_patterns = [
        r'где\s+(?:\d+\s+)?корпус',
        r'как\s+(?:найти|попасть|дойти)\s+(?:до\s+)?(?:\d+\s+)?корпус',
        r'корпус\s+(?:номер\s+)?\d+',
        r'\d+\s+корпус',
    ]
    for pattern in building_patterns:
        if re.search(pattern, normalized):
            result.intent = "find_building"
            result.building_number = building_number
            result.confidence = 0.95
            return result

    # ==========================================
    # 7. ПОИСК АУДИТОРИИ
    # ==========================================
    room_number = extract_room_number(normalized)
    room_patterns = [
        r'где\s+аудитори',
        r'где\s+кабинет',
        r'как\s+найти\s+аудитори',
        r'найти\s+ауд',
    ]
    for pattern in room_patterns:
        if re.search(pattern, normalized):
            result.intent = "find_room"
            result.room_number = room_number
            result.confidence = 0.9
            return result

    # Если нашли номер аудитории в тексте с "где"
    if room_number and re.search(r'где', normalized):
        result.intent = "find_room"
        result.room_number = room_number
        result.confidence = 0.8
        return result

    # ==========================================
    # 8. ПОИСК МЕСТА (деканат, библиотека и т.д.)
    # ==========================================
    for alias in PLACE_ALIASES:
        if alias in normalized:
            result.intent = "find_place"
            result.place_name = PLACE_ALIASES[alias]
            result.confidence = 0.9
            return result

    # Fuzzy match для мест
    place = fuzzy_match_place(normalized)
    if place and re.search(r'где|найти|как\s+попасть', normalized):
        result.intent = "find_place"
        result.place_name = place
        result.confidence = 0.75
        return result

    # ==========================================
    # 9. ПОИСК ПРЕПОДАВАТЕЛЯ
    # ==========================================
    teacher_patterns = [
        r'кто\s+вед[её]т',
        r'кто\s+преподает',
        r'кто\s+преподаёт',
        r'преподаватель\s+(?:по\s+)?',
        r'препод\s+(?:по\s+)?',
        r'кто\s+ведет',  # опечатка
    ]
    for pattern in teacher_patterns:
        if re.search(pattern, normalized):
            subject = extract_subject_from_text(normalized)
            result.intent = "find_teacher"
            result.subject = subject
            result.confidence = 0.9 if subject else 0.7
            return result

    # ==========================================
    # 10. ЗАПИСЬ ЛЕКЦИИ
    # ==========================================
    lecture_patterns = [
        r'запись\s+лекци',
        r'пропустил[аи]?\s+лекци',
        r'есть\s+запись',
        r'запись\s+(?:по\s+)?',
        r'видео\s+лекци',
        r'конспект\s+лекци',
    ]
    for pattern in lecture_patterns:
        if re.search(pattern, normalized):
            subject = extract_subject_from_text(normalized)
            result.intent = "lecture_recording"
            result.subject = subject
            result.confidence = 0.9 if subject else 0.7
            return result

    # ==========================================
    # 11. ПОСЛЕДНЯЯ ПОПЫТКА — fuzzy match предмета
    # ==========================================
    subject = fuzzy_match_subject(normalized)
    if subject:
        # Если упоминается предмет, но без явного контекста — предлагаем расписание
        result.intent = "find_teacher"
        result.subject = subject
        result.confidence = 0.5
        return result

    # ==========================================
    # 12. НЕ УДАЛОСЬ ОПРЕДЕЛИТЬ
    # ==========================================
    result.intent = "unknown"
    result.confidence = 0.0
    return result
