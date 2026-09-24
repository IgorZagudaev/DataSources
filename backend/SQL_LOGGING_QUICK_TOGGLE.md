# Быстрое включение/выключение SQL логирования

## Самый быстрый способ

### Включить логирование

```powershell
# 1. Измените config.php
notepad C:\web\sites\DataSources\api\config.php

# 2. Найдите строку:
'sql_logging' => false,

# 3. Замените на:
'sql_logging' => true,

# 4. Сохраните файл (Ctrl+S)

# 5. Перезапустите Apache
httpd -k restart
```

### Выключить логирование

```powershell
# 1. Измените config.php
notepad C:\web\sites\DataSources\api\config.php

# 2. Найдите строку:
'sql_logging' => true,

# 3. Замените на:
'sql_logging' => false,

# 4. Сохраните файл (Ctrl+S)

# 5. Перезапустите Apache
httpd -k restart
```

## Автоматические скрипты

### Включить логирование одной командой

```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"; httpd -k restart; Write-Host "SQL logging enabled"
```

### Выключить логирование одной командой

```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"; httpd -k restart; Write-Host "SQL logging disabled"
```

## Проверка статуса

```powershell
# Проверить текущее значение
Select-String -Path "C:\web\sites\DataSources\api\config.php" -Pattern "sql_logging"

# Проверить размер лога
if (Test-Path "C:\web\sites\DataSources\api\sql.log") {
    $size = (Get-Item "C:\web\sites\DataSources\api\sql.log").Length / 1MB
    Write-Host "Log size: $([math]::Round($size, 2)) MB"
} else {
    Write-Host "Log file does not exist"
}
```

## Типичные сценарии

### Сценарий 1: Отладка проблемы

```powershell
# Включить логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart

# Воспроизвести проблему в браузере

# Проанализировать лог
Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 50

# Отключить логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

### Сценарий 2: Мониторинг в реальном времени

```powershell
# Включить логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart

# Открыть лог в реальном времени
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait

# (В другом окне) Выполнить действия в браузере

# Отключить логирование (Ctrl+C в окне с логом, затем)
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

### Сценарий 3: Очистка лога

```powershell
# Очистить лог
Clear-Content "C:\web\sites\DataSources\api\sql.log"

# Или удалить файл
Remove-Item "C:\web\sites\DataSources\api\sql.log" -ErrorAction SilentlyContinue
```

## Рекомендации

### Для разработки
```powershell
# Держите логирование включенным
'sql_logging' => true,
```

### Для продакшена
```powershell
# Держите логирование отключенным
'sql_logging' => false,
```

### Для тестирования производительности
```powershell
# Обязательно отключите логирование
'sql_logging' => false,
```

## Быстрая справка

| Действие | Команда |
|----------|---------|
| Включить логирование | `'sql_logging' => true,` |
| Выключить логирование | `'sql_logging' => false,` |
| Перезапустить Apache | `httpd -k restart` |
| Просмотр лога | `Get-Content sql.log -Wait` |
| Очистить лог | `Clear-Content sql.log` |
| Проверить статус | `Select-String config.php -Pattern "sql_logging"` |

## Файлы

- **Конфигурация:** `C:\web\sites\DataSources\api\config.php`
- **Лог:** `C:\web\sites\DataSources\api\sql.log`
- **Документация:** `SQL_LOGGING_CONFIGURATION.md`
