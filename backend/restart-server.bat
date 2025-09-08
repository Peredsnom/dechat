@echo off
echo 🔄 Останавливаем сервер на порту 3000...

REM Останавливаем процесс на порту 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Останавливаем процесс PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo ⏳ Ждем 3 секунды...
timeout /t 3 /nobreak >nul

echo 🚀 Запускаем сервер...
npm start
