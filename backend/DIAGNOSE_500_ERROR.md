# Диагностика ошибки 500 Internal Server Error

## Проблема

При запросе к `/api/reports` возвращается ошибка 500 Internal Server Error.

## Что было исправлено

1. **Убрана буферизация вывода** - `ob_start()` и `ob_end_clean()` могли вызывать проблемы
2. **Включено отображение ошибок** - `ini_set('display_errors', 1)` для диагностики
3. **Удалён блок `finally`** с `ob_end_clean()`

## Установка

### 1. Загрузите обновлённый index.php

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/reports
```

Теперь вы должны увидеть либо:
- ✅ JSON с данными
- ❌ Текст ошибки PHP (что поможет диагностировать проблему)

## Диагностика

### Шаг 1: Проверьте простой тест

Загрузите файл `backend/api/test_simple.php` на сервер:

```powershell
copy backend\api\test_simple.php C:\web\sites\DataSources\api\
```

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/test_simple.php
```

**Если работает** - проблема в основном `index.php`  
**Если не работает** - проблема в подключении к БД

### Шаг 2: Проверьте логи Apache

```powershell
Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
```

Ищите строки с:
- `PHP Fatal error`
- `PHP Parse error`
- `PHP Warning`
- `Exception in API`

### Шаг 3: Проверьте синтаксис PHP

```bash
php -l C:\web\sites\DataSources\api\index.php
```

Должно вывести: `No syntax errors detected`

### Шаг 4: Проверьте подключение к БД

Создайте файл `test_db.php`:

```php
<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once 'Database.php';
    $db = Database::getConnection();
    echo "OK: Database connected\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM reports");
    $count = $stmt->fetchColumn();
    echo "OK: Reports count = $count\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
```

Загрузите и откройте:
```
http://ваш_сервер/DataSources/api/test_db.php
```

## Возможные причины ошибки 500

### 1. Синтаксическая ошибка PHP

**Симптом:** В логах видно `PHP Parse error`

**Решение:** Проверьте синтаксис:
```bash
php -l C:\web\sites\DataSources\api\index.php
```

### 2. Ошибка подключения к БД

**Симптом:** В логах видно `Database connection failed`

**Решение:** Проверьте `config.php`:
```php
'database' => [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'report_data_sources',
    'user' => 'postgres',
    'password' => 'your_password',
]
```

### 3. Отсутствие таблицы в БД

**Симптом:** В логах видно `relation "reports" does not exist`

**Решение:** Выполните SQL скрипт:
```bash
psql -U postgres -d report_data_sources -f backend/database/init.sql
```

### 4. Ошибка в функции sendJsonResponse

**Симптом:** В логах видно `Call to undefined function sendJsonResponse`

**Решение:** Убедитесь, что функция определена в начале файла `index.php`

### 5. Проблема с правами доступа

**Симптом:** В логах видно `Permission denied`

**Решение:**
```powershell
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)R"
```

## Временное решение

Если проблема не решается, используйте упрощённую версию `index.php`:

1. Загрузите `test_simple.php` как `index.php`
2. Проверьте, что базовый запрос работает
3. Постепенно добавляйте функции из оригинального `index.php`

## Проверка после исправления

### Тест 1: Простой запрос

```
http://ваш_сервер/DataSources/api/test_simple.php
```

Должен вернуть JSON с данными.

### Тест 2: Основной API

```
http://ваш_сервер/DataSources/api/reports
```

Должен вернуть JSON с данными.

### Тест 3: Приложение

1. Откройте приложение
2. Откройте консоль браузера (F12)
3. Проверьте, что нет ошибок 500
4. Данные должны загрузиться

## Логи для проверки

- **Apache error log:** `C:\web\Apache24\logs\error.log`
- **PHP error log:** `C:\web\Apache24\logs\php_errors.log` (если настроен)
- **SQL log:** `C:\web\sites\DataSources\api\sql.log`
- **Actions log:** `C:\web\sites\DataSources\api\actions.log`

## Файлы для загрузки

```
backend/api/index.php → C:\web\sites\DataSources\api\
backend/api/test_simple.php → C:\web\sites\DataSources\api\
```

---

**Дата:** 2026-09-17  
**Статус:** 🔧 Диагностика  
**Приоритет:** Критический
