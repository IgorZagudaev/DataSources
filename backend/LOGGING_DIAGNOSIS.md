# Диагностика и исправление проблем с логированием

## Проблема

Тесты в `test_logging.php` проходят успешно, но при реальной работе с системой в `actions.log` ничего не пишется.

## Причины и решения

### Причина 1: Файл actions.log не создан или нет прав доступа

**Диагностика:**
```powershell
# Проверьте существование файла
Test-Path "C:\web\sites\DataSources\api\actions.log"

# Проверьте права
Get-Acl "C:\web\sites\DataSources\api\actions.log"
```

**Решение:**
```powershell
# Запустите скрипт инициализации
http://ваш_сервер/DataSources/api/init_logging.php

# Или создайте файл вручную
New-Item -Path "C:\web\sites\DataSources\api\actions.log" -ItemType File

# Дайте права на запись
icacls "C:\web\sites\DataSources\api\actions.log" /grant "Все:F"
icacls "C:\web\sites\DataSources\api" /grant "Все:F"
```

### Причина 2: PHP не может записать в файл

**Диагностика:**
1. Откройте `http://ваш_сервер/DataSources/api/init_logging.php`
2. Проверьте результаты тестов
3. Если тестовая запись не проходит - проблема в правах

**Решение для Windows:**
```powershell
# Дайте права пользователю Apache/IIS
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)F"
icacls "C:\web\sites\DataSources\api" /grant "SYSTEM:(OI)(CI)F"

# Или дайте права всем (не рекомендуется для продакшена)
icacls "C:\web\sites\DataSources\api" /grant "Все:(OI)(CI)F"
```

**Решение для Linux:**
```bash
# Измените владельца
sudo chown -R www-data:www-data /path/to/api

# Установите права
sudo chmod -R 775 /path/to/api

# Создайте файл с правильными правами
sudo touch /path/to/api/actions.log
sudo chmod 664 /path/to/api/actions.log
```

### Причина 3: Функция logAction() не вызывается

**Диагностика:**
1. Откройте `backend/api/index.php`
2. Найдите вызовы `logAction()` в обработчиках CRUD
3. Проверьте, что файл `action_logger.php` подключен

**Проверка подключения:**
```bash
# В файле index.php должна быть строка:
require_once __DIR__ . '/action_logger.php';
```

### Причина 4: Ошибки подавляются оператором @

**Решение:**
В файле `action_logger.php` убран оператор `@` перед `file_put_contents()`:

```php
// Было:
$result = @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

// Стало:
$result = file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
```

Теперь ошибки будут видны в логах PHP.

## Пошаговая диагностика

### Шаг 1: Запустите инициализацию

```
http://ваш_сервер/DataSources/api/init_logging.php
```

Убедитесь, что:
- ✅ Файл создан
- ✅ Права доступа корректны
- ✅ Тестовая запись успешна

### Шаг 2: Проверьте логи PHP

```powershell
# Откройте логи Apache
Get-Content "C:\web\Apache24\logs\error.log" -Tail 50

# Или логи PHP
Get-Content "C:\web\php8\logs\php_error.log" -Tail 50
```

Ищите сообщения:
- `logAction вызван: action=add, type=report, ...`
- `Не удалось записать в actions.log: ...`
- `Исключение в logAction: ...`

### Шаг 3: Выполните действие в приложении

1. Откройте приложение
2. Добавьте новый доклад
3. Проверьте файл `actions.log`:

```powershell
Get-Content "C:\web\sites\DataSources\api\actions.log" -Tail 10
```

Ожидаемый результат:
```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Доклад 1
```

### Шаг 4: Проверьте вызовы logAction()

В файле `index.php` должны быть вызовы:

```php
// Для добавления
logAction('add', 'report', $newId, $input['name']);

// Для редактирования
logAction('edit', 'report', $id, $input['name']);

// Для удаления
logAction('delete', 'report', $id, $reportName);
```

## Расширенное логирование

Если проблема не решена, добавьте временное логирование в `action_logger.php`:

