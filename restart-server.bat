@echo off
echo ========================================
echo Перезапуск сервера Түшүм
echo ========================================
echo.

echo Остановка старых процессов...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *http.server*" 2>nul
timeout /t 1 /nobreak >nul

echo Определение IP-адреса...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Найден IP: !IP!
    echo.
    echo ========================================
    echo АДРЕСА ДОСТУПА:
    echo ========================================
    echo Локальный доступ:
    echo   http://localhost:8000/login.html
    echo.
    echo Доступ из сети:
    echo   http://!IP!:8000/login.html
    echo.
    echo ========================================
    echo Запуск сервера...
    echo Нажмите Ctrl+C для остановки
    echo ========================================
    echo.
    goto :start
)

:start
cd /d "%~dp0"
python -m http.server 8000 --bind 0.0.0.0

