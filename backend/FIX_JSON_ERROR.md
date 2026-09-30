# Исправление ошибки "Unexpected token '<'" при загрузке данных

## Проблема

При загрузке данных из API появляется ошибка:
```
Error loading from API: SyntaxError: Unexpected token '<', "<br /><b>"... is not valid JSON
```

Это означает, что PHP возвращает HTML с ошибкой вместо JSON.

## Причина

PHP выводит предупреждения или ошибки HTML до отправки JSON ответа.

## Решение

### Шаг 1: Обновите index.php

Замените файл `C:\web\sites\DataSources\api\index.php` на обновлённую версию из `backend/api/index.php`.

Основные изменения:
1. Добавлена буферизация вывода `ob_start()` в начале файла
2. Отключено отображение ошибок `ini_set('display_errors', 0)`
3. Созданы функции `sendJsonResponse()` и `sendJsonError()` для корректной отправки JSON
4. Все `echo json_encode()` заменены на `sendJsonResponse()`

### Шаг 2: Замените все echo json_encode

Если автоматическая замена не сработала, выполните вручную:

**В PowerShell:**
```powershell
$file = "C:\web\sites\DataSources\api\index.php"
$content = Get-Content $file -Raw
$content = $content -replace 'echo json_encode\(', 'sendJsonResponse('
Set-Content $file $content
```

**Или используйте скрипт:**
```powershell
powershell -ExecutionPolicy Bypass -File backend\fix_json_responses.ps1
```

### Шаг 3: Проверьте php.ini

Откройте `C:\web\php8\php.ini` и убедитесь, что:
```ini
display_errors = Off
error_reporting = E_ALL
log_errors = On
error_log = "C:\web\Apache24\logs\php_errors.log"
```

Перезапустите Apache:
```bash
httpd -k restart
```

### Шаг 4: Проверьте логи PHP

Откройте `C:\web\Apache24\logs\php_errors.log` или `error.log` и найдите ошибки.

## Проверка работы

### Тест 1: Проверьте diagnose.php

```
http://ваш_сервер/DataSources/api/diagnose.php
```

Должен вернуть JSON без HTML ошибок.

### Тест 2: Проверьте permissions.php

```
http://ваш_сервер/DataSources/api/permissions.php
```

Должен вернуть JSON с правами пользователя.

### Тест 3: Проверьте reports

```
http://ваш_сервер/DataSources/api/reports
```

Должен вернуть JSON с данными.

### Тест 4: Проверьте в браузере

1. Откройте приложение
2. Откройте консоль браузера (F12)
3. Перейдите на вкладку Network
4. Обновите страницу
5. Найдите запрос к `/api/reports`
6. Проверьте Response - должен быть JSON, не HTML

## Если проблема сохраняется

### Проверка 1: Включите отображение ошибок временно

В `index.php` временно измените:
```php
ini_set('display_errors', 1); // Временно включите
```

Обновите страницу и посмотрите, какая ошибка выводится.

### Проверка 2: Проверьте синтаксис PHP

```bash
php -l C:\web\sites\DataSources\api\index.php
```

Должно вывести: `No syntax errors detected`

### Проверка 3: Проверьте подключение к БД

```bash
php -r "require 'C:/web/sites/DataSources/api/Database.php'; $db = Database::getConnection(); echo 'OK';"
```

Должно вывести: `OK`

### Проверка 4: Проверьте права доступа

```powershell
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)R"
icacls "C:\web\sites\DataSources\api" /grant "SYSTEM:(OI)(CI)R"
```

## Альтернативное решение

Если ничего не помогает, создайте простой тестовый файл:

**Файл: `C:\web\sites\DataSources\api\test.php`**
```php
<?php
header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'time' => date('Y-m-d H:i:s')]);
```

Откройте: `http://ваш_сервер/DataSources/api/test.php`

Если работает, значит проблема в `index.php`.

## Файлы для загрузки

```
backend/api/index.php → C:\web\sites\DataSources\api\
backend/api/fix_json_responses.ps1 → C:\web\sites\DataSources\
```

## Логи для проверки

- Apache error log: `C:\web\Apache24\logs\error.log`
- PHP error log: `C:\web\Apache24\logs\php_errors.log` (если настроен)
- SQL log: `C:\web\sites\DataSources\api\sql.log`
- Actions log: `C:\web\sites\DataSources\api\actions.log`

---

**Дата:** 2026-09-17  
**Статус:** 🔧 Диагностика  
**Приоритет:** Высокий
