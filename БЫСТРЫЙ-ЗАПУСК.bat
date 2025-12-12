@echo off
chcp 65001 >nul
cls
echo ========================================
echo   БЫСТРЫЙ ЗАПУСК СЕРВЕРА ТҮШҮМ
echo ========================================
echo.

cd /d "%~dp0"

echo Проверка Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Python не установлен!
    echo Установите Python с https://www.python.org
    pause
    exit /b 1
)

echo Python найден!
echo.

echo Остановка старых процессов...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *http.server*" >nul 2>&1
timeout /t 1 /nobreak >nul

echo Запуск сервера...
echo.
echo ========================================
echo   СЕРВЕР ЗАПУЩЕН!
echo ========================================
echo.
echo Откройте в браузере:
echo   http://localhost:8000/login.html
echo.
echo Для остановки нажмите Ctrl+C
echo ========================================
echo.

python -m http.server 8000 --bind 0.0.0.0

pause

