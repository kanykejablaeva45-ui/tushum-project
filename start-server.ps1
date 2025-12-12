Write-Host "========================================" -ForegroundColor Green
Write-Host "Запуск ОБЩЕДОСТУПНОГО сервера Түшүм" -ForegroundColor Green
Write-Host "Доступен во ВСЕЙ СЕТИ" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Определение IP-адреса
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "Найден IP-адрес: $ipAddress" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "АДРЕСА ДОСТУПА:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Локальный доступ:" -ForegroundColor White
    Write-Host "  http://localhost:8000/login.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Доступ из сети (на других устройствах):" -ForegroundColor White
    Write-Host "  http://$ipAddress:8000/login.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Сервер запущен и доступен во всей сети!" -ForegroundColor Green
    Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "Не удалось определить IP-адрес автоматически" -ForegroundColor Yellow
    Write-Host "Используйте команду: ipconfig" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Локальный доступ:" -ForegroundColor White
    Write-Host "  http://localhost:8000/login.html" -ForegroundColor Gray
}

Write-Host ""
python -m http.server 8000 --bind 0.0.0.0
