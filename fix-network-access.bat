@echo off
chcp 65001 >nul
cls
echo ========================================
echo   НАСТРОЙКА СЕТЕВОГО ДОСТУПА
echo ========================================
echo.

:: Проверка прав администратора
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Требуются права администратора!
    echo.
    echo Запустите этот файл от имени администратора:
    echo 1. Правой кнопкой мыши на файл
    echo 2. Выберите "Запуск от имени администратора"
    echo.
    pause
    exit /b 1
)

echo Проверка существующих правил...
netsh advfirewall firewall show rule name="Tushum Web Server" >nul 2>&1
if %errorlevel% == 0 (
    echo Правило уже существует, удаление старого...
    netsh advfirewall firewall delete rule name="Tushum Web Server" >nul 2>&1
)

echo.
echo Добавление правила файрвола для порта 8000...
netsh advfirewall firewall add rule name="Tushum Web Server" dir=in action=allow protocol=TCP localport=8000

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo   УСПЕШНО!
    echo ========================================
    echo.
    echo Правило файрвола добавлено:
    echo   Название: Tushum Web Server
    echo   Порт: 8000
    echo   Протокол: TCP
    echo   Действие: Разрешить входящие соединения
    echo.
    echo Теперь сервер доступен из сети!
    echo.
    echo Адреса для доступа:
    echo   http://192.168.56.1:8000/login.html
    echo   http://172.20.10.2:8000/login.html
    echo.
) else (
    echo.
    echo ОШИБКА! Не удалось добавить правило
    echo.
)

pause

