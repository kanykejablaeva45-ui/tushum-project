Write-Host "========================================" -ForegroundColor Green
Write-Host "Настройка файрвола для порта 8000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ВНИМАНИЕ: Требуются права администратора!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Запустите PowerShell от имени администратора:" -ForegroundColor Cyan
    Write-Host "1. Правой кнопкой мыши на PowerShell" -ForegroundColor White
    Write-Host "2. Выберите 'Запуск от имени администратора'" -ForegroundColor White
    Write-Host "3. Перейдите в папку проекта" -ForegroundColor White
    Write-Host "4. Запустите: .\allow-port-8000.ps1" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

Write-Host "Добавление правила для входящих подключений на порт 8000..." -ForegroundColor Cyan
Write-Host ""

try {
    # Удаляем старое правило, если существует
    Remove-NetFirewallRule -DisplayName "Түшүм Web Server" -ErrorAction SilentlyContinue
    
    # Добавляем новое правило
    New-NetFirewallRule -DisplayName "Түшүм Web Server" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "УСПЕШНО! Порт 8000 разрешен" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Правило файрвола добавлено:" -ForegroundColor White
    Write-Host "  Название: Түшүм Web Server" -ForegroundColor Gray
    Write-Host "  Порт: 8000" -ForegroundColor Gray
    Write-Host "  Протокол: TCP" -ForegroundColor Gray
    Write-Host "  Действие: Разрешить" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Теперь сервер доступен из сети!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ОШИБКА! Не удалось добавить правило файрвола" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

pause

