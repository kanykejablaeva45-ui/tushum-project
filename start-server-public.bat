@echo off
echo ========================================
echo Запуск ОБЩЕДОСТУПНОГО сервера Түшүм
echo ========================================
echo.
echo ВНИМАНИЕ: Сервер будет доступен из интернета!
echo Убедитесь, что файрвол разрешает входящие соединения на порт 8000
echo.
echo Локальный доступ:
echo   http://localhost:8000/login.html
echo.
echo Доступ в локальной сети:
echo   http://[ВАШ_ЛОКАЛЬНЫЙ_IP]:8000/login.html
echo.
echo Доступ из интернета (если настроен):
echo   http://[ВАШ_ПУБЛИЧНЫЙ_IP]:8000/login.html
echo.
echo Для определения IP-адресов используйте:
echo   ipconfig - для локального IP
echo   https://whatismyipaddress.com - для публичного IP
echo.
echo Нажмите Ctrl+C для остановки сервера
echo ========================================
echo.
python -m http.server 8000 --bind 0.0.0.0
pause

