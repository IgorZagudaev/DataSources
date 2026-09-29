# Откат бэкенда до состояния DISABLE_DEBUG_LOGS.md

## Что нужно откатить в бэкенде

### 1. Удалить логирование SQL запросов

**Файл:** `backend/api/index.php`

**Удалить:**
- Функцию `logSQL()`
- Все вызовы `logSQL()` в коде
- Функцию `executeSQL()` (если есть)

**Восстановить:**
- Простые SQL запросы без логирования

### 2. Удалить логирование действий пользователей

**Файл:** `backend/api/index.php`

**Удалить:**
- Подключение `require_once __DIR__ . '/action_logger.php';`
- Все вызовы `logAction()` в коде

**Файлы для удаления:**
- `backend/api/action_logger.php` - удалить файл
- `backend/api/sql.log` - удалить файл логов (если есть)
- `backend/api/actions.log` - удалить файл логов (если есть)

### 3. Удалить endpoint для hierarchy

**Файл:** `backend/api/index.php`

**Удалить:**
- Обработку `$action === 'hierarchy'`
- Функцию `handleGetHierarchy()`
- Все helper функции для загрузки отдельных элементов:
  - `getReport()`, `getReportWithChildren()`
  - `getSection()`, `getSectionWithChildren()`
  - `getNote()`, `getNoteWithChildren()`
  - `getNoteBlock()`, `getNoteBlockWithChildren()`
  - `getIndicator()`, `getIndicatorWithChildren()`
  - `getNoteBlockIndicator()`, `getNoteBlockIndicatorWithChildren()`
  - `getSlice()`, `getSliceWithChildren()`
  - `getNoteBlockSlice()`, `getNoteBlockSliceWithChildren()`
  - `getSource()`, `getNoteSource()`

### 4. Удалить endpoint для move операций

**Файл:** `backend/api/index.php`

**Удалить:**
- Обработку `$action === 'move'`
- Функцию `handleMove()`

### 5. Удалить endpoint для noteBlockIndicators, noteBlockSlices, noteBlockSources

**Файл:** `backend/api/index.php`

**Удалить:**
- Обработку `case 'noteBlockIndicators':`
- Обработку `case 'noteBlockSlices':`
- Обработку `case 'noteBlockSources':`
- Функции `handleNoteBlockIndicators()`, `handleNoteBlockSlices()`, `handleNoteBlockSources()`

### 6. Удалить логирование времени выполнения

**Файл:** `backend/api/index.php`

**Удалить:**
- Все `microtime(true)` вызовы
- Все `$startTime` и `$executionTime` переменные
- Логирование времени в `logSQL()`

### 7. Удалить отладочные логи

**Файл:** `backend/api/index.php`

**Удалить:**
- Все `error_log()` вызовы для отладки
- Все комментарии с отладочной информацией

### 8. Восстановить простые обработчики CRUD

**Файл:** `backend/api/index.php`

**Восстановить простые версии функций:**

```php
function handleReports(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM reports WHERE id = ?");
                $stmt->execute([$id]);
                $report = $stmt->fetch();
                if ($report) {
                    $report['sections'] = getSectionsForReport($db, $id);
                }
                echo json_encode($report ?: ['error' => 'Not found']);
            } else {
                $stmt = $db->query("SELECT * FROM reports ORDER BY created_at");
                $reports = $stmt->fetchAll();
                foreach ($reports as &$report) {
                    $report['sections'] = getSectionsForReport($db, $report['id']);
                }
                echo json_encode($reports);
            }
            break;
            
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO reports (id, name, description) VALUES (?, ?, ?)");
            $stmt->execute([$newId, $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId, 'name' => $input['name']]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE reports SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM reports WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}
```

## Пошаговая инструкция по откату

### Шаг 1: Создать резервную копию

```powershell
# Создать резервную копию текущей версии
Copy-Item -Path "C:\web\sites\DataSources\api" -Destination "C:\web\sites\DataSources\api_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
```

### Шаг 2: Удалить файлы логирования

```powershell
# Удалить файлы логирования
Remove-Item "C:\web\sites\DataSources\api\action_logger.php" -ErrorAction SilentlyContinue
Remove-Item "C:\web\sites\DataSources\api\sql.log" -ErrorAction SilentlyContinue
Remove-Item "C:\web\sites\DataSources\api\actions.log" -ErrorAction SilentlyContinue
Remove-Item "C:\web\sites\DataSources\api\diagnostic.php" -ErrorAction SilentlyContinue
```

### Шаг 3: Восстановить index.php из резервной копии

Если у вас есть резервная копия до всех изменений:

```powershell
# Восстановить из резервной копии
Copy-Item -Path "C:\path\to\backup\api\index.php" -Destination "C:\web\sites\DataSources\api\index.php" -Force
```

Если резервной копии нет, нужно вручную откатить изменения в `index.php`.

### Шаг 4: Откатить изменения в index.php вручную

Откройте файл `C:\web\sites\DataSources\api\index.php` и выполните следующие изменения:

#### 4.1. Удалить подключение action_logger.php

Найти и удалить строку:
```php
require_once __DIR__ . '/action_logger.php';
```

#### 4.2. Удалить функцию logSQL()

Найти и удалить всю функцию `logSQL()`:
```php
function logSQL($sql, $params = [], $result = null, $error = null, $executionTime = null) {
    // ... весь код функции ...
}
```

#### 4.3. Удалить все вызовы logSQL()

Найти все строки с `logSQL(` и удалить их.

Примеры:
```php
logSQL($sql, $params);
logSQL($sql, $params, $report);
logSQL($sql, [$id]);
```

#### 4.4. Удалить все вызовы logAction()

Найти все строки с `logAction(` и удалить их.

