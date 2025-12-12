# Перезапуск сервера Түшүм
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Перезапуск сервера Түшүм" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Остановка старых процессов Python HTTP сервера
Write-Host "Остановка старых процессов..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*http.server*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 1

# Определение IP-адреса
Write-Host "Определение IP-адреса..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"
} | Select-Object -ExpandProperty IPAddress

if ($ipAddresses) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "АДРЕСА ДОСТУПА:" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Локальный доступ:" -ForegroundColor White
    Write-Host "  http://localhost:8000/login.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Доступ из сети:" -ForegroundColor White
    foreach ($ip in $ipAddresses) {
        Write-Host "  http://$ip`:8000/login.html" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "Не удалось определить IP-адрес автоматически" -ForegroundColor Yellow
    Write-Host "Используйте команду: ipconfig" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Локальный доступ:" -ForegroundColor White
    Write-Host "  http://localhost:8000/login.html" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Запуск сервера..." -ForegroundColor Green
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Переход в директорию скрипта
Set-Location $PSScriptRoot

# Запуск сервера
python -m http.server 8000 --bind 0.0.0.0

