# SQL Логирование

## Описание

Все SQL запросы в API логируются в файл `sql.log`, который находится рядом с `index.php` в папке `C:/web/sites/DataSources/api/`.

## Что логируется

### 1. Операции с докладами (reports)
- GET `/api/reports` - получение списка докладов
- GET `/api/reports/{id}` - получение конкретного доклада
- POST `/api/reports` - создание доклада
- PUT `/api/reports/{id}` - обновление доклада
- DELETE `/api/reports/{id}` - удаление доклада

### 2. Операции с разделами (sections)
- POST `/api/sections` - создание раздела
- PUT `/api/sections/{id}` - обновление раздела
- DELETE `/api/sections/{id}` - удаление раздела

### 3. Операции со справками (notes)
- POST `/api/notes` - создание справки
- PUT `/api/notes/{id}` - обновление справки
- DELETE `/api/notes/{id}` - удаление справки

### 4. Операции с блоками справок (note_blocks)
- POST `/api/noteBlocks` - создание блока
- PUT `/api/noteBlocks/{id}` - обновление блока
- DELETE `/api/noteBlocks/{id}` - удаление блока

### 5. Операции с показателями (indicators)
- POST `/api/indicators` - создание показателя
- PUT `/api/indicators/{id}` - обновление показателя
- DELETE `/api/indicators/{id}` - удаление показателя

### 6. Операции с разрезами (slices)
- POST `/api/slices` - создание разреза
- PUT `/api/slices/{id}` - обновление разреза
- DELETE `/api/slices/{id}` - удаление разреза

### 7. Операции с источниками (sources)
- POST `/api/sources` - создание источника
- PUT `/api/sources/{id}` - обновление источника
- DELETE `/api/sources/{id}` - удаление источника

### 8. Функции чтения данных
- `getSectionsForReport()` - получение разделов доклада
- `getNotesForSection()` - получение справок раздела
- `getIndicatorsForNote()` - получение показателей справки
- `getSlicesForIndicator()` - получение разрезов показателя
- `getSourcesForSlice()` - получение источников разреза
- `getSourcesForNote()` - получение источников справки

### 9. Импорт данных
- Очистка всех таблиц
- INSERT операции для всех уровней иерархии
- Особое внимание к `source_types` в таблицах `data_sources` и `note_sources`

## Формат лога

Каждая запись в логе имеет следующий формат:

```
[2026-09-17 15:30:45] SQL: SELECT * FROM reports WHERE id = ?
  Params: ["abc123"]
  Result: 1 rows
--------------------------------------------------------------------------------
```

### Поля лога:

1. **Временная метка** - дата и время выполнения запроса
2. **SQL** - текст SQL запроса
3. **Params** - параметры запроса (если есть)
4. **Result** - результат выполнения:
   - Для SELECT: количество возвращенных строк или данные
   - Для INSERT/UPDATE/DELETE: `{"success": true}`
   - При ошибке: текст ошибки

## Расположение файла лога

```
C:/web/sites/DataSources/api/sql.log
```

## Использование

### Просмотр лога в реальном времени

В Windows PowerShell:
```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait
```

В Windows CMD:
```cmd
type "C:\web\sites\DataSources\api\sql.log" | more
```

Или используйте любой текстовый редактор (Notepad++, VS Code и т.д.)

### Очистка лога

```powershell
Clear-Content "C:\web\sites\DataSources\api\sql.log"
```

Или просто удалите файл - он будет создан заново при следующем запросе.

### Анализ лога

#### Поиск ошибок
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "ERROR"
```

#### Поиск запросов к конкретной таблице
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "data_sources"
```

#### Поиск запросов с source_types
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "source_types"
```

## Примеры использования

### Пример 1: Отладка проблемы с source_types

1. Откройте лог:
```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait
```

2. В интерфейсе приложения:
   - Переключитесь в режим PostgreSQL
   - Создайте источник с типами ["Робот", "ПО"]
   - Нажмите "Сохранить"

3. В логе вы увидите:
```
[2026-09-17 15:30:45] SQL: INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)
  Params: ["abc123", "slice456", "Источник 1", "Описание", "[\"Робот\",\"ПО\"]", 0]
  Result: {"success": true}
--------------------------------------------------------------------------------
```

4. Проверьте, что `source_types` корректно закодирован в JSON

### Пример 2: Отладка импорта данных

1. Откройте лог
2. Выполните импорт данных
3. В логе вы увидите:
```
[2026-09-17 15:31:00] SQL: DELETE FROM data_sources
  Result: {"success": true}
--------------------------------------------------------------------------------
[2026-09-17 15:31:00] SQL: DELETE FROM data_slices
  Result: {"success": true}
--------------------------------------------------------------------------------
...
[2026-09-17 15:31:01] SQL: INSERT INTO reports (id, name, description) VALUES (?, ?, ?)
  Params: ["report1", "Доклад 1", "Описание"]
  Result: {"success": true}