Примеры:
```php
logAction('add', 'report', $newId, $input['name']);
logAction('edit', 'report', $id, $input['name']);
logAction('delete', 'report', $id, $reportName);
```

#### 4.5. Удалить обработку move операций

Найти и удалить блок:
```php
if ($action === 'move' && $method === 'PUT') {
    $direction = $input['direction'] ?? 'up';
    handleMove($db, $resource, $id, $direction);
}
```

#### 4.6. Удалить обработку hierarchy операций

Найти и удалить блок:
```php
elseif ($action === 'hierarchy' && $method === 'GET') {
    handleGetHierarchy($db, $resource, $id);
}
```

#### 4.7. Удалить функцию handleMove()

Найти и удалить всю функцию `handleMove()`.

#### 4.8. Удалить функцию handleGetHierarchy()

Найти и удалить всю функцию `handleGetHierarchy()`.

#### 4.9. Удалить все helper функции для загрузки элементов

Найти и удалить все функции:
- `getReport()`, `getReportWithChildren()`
- `getSection()`, `getSectionWithChildren()`
- `getNote()`, `getNoteWithChildren()`
- `getNoteBlock()`, `getNoteBlockWithChildren()`
- `getIndicator()`, `getIndicatorWithChildren()`
- `getNoteBlockIndicator()`, `getNoteBlockIndicatorWithChildren()`
- `getSlice()`, `getSliceWithChildren()`
- `getNoteBlockSlice()`, `getNoteBlockSliceWithChildren()`
- `getSource()`, `getNoteSource()`

#### 4.10. Удалить обработку noteBlockIndicators, noteBlockSlices, noteBlockSources

Найти и удалить блоки:
```php
case 'noteBlockIndicators':
    handleNoteBlockIndicators($db, $method, $id, $input);
    break;
case 'noteBlockSlices':
    handleNoteBlockSlices($db, $method, $id, $input);
    break;
case 'noteBlockSources':
    handleNoteBlockSources($db, $method, $id, $input);
    break;
```

И удалить функции:
- `handleNoteBlockIndicators()`
- `handleNoteBlockSlices()`
- `handleNoteBlockSources()`

#### 4.11. Удалить логирование времени выполнения

Найти все строки с `microtime(true)` и удалить их:
```php
$startTime = microtime(true);
$executionTime = microtime(true) - $startTime;
```

#### 4.12. Удалить отладочные error_log()

Найти все строки с `error_log()` для отладки и удалить их.

Оставить только критические ошибки:
```php
error_log("Error in getSectionsForReport: " . $e->getMessage());
```

### Шаг 5: Проверить работу

1. Перезапустите Apache:
   ```bash
   httpd -k restart
   ```

2. Проверьте, что API работает:
   ```
   http://ваш_сервер/DataSources/api/reports
   ```

3. Проверьте, что нет ошибок в логах:
   ```powershell
   Get-Content "C:\web\Apache24\logs\error.log" -Tail 20
   ```

### Шаг 6: Очистить старые логи

```powershell
# Удалить старые логи
Remove-Item "C:\web\sites\DataSources\api\*.log" -ErrorAction SilentlyContinue
```

## Альтернатива: Использовать git для отката

Если у вас есть доступ к git, вы можете откатить изменения по метке:

```bash
# Перейти в директорию проекта
cd C:\path\to\project

# Посмотреть список меток
git tag

# Откатить бэкенд к состоянию метки
git checkout DISABLE_DEBUG_LOGS -- backend/api/

# Закоммитить изменения
git add backend/api/
git commit -m "Rollback backend to DISABLE_DEBUG_LOGS state"

# Загрузить файлы на сервер
scp -r backend/api/* user@server:/web/sites/DataSources/api/
```

## Проверка после отката

### Тест 1: API работает

```powershell
# Проверить endpoint
Invoke-WebRequest -Uri "http://ваш_сервер/DataSources/api/reports" -Method GET
```

**Ожидаемый результат:** JSON с данными из БД

### Тест 2: Нет лишних файлов

```powershell
# Проверить, что файлы логирования удалены
Test-Path "C:\web\sites\DataSources\api\action_logger.php"  # Должно быть False
Test-Path "C:\web\sites\DataSources\api\sql.log"            # Должно быть False
Test-Path "C:\web\sites\DataSources\api\actions.log"        # Должно быть False
```

### Тест 3: Нет лишних endpoints

```powershell
# Проверить, что hierarchy endpoint не работает
Invoke-WebRequest -Uri "http://ваш_сервер/DataSources/api/reports/abc123/hierarchy" -Method GET
```

**Ожидаемый результат:** 404 Not Found

### Тест 4: CRUD операции работают

1. Создайте доклад через API
2. Отредактируйте доклад
3. Удалите доклад
4. Проверьте, что все операции работают

## Документация

- **Документ отката фронтенда:** `backend/ROLLBACK_TO_DISABLE_DEBUG_LOGS.md`
- **Документ отката бэкенда:** `backend/ROLLBACK_BACKEND.md` (этот файл)
- **Исходное состояние:** `backend/DISABLE_DEBUG_LOGS.md`

## Заключение

Откат бэкенда требует ручного удаления всех изменений, связанных с:
- Логированием SQL запросов
- Логированием действий пользователей
- Частичной загрузкой данных (hierarchy)
- Move операциями
- Обработчиками для noteBlockIndicators, noteBlockSlices, noteBlockSources

Если у вас есть доступ к git, используйте его для отката по метке. Если нет, выполните ручную откатизацию по инструкции выше.

---

**Дата:** 2026-09-17  
**Статус:** 📋 Инструкция готова  
**Требуется:** Ручное выполнение или доступ к git
