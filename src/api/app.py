import os
import logging
from logging.handlers import RotatingFileHandler
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.database.db import init_db, close_db
from src.database.seed import seed_database

# Настройка логирования API в файл
log_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs"
)
os.makedirs(log_dir, exist_ok=True)
api_log_path = os.path.join(log_dir, "api.log")

log_formatter = logging.Formatter(
    fmt="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

file_handler = RotatingFileHandler(
    api_log_path,
    maxBytes=5 * 1024 * 1024,  # 5 MB
    backupCount=3,
    encoding="utf-8",
)
file_handler.setFormatter(log_formatter)

# Добавляем файловый логгер ко всем ключевым логгерам бэкенда
for logger_name in ("", "uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
    logger = logging.getLogger(logger_name)
    logger.addHandler(file_handler)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация БД при старте и закрытие при остановке."""
    await init_db()
    await seed_database()
    yield
    await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Smart Duty Officer API",
        description="API for the Smart Duty Officer website and assistant.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS settings to allow local React app to communicate
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routes
    app.include_router(router, prefix="/api")

    return app

app = create_app()
