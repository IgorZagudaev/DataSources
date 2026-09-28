# Отображение IP-адреса пользователя и логирование действий

## Описание функциональности

Система теперь отображает IP-адрес пользователя в футере приложения и логирует все действия пользователей (добавление, редактирование, удаление) в файл `actions.log`.

## Компоненты системы

### 1. Отображение IP-адреса в футере

**Файл:** `backend/api/user-info.php`

Эндпоинт возвращает информацию о пользователе:
- IP-адрес (с учётом прокси через `X-Forwarded-For`)
- Временную метку

**Фронтенд:** `src/App.tsx`

При загрузке приложения (в режиме API) выполняется запрос к `/DataSources/api/user-info.php` и IP отображается в футере.

### 2. Логирование действий пользователей

**Файл:** `backend/api/action_logger.php`

Функция `logAction()` записывает действия в файл `actions.log`:

```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Доклад 1
[2026-09-17 16:31:12] IP: 10.64.8.68 | Действие: Редактирование | Тип: section | ID: def456 | Имя: Раздел 1
[2026-09-17 16:32:01] IP: 10.64.8.68 | Действие: Удаление | Тип: note | ID: ghi789 | Имя: Справка 1
```

**Формат лога:**
- `[дата-время]` - временная метка действия
- `IP: xxx.xxx.xxx.xxx` - IP-адрес пользователя
- `Действие: Добавление/Редактирование/Удаление` - тип действия
- `Тип: report/section/note/noteBlock/indicator/slice/source` - тип сущности
- `ID: xxx` - уникальный идентификатор сущности
- `Имя: xxx` - название сущности

## Логирование по типам сущностей

### Доклады (reports)
- **Добавление:** `logAction('add', 'report', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'report', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'report', $id, $reportName)`

### Разделы (sections)
- **Добавление:** `logAction('add', 'section', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'section', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'section', $id, $sectionName)`

### Справки (notes)
- **Добавление:** `logAction('add', 'note', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'note', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'note', $id, $noteName)`

### Блоки справок (note_blocks)
- **Добавление:** `logAction('add', 'noteBlock', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'noteBlock', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'noteBlock', $id, $blockName)`

### Показатели (indicators)
- **Добавление:** `logAction('add', 'indicator', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'indicator', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'indicator', $id, $indicatorName)`

### Разрезы (data_slices)
- **Добавление:** `logAction('add', 'slice', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'slice', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'slice', $id, $sliceName)`

### Источники (data_sources)
- **Добавление:** `logAction('add', 'source', $newId, $input['name'])`
- **Редактирование:** `logAction('edit', 'source', $id, $input['name'])`
- **Удаление:** `logAction('delete', 'source', $id, $sourceName)`

## Установка и настройка

### 1. Загрузите файлы на сервер

```
backend/api/user-info.php → C:/web/sites/DataSources/api/user-info.php
backend/api/action_logger.php → C:/web/sites/DataSources/api/action_logger.php
backend/api/index.php → C:/web/sites/DataSources/api/index.php (обновлённый)
backend/.htaccess → C:/web/sites/DataSources/.htaccess (обновлённый)
dist/* → C:/web/sites/DataSources/
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

1. Откройте приложение в браузере
2. В футере должен появиться IP-адрес
3. Выполните любое действие (добавление/редактирование/удаление)
4. Проверьте файл `C:/web/sites/DataSources/api/actions.log`

## Просмотр логов действий

### В реальном времени (PowerShell)

```powershell
Get-Content "C:\web\sites\DataSources\api\actions.log" -Wait
```

### Поиск по IP-адресу

```powershell
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "10.64.8.68"
```

### Поиск по типу действия

```powershell
# Все действия добавления
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Действие: Добавление"

# Все действия удаления
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Действие: Удаление"
```

### Поиск по типу сущности

```powershell
# Все действия с докладами
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Тип: report"

# Все действия с источниками
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Тип: source"
```

### Статистика действий

```powershell
# Подсчёт действий по типу
Get-Content "C:\web\sites\DataSources\api\actions.log" | 
  Select-String "Действие:" | 
  ForEach-Object { 
    if ($_ -match "Действие: (\w+)") { $matches[1] }
  } | 
  Group-Object | 
  Select-Object Name, Count
