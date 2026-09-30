# Диагностика проблемы с загрузкой данных

## Проблема

В консоли браузера появляется ошибка:
```
Error loading from API: SyntaxError: Unexpected token '<', "<br /><b>"... is not valid JSON
```

Это означает, что PHP возвращает HTML с ошибкой вместо JSON.

## Причина

Возможные причины:
1. **Неправильное значение `default_mode`** в `config.php` на сервере
2. **Синтаксическая ошибка PHP** в одном из файлов
3. **Ошибка подключения к базе данных**
4. **Проблема с правами доступа**

## Диагностика

### Шаг 1: Проверьте конфиг на сервере

Откройте файл `C:\web\sites\DataSources\api\config.php` и проверьте значение `default_mode`:

**Правильно:**
```php
'default_mode' => 'api', // или 'local'
```

**Неправильно:**
```php
'default_mode' => 'PostgreSQL', // ❌ ОШИБКА! Должно быть 'api'
```

**Исправьте на:**
```php
'default_mode' => 'api',
```

### Шаг 2: Запустите диагностический скрипт

Загрузите файл `backend/api/diagnose.php` на сервер:
```powershell
copy backend\api\diagnose.php C:\web\sites\DataSources\api\
```

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/diagnose.php
```

**Ожидаемый результат:**
```json
{
  "status": "ok",
  "config_loaded": true,
  "database_connected": true,
  "reports_count": 5,
  "default_mode": "api",
  "admin_ips": ["127.0.0.1", "::1", "10.64.8.68"],
  "your_ip": "10.64.8.68"
}
```

**Если есть ошибка:**
```json
{
  "status": "error",
  "message": "Описание ошибки",
  "file": "путь к файлу",
  "line": номер строки
}
```

### Шаг 3: Проверьте логи PHP

Откройте логи Apache:
```powershell
Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
```

Ищите ошибки PHP:
- `PHP Fatal error`
- `PHP Parse error`
- `PHP Warning`

### Шаг 4: Проверьте права доступа

Убедитесь, что у пользователя Apache/IIS есть права на чтение файлов:
```powershell
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)R"
```

## Решение

### Решение 1: Исправьте `default_mode` в config.php

Откройте `C:\web\sites\DataSources\api\config.php`:

```php
'app' => [
    'debug' => false,
    'cors_origins' => ['*'],
    'sql_logging' => true,
    'default_mode' => 'api', // ← ИСПРАВЬТЕ ЗДЕСЬ! Должно быть 'api', не 'PostgreSQL'
    
    'admin_ips' => [
        '127.0.0.1',
        '::1',
        '10.64.8.68',
    ],
]
```

### Решение 2: Очистите localStorage в браузере

Откройте консоль браузера (F12) и выполните:
```javascript
localStorage.clear();
location.reload();
```

### Решение 3: Проверьте все файлы на синтаксические ошибки

```bash
# Проверьте config.php
php -l C:\web\sites\DataSources\api\config.php

# Проверьте index.php
php -l C:\web\sites\DataSources\api\index.php

# Проверьте access_control.php
php -l C:\web\sites\DataSources\api\access_control.php

# Проверьте action_logger.php
php -l C:\web\sites\DataSources\api\action_logger.php
```

### Решение 4: Перезагрузите все файлы

```powershell
# Backend
copy backend\api\config.php C:\web\sites\DataSources\api\
copy backend\api\index.php C:\web\sites\DataSources\api\
copy backend\api\access_control.php C:\web\sites\DataSources\api\
copy backend\api\action_logger.php C:\web\sites\DataSources\api\
copy backend\api\diagnose.php C:\web\sites\DataSources\api\

# Frontend
xcopy /E /Y dist\* C:\web\sites\DataSources\

# Перезапустите Apache
httpd -k restart
```

## Проверка после исправления

### 1. Проверьте диагностический скрипт

```
http://ваш_сервер/DataSources/api/diagnose.php
```

Должен вернуть:
```json
{
  "status": "ok",
  "config_loaded": true,
  "database_connected": true,
  "reports_count": X,
  "default_mode": "api",
  ...
}
```

### 2. Проверьте права доступа

```
http://ваш_сервер/DataSources/api/permissions.php
```

Должен вернуть:
```json
{
  "is_admin": true,
  "ip": "10.64.8.68",
  "can_edit": true,
  ...
}
```

### 3. Проверьте загрузку данных

```
http://ваш_сервер/DataSources/api/reports
```

Должен вернуть JSON с данными:
```json
[
  {
    "id": "...",
    "name": "...",
    "sections": [...]
  }
]
```

### 4. Проверьте приложение

1. Откройте приложение
2. Откройте консоль браузера (F12)
3. Проверьте, что нет ошибок
4. Данные должны загрузиться корректно

## Часто задаваемые вопросы

### Q: Почему в логах видно `default_mode: 'PostgreSQL'`?

A: Потому что в `config.php` на сервере написано `'PostgreSQL'` вместо `'api'`. Это неправильное значение. Должно быть `'api'` или `'local'`.

### Q: Почему появляется HTML ошибка вместо JSON?

A: Потому что PHP возвращает ошибку как HTML. Это может быть из-за:
- Синтаксической ошибки PHP
- Неправильного значения в конфиге
- Ошибки подключения к БД

### Q: Как проверить, что проблема в конфиге?

A: Запустите диагностический скрипт `diagnose.php`. Если он возвращает ошибку, значит проблема в PHP файлах. Если он работает, но приложение не работает, значит проблема в значении `default_mode`.

## Файлы для загрузки

```
backend\api\config.php → C:\web\sites\DataSources\api\
backend\api\index.php → C:\web\sites\DataSources\api\
backend\api\diagnose.php → C:\web\sites\DataSources\api\
```

---

**Дата:** 2026-09-17  
**Статус:** 🔧 Диагностика  
**Требуется:** Проверка `default_mode` в `config.php`
