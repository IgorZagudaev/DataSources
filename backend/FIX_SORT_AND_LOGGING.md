# Исправление проблем с перемещением и логированием

## Исправленные проблемы

### 1. Перемещение новых элементов не работало

**Проблема:** При создании нового элемента (справки, показателя и т.д.) перемещение кнопками ↑↓ не работало. Элемент создавался в начале списка.

**Причина:** При создании записи не устанавливался `sort_order`. Все новые записи получали `sort_order = 0` или `NULL`, что приводило к конфликтам при перемещении.

**Решение:** Добавлена вспомогательная функция `getNextSortOrder()`, которая автоматически определяет следующий `sort_order` для нового элемента:

```php
function getNextSortOrder(PDO $db, string $table, string $parentField, string $parentId): int {
    $stmt = $db->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM $table WHERE $parentField = ?");
    $stmt->execute([$parentId]);
    return (int)$stmt->fetchColumn();
}
```

**Обновлённые обработчики POST:**
- `handleReports()` - для докладов
- `handleSections()` - для разделов
- `handleNotes()` - для справок
- `handleNoteSources()` - для источников в справках
- `handleNoteBlocks()` - для блоков справок
- `handleIndicators()` - для показателей
- `handleSlices()` - для разрезов
- `handleSources()` - для источников
- `handleNoteBlockIndicators()` - для показателей в блоках
- `handleNoteBlockSlices()` - для разрезов в блоках
- `handleNoteBlockSources()` - для источников в блоках

**Пример использования:**
```php
case 'POST':
    $newId = generateUUID();
    $nextOrder = getNextSortOrder($db, 'notes', 'section_id', $input['section_id']);
    $stmt = $db->prepare("INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$newId, $input['section_id'], $input['name'], $input['short_name'] ?? null, $input['description'] ?? null, $nextOrder]);
    logAction('add', 'note', $newId, $input['name']);
    echo json_encode(['id' => $newId]);
    break;
```

### 2. Добавлено время выполнения SQL запросов в лог

**Проблема:** В `sql.log` не отображалось время выполнения запросов, что затрудняло анализ производительности.

**Решение:** Обновлена функция `logSQL()` и создана обёртка `executeSQL()`:

```php
// Обновлённая функция logSQL
function logSQL($sql, $params = [], $result = null, $error = null, $executionTime = null) {
    // ... существующий код ...
    
    if ($executionTime !== null) {
        $logEntry .= "  Execution time: " . number_format($executionTime * 1000, 2) . " ms\n";
    }
    
    // ... остальной код ...
}

// Обёртка для выполнения запросов с замером времени
function executeSQL(PDO $db, string $sql, array $params = [], bool $fetchAll = false) {
    $startTime = microtime(true);
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $executionTime = microtime(true) - $startTime;
    
    if ($fetchAll) {
        $result = $stmt->fetchAll();
        logSQL($sql, $params, $result, null, $executionTime);
        return $result;
    } else {
        logSQL($sql, $params, ['success' => true], null, $executionTime);
        return $stmt;
    }
}
```

**Пример записи в sql.log:**
```
[2026-09-17 16:30:45] SQL: SELECT * FROM reports WHERE id = ?
  Params: ["abc123"]
  Execution time: 2.34 ms
  Result: 1 rows
--------------------------------------------------------------------------------
```

---

## Установка

### 1. Загрузите обновлённый файл на сервер

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

**Тест 1: Создание и перемещение новых элементов**
1. Создайте новую справку в разделе
2. Нажмите кнопку ↑ или ↓
3. Справка должна переместиться
4. Проверьте в БД:
   ```sql
   SELECT name, sort_order FROM notes WHERE section_id = '...' ORDER BY sort_order;
   ```

**Тест 2: Проверка времени выполнения в логах**
1. Выполните любое действие в приложении
2. Откройте `sql.log`:
   ```powershell
   Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 20
   ```
3. Должны появиться записи с `Execution time: X.XX ms`

---

## Проверка в базе данных

### Проверка sort_order для справок

```sql
SELECT 
    n.id,
    n.name,
    n.sort_order,
    s.name as section_name
FROM notes n
JOIN sections s ON n.section_id = s.id
ORDER BY s.name, n.sort_order;
```

### Проверка sort_order для всех таблиц

```sql
-- Разделы
SELECT 'sections' as table_name, COUNT(*) as count, 
       SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END) as null_count
FROM sections
UNION ALL
-- Справки
SELECT 'notes', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM notes
UNION ALL
-- Блоки справок
SELECT 'note_blocks', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM note_blocks
UNION ALL
-- Показатели
SELECT 'indicators', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM indicators
UNION ALL
-- Разрезы
SELECT 'data_slices', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM data_slices
UNION ALL
-- Источники
SELECT 'data_sources', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM data_sources;
```

