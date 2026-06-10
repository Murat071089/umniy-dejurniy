import uvicorn
import dotenv
import os

if __name__ == "__main__":
    # Загружаем переменные окружения из .env
    dotenv.load_dotenv()
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Zapusk API Servera na http://{host}:{port}")
    uvicorn.run("src.api.app:app", host=host, port=port, reload=True)
