# Настройка сетевого доступа для сервера Түшүм
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "НАСТРОЙКА СЕТЕВОГО ДОСТУПА" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ОШИБКА: Требуются права администратора!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Запустите этот скрипт от имени администратора:" -ForegroundColor Yellow
    Write-Host "1. Правой кнопкой мыши на файл" -ForegroundColor White
    Write-Host "2. Выберите 'Запуск от имени администратора'" -ForegroundColor White
    Write-Host ""
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host "Проверка существующих правил..." -ForegroundColor Yellow

# Удаление старого правила, если существует
$existingRule = Get-NetFirewallRule -DisplayName "Tushum Web Server" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Удаление старого правила..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Tushum Web Server" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Добавление правила файрвола для порта 8000..." -ForegroundColor Yellow

try {
    New-NetFirewallRule -DisplayName "Tushum Web Server" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 8000 `
        -Action Allow `
        -Description "Разрешить входящие соединения для веб-сервера Түшүм на порту 8000" | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "УСПЕШНО!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Правило файрвола добавлено:" -ForegroundColor White
    Write-Host "  Название: Tushum Web Server" -ForegroundColor Gray
    Write-Host "  Порт: 8000" -ForegroundColor Gray
    Write-Host "  Протокол: TCP" -ForegroundColor Gray
    Write-Host "  Действие: Разрешить входящие соединения" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Теперь сервер доступен из сети!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Адреса для доступа:" -ForegroundColor Yellow
    Write-Host "  http://192.168.56.1:8000/login.html" -ForegroundColor Cyan
    Write-Host "  http://172.20.10.2:8000/login.html" -ForegroundColor Cyan
    Write-Host ""
    
    # Проверка правила
    $rule = Get-NetFirewallRule -DisplayName "Tushum Web Server" -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host "Проверка правила:" -ForegroundColor Yellow
        $rule | Format-Table DisplayName, Enabled, Direction, Action -AutoSize
    }
    
} catch {
    Write-Host ""
    Write-Host "ОШИБКА: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Read-Host "Нажмите Enter для выхода"