```

## Определение IP-адреса

Система определяет IP-адрес в следующем порядке приоритета:

1. **HTTP_X_FORWARDED_FOR** - если приложение за прокси/балансировщиком
2. **HTTP_X_REAL_IP** - альтернативный заголовок прокси
3. **HTTP_CLIENT_IP** - ещё один вариант прокси
4. **REMOTE_ADDR** - прямой IP-адрес клиента

Это обеспечивает корректное определение IP даже при использовании прокси-серверов.

## Безопасность и приватность

### Что логируется

- ✅ IP-адрес пользователя
- ✅ Время действия
- ✅ Тип действия (добавление/редактирование/удаление)
- ✅ Тип сущности (доклад/раздел/справка и т.д.)
- ✅ ID сущности
- ✅ Название сущности

### Что НЕ логируется

- ❌ Пароли и учётные данные
- ❌ Полные данные сущностей (только ID и имя)
- ❌ Персональная информация (кроме IP)

### Рекомендации

1. **Ограничьте доступ к логам** - файл `actions.log` должен быть доступен только администраторам
2. **Регулярно очищайте логи** - настройте ротацию логов
3. **Мониторьте размер файла** - логи могут расти быстро при активной работе

## Примеры использования

### Пример 1: Аудит действий пользователя

```powershell
# Найти все действия пользователя с IP 10.64.8.68
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "10.64.8.68"
```

### Пример 2: Отслеживание удалений

```powershell
# Найти все удалённые элементы за сегодня
Get-Content "C:\web\sites\DataSources\api\actions.log" | 
  Select-String "Действие: Удаление" |
  Where-Object { $_ -match "^\[(\d{4}-\d{2}-\d{2})" -and $matches[1] -eq (Get-Date -Format "yyyy-MM-dd") }
```

### Пример 3: Статистика по типам сущностей

```powershell
# Подсчёт действий по типам сущностей
Get-Content "C:\web\sites\DataSources\api\actions.log" | 
  Select-String "Тип:" | 
  ForEach-Object { 
    if ($_ -match "Тип: (\w+)") { $matches[1] }
  } | 
  Group-Object | 
  Sort-Object Count -Descending |
  Select-Object Name, Count
```

## Решение проблем

### Проблема: IP не отображается в футере

**Решение:**
1. Проверьте, что файл `user-info.php` загружен на сервер
2. Проверьте доступность: `http://сервер/DataSources/api/user-info.php`
3. Проверьте консоль браузера (F12) на наличие ошибок
4. Убедитесь, что включён режим PostgreSQL

### Проблема: Логи не записываются

**Решение:**
1. Проверьте права на запись в папку `C:/web/sites/DataSources/api/`
2. Проверьте, что файл `action_logger.php` загружен
3. Проверьте, что `index.php` подключает `action_logger.php`
4. Проверьте логи Apache на наличие ошибок PHP

### Проблема: IP отображается как "unknown"

**Решение:**
1. Проверьте настройки Apache (mod_remoteip)
2. Проверьте, что прокси передаёт правильные заголовки
3. Проверьте файл `user-info.php` на корректность определения IP

## Автоматическая очистка логов

Создайте скрипт `cleanup_logs.ps1`:

```powershell
$logFile = "C:\web\sites\DataSources\api\actions.log"
$maxSizeMB = 100
$daysToKeep = 30

# Очистка по размеру
if (Test-Path $logFile) {
    $sizeMB = (Get-Item $logFile).Length / 1MB
    if ($sizeMB -gt $maxSizeMB) {
        # Архивируем старый лог
        $archiveName = "actions_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        Move-Item $logFile "C:\web\sites\DataSources\api\logs\$archiveName"
        Write-Host "Log archived: $archiveName"
    }
}

# Удаление старых архивов
$cutoffDate = (Get-Date).AddDays(-$daysToKeep)
Get-ChildItem "C:\web\sites\DataSources\api\logs\*.log" | 
  Where-Object { $_.LastWriteTime -lt $cutoffDate } |
  Remove-Item
```

Настройте выполнение через Планировщик заданий Windows.

## Заключение

Система теперь предоставляет:
- ✅ Отображение IP-адреса пользователя в футере
- ✅ Полное логирование всех действий пользователей
- ✅ Удобный формат логов для анализа
- ✅ Поддержку прокси-серверов
- ✅ Простые инструменты для поиска и анализа логов

Все логи сохраняются в файле `C:/web/sites/DataSources/api/actions.log` и могут быть использованы для аудита, отладки и мониторинга активности пользователей.
