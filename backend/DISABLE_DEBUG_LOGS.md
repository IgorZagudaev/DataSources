# Отключение отладочных логов в error.log Apache

## Проблема

В файл `error.log` Apache записываются отладочные сообщения:

```
[Mon Sep 28 15:51:14.072137 2026] [php:notice] === handleImport called ===
[Mon Sep 28 15:51:14.072137 2026] [php:notice] Importing 1 reports
[Mon Sep 28 15:51:14.072137 2026] [php:notice] First source structure: {...}
[Mon Sep 28 15:51:14.072137 2026] [php:notice] Source types: []
```

## Причина

В коде PHP используются функции `error_log()`, которые по умолчанию пишут в `error.log` Apache. Это временные отладочные сообщения, которые были добавлены для диагностики проблем.

## Решение

Все отладочные сообщения **закомментированы** в файле `backend/api/index.php`:

```php
// Было:
error_log("=== handleImport called ===");

// Стало:
// error_log("=== handleImport called ===");
```

## Что закомментировано

### В функции handleImport():
- `=== handleImport called ===`
- `Invalid import data: reports not set or not array`
- `Importing X reports`
- `First source structure: {...}`
- `Source types: []`
- `Importing report X: ...`
- `Warning: Report X has no name, skipping`
- `Importing section X: ...`
- `Warning: Section X has no name, skipping`
- `Warning: Note X has no name, skipping`
- `Importing source: ..., source_types: ...`
- `=== Import completed successfully ===`
- `=== Import failed: ... ===`
- `Stack trace: ...`

### В функции handleSources() (PUT):
- `Updating source ID: ...`
- `Input data: ...`
- `Error updating source: name is required`
- `Source types to save: ...`

## Что оставлено включённым

### Критические ошибки (должны быть в логах):
- `=== Import failed: ... ===` - ошибки при импорте
- Ошибки SQL запросов
- Ошибки подключения к БД

### SQL логирование (опциональное):
Управляется через параметр `sql_logging` в `config.php`:
```php
'app' => [
    'sql_logging' => true, // true = включить, false = выключить
]
```

### Логирование действий пользователей:
Записывается в отдельный файл `actions.log`, не в `error.log`.

## Применение изменений

### 1. Загрузите обновлённый файл на сервер

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте логи

Выполните любое действие в приложении и проверьте `error.log`:

```powershell
Get-Content "C:\web\Apache24\logs\error.log" -Tail 20
```

Отладочные сообщения больше не должны появляться.

## Очистка старых логов

Если нужно очистить старые отладочные сообщения:

```powershell
# Очистить error.log
Clear-Content "C:\web\Apache24\logs\error.log"

# Или создать резервную копию и очистить
Copy-Item "C:\web\Apache24\logs\error.log" "C:\web\Apache24\logs\error_backup.log"
Clear-Content "C:\web\Apache24\logs\error.log"
```

## Настройка уровня логирования Apache

Если нужно полностью отключить PHP notices в error.log:

### В httpd.conf:

```apache
# Установить уровень логирования
LogLevel warn

# Или отключить PHP notices
php_value display_errors Off
php_value log_errors On
php_value error_log "C:/web/Apache24/logs/php_errors.log"
```

Это перенаправит все PHP ошибки в отдельный файл `php_errors.log`.

## Мониторинг логов

### Проверка размера error.log

```powershell
$size = (Get-Item "C:\web\Apache24\logs\error.log").Length / 1MB
Write-Host "Размер error.log: $([math]::Round($size, 2)) MB"
```

### Автоматическая ротация логов

Создайте скрипт `rotate_logs.ps1`:

```powershell
$logDir = "C:\web\Apache24\logs"
$maxSizeMB = 100

Get-ChildItem "$logDir\*.log" | ForEach-Object {
    $sizeMB = $_.Length / 1MB
    if ($sizeMB -gt $maxSizeMB) {
        $backupName = "$($_.BaseName)_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        Move-Item $_.FullName "$logDir\$backupName"
        Write-Host "Rotated: $($_.Name) -> $backupName"
    }
}
```

Настройте выполнение через Планировщик заданий Windows.

## Различия между логами

### error.log (Apache)
- **Что пишется:** Критические ошибки PHP, SQL ошибки
- **Когда писать:** Только при ошибках
- **Где смотреть:** `C:\web\Apache24\logs\error.log`

### actions.log (приложение)
- **Что пишется:** Действия пользователей (добавление, редактирование, удаление)
- **Когда писать:** При каждом действии
- **Где смотреть:** `C:\web\sites\DataSources\api\actions.log`

### sql.log (приложение)
- **Что пишется:** Все SQL запросы
- **Когда писать:** Управляется через `config.php`
- **Где смотреть:** `C:\web\sites\DataSources\api\sql.log`

## Рекомендации

### Для продакшена:

1. **Отладочные логи** - отключены ✅
2. **SQL логи** - отключены (`sql_logging => false`)
3. **Actions логи** - включены (аудит действий)
4. **Уровень логирования Apache** - `LogLevel warn`

### Для разработки:

1. **Отладочные логи** - включены (раскомментируйте)
2. **SQL логи** - включены (`sql_logging => true`)
3. **Actions логи** - включены
4. **Уровень логирования Apache** - `LogLevel debug`

## Проверка

После применения изменений:

1. Выполните действие в приложении
2. Проверьте `error.log` - отладочных сообщений быть не должно
3. Проверьте `actions.log` - действия должны записываться
4. Проверьте `sql.log` - зависит от настройки `sql_logging`

## Файлы для загрузки

```
backend/api/index.php → C:/web/sites/DataSources/api/
```

## Заключение

Все отладочные сообщения закомментированы. В `error.log` Apache будут записываться только критические ошибки. Для логирования действий пользователей используется отдельный файл `actions.log`.