```php
function logAction($action, $entityType, $entityId, $entityName, $details = '') {
    // Временное логирование для диагностики
    error_log("=== logAction ВЫЗВАН ===");
    error_log("Action: $action");
    error_log("Type: $entityType");
    error_log("ID: $entityId");
    error_log("Name: $entityName");
    
    $logFile = __DIR__ . '/actions.log';
    error_log("Log file path: $logFile");
    error_log("File exists: " . (file_exists($logFile) ? 'yes' : 'no'));
    error_log("File writable: " . (is_writable($logFile) ? 'yes' : 'no'));
    
    // ... остальной код ...
}
```

Затем проверьте логи PHP:
```powershell
Get-Content "C:\web\Apache24\logs\error.log" -Tail 100 | Select-String "logAction"
```

## Проверка прав доступа

### Windows

```powershell
# Проверьте права
Get-Acl "C:\web\sites\DataSources\api"

# Должны быть права для:
# - IIS_IUSRS (или пользователь Apache)
# - SYSTEM
# - Администраторы

# Если прав нет, добавьте:
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)F"
icacls "C:\web\sites\DataSources\api" /grant "SYSTEM:(OI)(CI)F"
```

### Linux

```bash
# Проверьте владельца
ls -la /path/to/api/

# Должен быть www-data или apache

# Измените владельца
sudo chown -R www-data:www-data /path/to/api/

# Установите права
sudo chmod -R 775 /path/to/api/
```

## Проверка конфигурации PHP

### Проверьте настройки PHP

```bash
php -i | grep "error_log"
php -i | grep "display_errors"
```

### Включите логирование ошибок

В `php.ini`:
```ini
log_errors = On
error_log = "C:\web\php8\logs\php_error.log"
display_errors = Off
```

Перезапустите Apache:
```bash
httpd -k restart
```

## Проверка работы функции

Создайте тестовый скрипт `test_log_function.php`:

```php
<?php
require_once __DIR__ . '/action_logger.php';

echo "<h1>Тест функции logAction()</h1>";

$result = logAction('test', 'function_test', 'test-123', 'Test Name', 'Test details');

if ($result) {
    echo "<p style=\"color:green\">✅ Функция работает!</p>";
} else {
    echo "<p style=\"color:red\">❌ Функция не работает!</p>";
}

echo "<h2>Содержимое actions.log:</h2>";
echo "<pre>";
echo file_get_contents(__DIR__ . '/actions.log');
echo "</pre>";
?>
```

Запустите:
```
http://ваш_сервер/DataSources/api/test_log_function.php
```

## Решение проблем

### Проблема: Файл создается, но пустой

**Причина:** Функция `logAction()` вызывается, но запись не происходит

**Решение:**
1. Проверьте логи PHP на наличие ошибок
2. Убедитесь, что файл доступен для записи
3. Проверьте, что не используется `LOCK_EX` с неправильными правами

### Проблема: Ошибки в логах PHP

**Причина:** PHP не может записать в файл

**Решение:**
1. Проверьте права доступа
2. Проверьте, что файл не заблокирован другим процессом
3. Попробуйте записать вручную:
   ```php
   file_put_contents('test.txt', 'test');
   ```

### Проблема: Функция не вызывается

**Причина:** Обработчики CRUD не вызывают `logAction()`

**Решение:**
1. Проверьте, что `action_logger.php` подключен
2. Проверьте, что вызовы `logAction()` есть в коде
3. Добавьте `error_log("logAction вызван")` в начало функции

## Файлы для загрузки

```
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/init_logging.php → C:/web/sites/DataSources/api/
backend/api/test_log_function.php → C:/web/sites/DataSources/api/
```

## Проверка после исправления

1. Запустите `init_logging.php`
2. Выполните действие в приложении
3. Проверьте `actions.log`:
   ```powershell
   Get-Content "C:\web\sites\DataSources\api\actions.log" -Tail 10
   ```
4. Должны появиться записи о действиях

## Контакты для поддержки

Если проблема не решена, предоставьте:

1. Результат выполнения `init_logging.php`
2. Содержимое `error.log` Apache
3. Содержимое `php_error.log`
4. Результат выполнения `test_log_function.php`
5. Права доступа к файлу `actions.log`:
   ```powershell
   Get-Acl "C:\web\sites\DataSources\api\actions.log"
   ```

---

**Дата:** 2026-09-17  
**Статус:** 🔧 Диагностика  
**Готово к развёртыванию:** ⚠️ Требуется проверка
