@echo off
echo ========================================
echo Запуск ОБЩЕДОСТУПНОГО сервера Түшүм
echo Доступен во ВСЕЙ СЕТИ
echo ========================================
echo.
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
    echo Доступ из сети (на других устройствах):
    echo   http://!IP!:8000/login.html
    echo.
    echo ========================================
    echo Сервер запущен и доступен во всей сети!
    echo Нажмите Ctrl+C для остановки
    echo ========================================
    echo.
    goto :start
)
:start
python -m http.server 8000 --bind 0.0.0.0
pause
