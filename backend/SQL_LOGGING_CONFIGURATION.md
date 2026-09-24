# Управление SQL логированием через конфигурацию

## Описание

Логирование SQL запросов можно включать и выключать через параметр в файле конфигурации `config.php`.

## Расположение файла конфигурации

```
C:/web/sites/DataSources/api/config.php
```

## Структура конфигурации

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => '5432',
        'dbname' => 'report_data_sources',
        'user' => 'postgres',
        'password' => 'your_password_here',
        'charset' => 'utf8',
    ],
    'app' => [
        'debug' => false,
        'cors_origins' => ['*'],
        'sql_logging' => true, // ← Параметр управления логированием
    ]
];
```

## Параметр sql_logging

### Значения:

- **`true`** - логирование включено (все SQL запросы записываются в `sql.log`)
- **`false`** - логирование отключено (файл `sql.log` не создается/не обновляется)

### По умолчанию:

```php
'sql_logging' => true
```

## Как использовать

### Включение логирования

1. Откройте файл `C:/web/sites/DataSources/api/config.php`
2. Установите параметр:
   ```php
   'sql_logging' => true,
   ```
3. Сохраните файл
4. Перезапустите Apache:
   ```bash
   httpd -k restart
   ```

### Отключение логирования

1. Откройте файл `C:/web/sites/DataSources/api/config.php`
2. Установите параметр:
   ```php
   'sql_logging' => false,
   ```
3. Сохраните файл
4. Перезапустите Apache:
   ```bash
   httpd -k restart
   ```

## Рекомендации по использованию

### Для разработки (Development)

```php
'sql_logging' => true,
```

**Преимущества:**
- Полная отладка SQL запросов
- Возможность анализировать производительность
- Поиск ошибок в запросах
- Мониторинг работы приложения

### Для продакшена (Production)

```php
'sql_logging' => false,
```

**Преимущества:**
- Меньше нагрузка на диск
- Быстрее работа приложения
- Не растет размер логов
- Меньше информации для потенциальных атак

### Для тестирования производительности

```php
'sql_logging' => false,
```

**Причина:**
Логирование добавляет накладные расходы на запись в файл, что может исказить результаты тестов.

## Проверка статуса логирования

### Способ 1: Проверка файла конфигурации

```powershell
Select-String -Path "C:\web\sites\DataSources\api\config.php" -Pattern "sql_logging"
```

**Ожидаемый результат:**
```
'sql_logging' => true,
```

или

```
'sql_logging' => false,
```

### Способ 2: Проверка наличия лога

```powershell
if (Test-Path "C:\web\sites\DataSources\api\sql.log") {
    Write-Host "Логирование включено, файл существует"
    Get-Item "C:\web\sites\DataSources\api\sql.log" | Select-Object Length, LastWriteTime
} else {
    Write-Host "Логирование отключено или лог еще не создан"
}
```

### Способ 3: Тестовый запрос

1. Включите логирование
2. Выполните любое действие в приложении
3. Проверьте, появился ли файл `sql.log`
4. Выключите логирование
5. Выполните действие снова
6. Проверьте, что файл не обновляется

## Автоматическое переключение

### Скрипт для включения логирования

Создайте файл `enable_sql_logging.ps1`:

```powershell
$configFile = "C:\web\sites\DataSources\api\config.php"
$content = Get-Content $configFile -Raw
$content = $content -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true"
Set-Content $configFile $content
Write-Host "SQL логирование включено"
Write-Host "Перезапустите Apache: httpd -k restart"
```

### Скрипт для отключения логирования

Создайте файл `disable_sql_logging.ps1`:

```powershell
$configFile = "C:\web\sites\DataSources\api\config.php"
$content = Get-Content $configFile -Raw
$content = $content -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false"
Set-Content $configFile $content
Write-Host "SQL логирование отключено"
Write-Host "Перезапустите Apache: httpd -k restart"
```

### Использование скриптов

```powershell
# Включить логирование
.\enable_sql_logging.ps1
httpd -k restart

