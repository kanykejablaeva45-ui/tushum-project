@echo off
chcp 65001 >nul
echo ========================================
echo Firewall Configuration for Port 8000
echo ========================================
echo.
echo Adding firewall rule...
echo.

netsh advfirewall firewall add rule name="Tushum Web Server Port 8000" dir=in action=allow protocol=TCP localport=8000

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo SUCCESS! Port 8000 is now allowed
    echo ========================================
    echo.
    echo Rule added:
    echo   Name: Tushum Web Server Port 8000
    echo   Port: 8000
    echo   Protocol: TCP
    echo   Action: Allow
    echo.
    echo Server is now accessible from network!
    echo.
) else (
    echo.
    echo ERROR! Failed to add firewall rule
    echo.
    echo This requires Administrator privileges!
    echo.
    echo Please:
    echo 1. Right-click on this file
    echo 2. Select "Run as administrator"
    echo.
)

pause