--------------------------------------------------------------------------------
```

### Пример 3: Поиск медленных запросов

Если приложение работает медленно, проверьте лог на наличие:
- Запросов с большим количеством параметров
- Повторяющихся запросов
- Запросов без индексов (по полям, не имеющим индексов)

## Производительность

Логирование добавляет минимальные накладные расходы:
- Запись в файл происходит асинхронно
- Используется `LOCK_EX` для предотвращения конфликтов
- Файл лога автоматически создается при первой записи

**Рекомендации:**
- Регулярно очищайте лог (раз в день/неделю)
- Не храните лог более 100 MB
- Используйте ротацию логов для продакшена

## Решение проблем

### Проблема: Лог не создается

**Причина:** Нет прав на запись в папку `api/`

**Решение:**
```powershell
icacls "C:\web\sites\DataSources\api" /grant "Пользователь:(OI)(CI)F"
```

Или запустите Apache от имени администратора.

### Проблема: Лог растет слишком быстро

**Причина:** Много запросов к API

**Решение:**
1. Добавьте ротацию логов
2. Очищайте лог по расписанию
3. Логируйте только важные запросы

Пример скрипта очистки (Windows Task Scheduler):
```powershell
# Очистка лога, если размер > 50 MB
$logFile = "C:\web\sites\DataSources\api\sql.log"
if ((Get-Item $logFile).Length -gt 50MB) {
    Clear-Content $logFile
}
```

### Проблема: Лог содержит ошибки

**Причина:** Ошибки в SQL запросах

**Решение:**
1. Проверьте текст ошибки в логе
2. Проверьте структуру БД
3. Проверьте параметры запроса
4. Проверьте логи PHP в `C:/web/Apache24/logs/error.log`

## Мониторинг

### Автоматическая проверка размера лога

Создайте файл `check_log_size.ps1`:
```powershell
$logFile = "C:\web\sites\DataSources\api\sql.log"
$maxSize = 100MB

if (Test-Path $logFile) {
    $size = (Get-Item $logFile).Length
    if ($size -gt $maxSize) {
        Write-Host "WARNING: SQL log size is $([math]::Round($size/1MB, 2)) MB"
        # Можно добавить отправку email или другого уведомления
    }
}
```

Запускайте по расписанию через Windows Task Scheduler.

### Анализ частоты запросов

```powershell
# Подсчет запросов по типам
Get-Content "C:\web\sites\DataSources\api\sql.log" | 
    Select-String "SQL:" | 
    ForEach-Object { 
        if ($_ -match "SELECT") { "SELECT" }
        elseif ($_ -match "INSERT") { "INSERT" }
        elseif ($_ -match "UPDATE") { "UPDATE" }
        elseif ($_ -match "DELETE") { "DELETE" }
    } | 
    Group-Object | 
    Select-Object Name, Count
```

## Лучшие практики

1. **Включайте логирование только при необходимости**
   - Для продакшена можно отключить логирование всех запросов
   - Оставьте логирование только для ошибок

2. **Регулярно очищайте лог**
   - Настройте автоматическую очистку
   - Храните логи не более 7 дней

3. **Анализируйте логи**
   - Ищите повторяющиеся запросы
   - Оптимизируйте медленные запросы
   - Добавляйте индексы при необходимости

4. **Используйте ротацию логов**
   - Создавайте новый файл каждый день
   - Архивируйте старые логи
   - Удаляйте логи старше 30 дней

## Управление логированием

### Через конфигурацию (рекомендуется)

Откройте файл `backend/api/config.php` и измените параметр `sql_logging`:

```php
return [
    'database' => [
        // ... настройки БД
    ],
    'app' => [
        'debug' => false,
        'cors_origins' => ['*'],
        'sql_logging' => true, // ← true = включить, false = выключить
    ]
];
```

**Преимущества:**
- ✅ Не нужно изменять код
- ✅ Легко переключать между режимами
- ✅ Можно использовать разные настройки для dev/prod
- ✅ Мгновенное применение после перезапуска Apache

**Быстрое переключение:**

Включить:
```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

Выключить:
```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"
httpd -k restart
```

### Через код (альтернатива)

Закомментируйте вызовы `logSQL()` в `index.php`:
```php
// logSQL($sql, $params);
```

Или добавьте условие:
```php
if (getenv('SQL_LOG_ENABLED') === 'true') {
    logSQL($sql, $params);
}
```

## Заключение

SQL логирование - мощный инструмент для отладки и мониторинга работы приложения. Используйте его для:
- Отладки проблем с данными
- Поиска медленных запросов
- Мониторинга работы API
- Анализа ошибок

Файл лога находится в `C:/web/sites/DataSources/api/sql.log` и содержит полную информацию о всех SQL запросах.