Должно быть `null_count = 0` для всех таблиц.

### Исправление существующих данных

Если в существующих данных `sort_order` равен NULL или 0, выполните:

```sql
-- Исправить sort_order для справок
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) - 1 as new_order
    FROM notes
)
UPDATE notes
SET sort_order = numbered.new_order
FROM numbered
WHERE notes.id = numbered.id AND (notes.sort_order IS NULL OR notes.sort_order = 0);

-- Исправить sort_order для показателей
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY note_id ORDER BY created_at) - 1 as new_order
    FROM indicators
)
UPDATE indicators
SET sort_order = numbered.new_order
FROM numbered
WHERE indicators.id = numbered.id AND (indicators.sort_order IS NULL OR indicators.sort_order = 0);

-- Исправить sort_order для разрезов
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY indicator_id ORDER BY created_at) - 1 as new_order
    FROM data_slices
)
UPDATE data_slices
SET sort_order = numbered.new_order
FROM numbered
WHERE data_slices.id = numbered.id AND (data_slices.sort_order IS NULL OR data_slices.sort_order = 0);

-- Исправить sort_order для источников
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slice_id ORDER BY created_at) - 1 as new_order
    FROM data_sources
)
UPDATE data_sources
SET sort_order = numbered.new_order
FROM numbered
WHERE data_sources.id = numbered.id AND (data_sources.sort_order IS NULL OR data_sources.sort_order = 0);
```

---

## Анализ производительности

### Поиск медленных запросов

```powershell
# Найти запросы с временем выполнения > 100 мс
Get-Content "C:\web\sites\DataSources\api\sql.log" | 
    Select-String "Execution time:" | 
    ForEach-Object {
        if ($_ -match "Execution time: ([\d.]+) ms") {
            $time = [double]$matches[1]
            if ($time -gt 100) {
                $_
            }
        }
    }
```

### Статистика времени выполнения

```powershell
# Средняя, минимальная и максимальная время выполнения
$times = Get-Content "C:\web\sites\DataSources\api\sql.log" | 
    Select-String "Execution time:" | 
    ForEach-Object {
        if ($_ -match "Execution time: ([\d.]+) ms") {
            [double]$matches[1]
        }
    }

Write-Host "Среднее время: $([math]::Round(($times | Measure-Object -Average).Average, 2)) ms"
Write-Host "Минимальное время: $($times | Measure-Object -Minimum | Select-Object -ExpandProperty Minimum) ms"
Write-Host "Максимальное время: $($times | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum) ms"
```

### Оптимизация медленных запросов

Если обнаружены медленные запросы (> 100 мс):

1. **Проверьте индексы:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'reports';
   ```

2. **Добавьте индексы при необходимости:**
   ```sql
   CREATE INDEX idx_notes_section_id ON notes(section_id);
   CREATE INDEX idx_indicators_note_id ON indicators(note_id);
   CREATE INDEX idx_data_slices_indicator_id ON data_slices(indicator_id);
   CREATE INDEX idx_data_sources_slice_id ON data_sources(slice_id);
   ```

3. **Проанализируйте план запроса:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM notes WHERE section_id = '...';
   ```

---

## Решение проблем

### Проблема: Перемещение всё ещё не работает

**Решение:**
1. Проверьте, что загружен обновлённый `index.php`
2. Проверьте `sort_order` в БД:
   ```sql
   SELECT id, name, sort_order FROM notes ORDER BY sort_order;
   ```
3. Если `sort_order` равен NULL или 0, выполните SQL скрипт исправления (см. выше)
4. Перезапустите Apache

### Проблема: Время выполнения не отображается в логах

**Решение:**
1. Проверьте, что включено логирование в `config.php`:
   ```php
   'sql_logging' => true,
   ```
2. Проверьте права на запись в `sql.log`
3. Убедитесь, что загружен обновлённый `index.php`

### Проблема: Медленные запросы (> 1 сек)

**Решение:**
1. Проверьте индексы в БД
2. Проверьте нагрузку на сервер
3. Рассмотрите кэширование данных
4. Оптимизируйте структуру запросов

---

## Документация

- **Полная документация:** `backend/FIX_SORT_AND_LOGGING.md`
- **Предыдущие исправления:** `backend/FIX_THREE_ISSUES.md`

---

## Файлы для загрузки

```
backend/api/index.php → C:/web/sites/DataSources/api/
```

---

## Заключение

Исправлены две критические проблемы:

✅ **Перемещение новых элементов** - теперь работает корректно для всех типов элементов  
✅ **Время выполнения SQL** - добавлено в логи для анализа производительности  

Проект пересобран и готов к развёртыванию.