# Отключить логирование
.\disable_sql_logging.ps1
httpd -k restart
```

## Переключение через переменные окружения

### Альтернативный способ

Можно использовать переменные окружения вместо файла конфигурации:

#### 1. Измените функцию logSQL():

```php
function logSQL($sql, $params = [], $result = null, $error = null) {
    // Проверяем переменную окружения
    $sqlLogging = getenv('SQL_LOGGING');
    if ($sqlLogging === 'false' || $sqlLogging === '0') {
        return; // Логирование отключено
    }
    
    // Если переменная не установлена, используем конфиг
    $config = require __DIR__ . '/config.php';
    if (!isset($config['app']['sql_logging']) || !$config['app']['sql_logging']) {
        return;
    }
    
    // ... остальной код логирования
}
```

#### 2. Установка переменной окружения в Windows

**Через PowerShell (временно):**
```powershell
$env:SQL_LOGGING = "false"
```

**Через системные настройки (постоянно):**
1. Откройте "Система" → "Дополнительные параметры системы"
2. Нажмите "Переменные среды"
3. Добавьте новую переменную:
   - Имя: `SQL_LOGGING`
   - Значение: `true` или `false`
4. Перезапустите Apache

#### 3. Использование в Apache

Добавьте в `httpd.conf` или `.htaccess`:

```apache
SetEnv SQL_LOGGING false
```

## Мониторинг размера лога

### Скрипт для автоматической очистки

Создайте файл `monitor_sql_log.ps1`:

```powershell
$logFile = "C:\web\sites\DataSources\api\sql.log"
$maxSizeMB = 100

if (Test-Path $logFile) {
    $sizeMB = (Get-Item $logFile).Length / 1MB
    
    if ($sizeMB -gt $maxSizeMB) {
        Write-Host "WARNING: SQL log size is $([math]::Round($sizeMB, 2)) MB"
        Write-Host "Clearing log file..."
        Clear-Content $logFile
        Write-Host "Log file cleared"
    } else {
        Write-Host "SQL log size: $([math]::Round($sizeMB, 2)) MB (OK)"
    }
} else {
    Write-Host "SQL log file does not exist"
}
```

### Запуск по расписанию

1. Откройте "Планировщик заданий Windows"
2. Создайте новую задачу
3. Настройте триггер (например, каждый день в 00:00)
4. Действие: "Запустить программу"
   - Программа: `powershell.exe`
   - Аргументы: `-File "C:\path\to\monitor_sql_log.ps1"`

## Примеры использования

### Пример 1: Отладка проблемы

```powershell
# 1. Включите логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging' => false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart

# 2. Воспроизведите проблему
# (выполните действия в браузере)

# 3. Проанализируйте лог
Get-Content "C:\web\sites\DataSources\api\sql.log" | Select-String "ERROR"

# 4. Отключите логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging' => true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

### Пример 2: Тестирование производительности

```powershell
# 1. Отключите логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging' => true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart

# 2. Очистите лог (если существует)
if (Test-Path "C:\web\sites\DataSources\api\sql.log") {
    Remove-Item "C:\web\sites\DataSources\api\sql.log"
}

# 3. Выполните тесты производительности
# (используйте JMeter, LoadRunner или другой инструмент)

# 4. Проверьте, что лог не создан
if (Test-Path "C:\web\sites\DataSources\api\sql.log") {
    Write-Host "ERROR: Log file was created despite being disabled"
} else {
    Write-Host "OK: Logging is disabled"
}
```

### Пример 3: Временное включение для отладки

```powershell
# Включить логирование на 1 час
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging' => false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart

# Ждем 1 час
Start-Sleep -Seconds 3600

# Отключить логирование
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging' => true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

## Лучшие практики

### 1. Используйте разные конфигурации для окружений

**development/config.php:**
```php
'sql_logging' => true,
```

**production/config.php:**
```php
'sql_logging' => false,
```

### 2. Включайте логирование только при необходимости

- Отладка проблем
- Анализ производительности
- Мониторинг новых функций

### 3. Регулярно очищайте логи

- Настройте автоматическую очистку
- Ограничьте размер лога
- Архивируйте старые логи

### 4. Не храните логи в продакшене

- Логи могут содержать чувствительные данные
- Они занимают место на диске
- Замедляют работу приложения

## Решение проблем

### Проблема: Логирование не отключается

**Решение:**
1. Проверьте, что файл `config.php` сохранен
2. Перезапустите Apache: `httpd -k restart`
3. Очистите кэш PHP (если используется OPcache)

### Проблема: Логирование не включается

**Решение:**
1. Проверьте синтаксис `config.php`:
   ```bash
   php -l C:\web\sites\DataSources\api\config.php
   ```
2. Проверьте права на запись в папку `api/`
3. Проверьте логи Apache на наличие ошибок

### Проблема: Лог растет слишком быстро

**Решение:**
1. Отключите логирование в продакшене
2. Настройте автоматическую очистку
3. Используйте ротацию логов

## Заключение

Управление логированием через конфигурацию позволяет:
- ✅ Легко включать/отключать логирование
- ✅ Не изменять код приложения
- ✅ Использовать разные настройки для разных окружений
- ✅ Быстро переключаться между режимами

Рекомендуется держать логирование отключенным в продакшене и включать только при необходимости отладки.
