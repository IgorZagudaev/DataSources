# Краткая инструкция по SQL логированию

## Что добавлено

Все SQL запросы теперь логируются в файл `sql.log` рядом с `index.php`.

## Расположение лога

```
C:/web/sites/DataSources/api/sql.log
```

## Как использовать

### 1. Загрузите обновленные файлы на сервер

```
dist/* → C:/web/sites/DataSources/
backend/api/index.php → C:/web/sites/DataSources/api/index.php
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Просмотр лога в реальном времени

Откройте PowerShell и выполните:

```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait
```

Или откройте файл `sql.log` в любом текстовом редакторе (Notepad++, VS Code).

### 4. Тестирование

1. Откройте сайт в браузере
2. Переключитесь в режим PostgreSQL
3. Выполните любое действие (создание, редактирование, удаление)
4. Проверьте лог - вы должны увидеть SQL запросы

## Пример записи в логе

```
[2026-09-17 15:30:45] SQL: INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)
  Params: ["abc123", "slice456", "Источник 1", "Описание", "[\"Робот\",\"ПО\"]", 0]
  Result: {"success": true}
--------------------------------------------------------------------------------
```

## Что логируется

✅ Все SELECT запросы (чтение данных)  
✅ Все INSERT запросы (создание данных)  
✅ Все UPDATE запросы (обновление данных)  
✅ Все DELETE запросы (удаление данных)  
✅ Очистка таблиц при импорте  
✅ Параметры запросов  
✅ Результаты выполнения  
✅ Ошибки SQL  

## Полезные команды

### Поиск ошибок в логе
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "ERROR"
```

### Поиск запросов к таблице data_sources
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "data_sources"
```

### Поиск запросов с source_types
```powershell
Select-String -Path "C:\web\sites\DataSources\api\sql.log" -Pattern "source_types"
```

### Очистка лога
```powershell
Clear-Content "C:\web\sites\DataSources\api\sql.log"
```

### Проверка размера лога
```powershell
(Get-Item "C:\web\sites\DataSources\api\sql.log").Length / 1MB
```

## Отладка проблемы с source_types

1. Откройте лог в реальном времени:
```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait
```

2. В интерфейсе приложения:
   - Создайте источник с типами ["Робот", "ПО"]
   - Нажмите "Сохранить"

3. В логе проверьте:
```
SQL: INSERT INTO data_sources ... source_types ...
Params: [..., "[\"Робот\",\"ПО\"]", ...]
```

Если `source_types` корректно закодирован в JSON, значит проблема решена.

## Рекомендации

- **Регулярно очищайте лог** - он может быстро расти
- **Не храните лог более 100 MB** - это замедлит работу
- **Используйте лог для отладки** - отключите в продакшене
- **Анализируйте ошибки** - они помогут найти проблемы

## Подробная документация

См. файл `backend/SQL_LOGGING.md` для полной документации.

## Решение проблем

### Лог не создается
Проверьте права на запись в папку `C:/web/sites/DataSources/api/`

### Лог растет слишком быстро
Настройте автоматическую очистку или отключите логирование в `config.php`:
```php
'sql_logging' => false,
```

### Ошибки в логе
Проверьте структуру БД и параметры запросов

## Включение/выключение логирования

### Способ 1: Через конфигурацию (рекомендуется)

Откройте файл `C:/web/sites/DataSources/api/config.php` и измените параметр:

```php
'app' => [
    'debug' => false,
    'cors_origins' => ['*'],
    'sql_logging' => true,  // true = включить, false = выключить
]
```

После изменения перезапустите Apache:
```bash
httpd -k restart
```

**Быстрые команды:**

Включить:
```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*false", "'sql_logging' => true" | Set-Content "C:\web\sites\DataSources\api\config.php"; httpd -k restart
```

Выключить:
```powershell
(Get-Content "C:\web\sites\DataSources\api\config.php") -replace "'sql_logging'\s*=>\s*true", "'sql_logging' => false" | Set-Content "C:\web\sites\DataSources\api\config.php"; httpd -k restart
```

### Способ 2: Через переменные окружения

Установите переменную окружения `SQL_LOGGING`:
```powershell
$env:SQL_LOGGING = "true"   # включить
$env:SQL_LOGGING = "false"  # выключить
```

Перезапустите Apache:
```bash
httpd -k restart
```

### Проверка статуса

```powershell
Select-String -Path "C:\web\sites\DataSources\api\config.php" -Pattern "sql_logging"
```
