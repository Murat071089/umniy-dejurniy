@echo off
cd /d "%~dp0"
echo Stopping Telegram Bot and API Server...
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name = 'pythonw.exe' or Name = 'python.exe'\" | Where-Object { $_.CommandLine -like '*run.py*' -or $_.CommandLine -like '*run_api.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host 'Stopped process' $_.ProcessId }"
echo.
echo =======================================================
echo Бот и API успешно остановлены!
echo =======================================================
pause
