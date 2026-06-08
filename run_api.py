import uvicorn
import dotenv
import os

if __name__ == "__main__":
    # Загружаем переменные окружения из .env
    dotenv.load_dotenv()
    
    print("Zapusk API Servera na http://127.0.0.1:8000")
    uvicorn.run("src.api.app:app", host="127.0.0.1", port=8000, reload=True)
