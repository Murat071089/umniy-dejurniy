"""
SQL-схемы таблиц базы данных.
"""

TABLES_SQL = """
-- Группы студентов
CREATE TABLE IF NOT EXISTS groups_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    faculty TEXT,
    course INTEGER
);

-- Пользователи (студенты)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    full_name TEXT NOT NULL,
    group_name TEXT,
    role TEXT DEFAULT 'student',
    location_access INTEGER DEFAULT 0,
    last_location_name TEXT,
    last_location_updated_at TEXT,
    FOREIGN KEY (group_name) REFERENCES groups_table(name)
);

-- Корпуса
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    description TEXT,
    map_url TEXT
);

-- Аудитории
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER,
    room_number TEXT NOT NULL,
    floor INTEGER,
    description TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Преподаватели
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    short_name TEXT,
    department TEXT
);

-- Предметы
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    aliases TEXT  -- JSON-массив алиасов, например: ["матан", "мат анализ"]
);

-- Связь преподавателей и предметов
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    subject_id INTEGER,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Расписание
CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    teacher_name TEXT,
    building_number INTEGER,
    room_number TEXT,
    FOREIGN KEY (group_name) REFERENCES groups_table(name)
);

-- Записи лекций
CREATE TABLE IF NOT EXISTS lecture_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT NOT NULL,
    title TEXT,
    date TEXT,
    teacher_name TEXT,
    url TEXT
);
"""
