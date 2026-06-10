@echo off
cd /d "%~dp0"
echo Starting Telegram Bot in background...
start "" "C:\Python314\pythonw.exe" run.py
echo Starting API Server in background...
start "" "C:\Python314\pythonw.exe" run_api.py
echo.
echo =======================================================
echo Бот и API запущены в фоновом режиме!
echo Они будут работать даже после закрытия консоли и IDE.
echo.
echo Для остановки запустите stop_services.bat
echo =======================================================
pause
