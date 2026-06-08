from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Smart Duty Officer API",
        description="API for the Smart Duty Officer website and assistant.",
        version="1.0.0",
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
