# Краткая инструкция: Исправление перемещения и логирования

## Исправленные проблемы

✅ **1. Перемещение новых элементов** - теперь работает корректно  
✅ **2. Время выполнения SQL** - добавлено в логи

---

## Что изменилось

### 1. Автоматический sort_order при создании

Добавлена функция `getNextSortOrder()`:
```php
function getNextSortOrder(PDO $db, string $table, string $parentField, string $parentId): int {
    $stmt = $db->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM $table WHERE $parentField = ?");
    $stmt->execute([$parentId]);
    return (int)$stmt->fetchColumn();
}
```

Все POST операции теперь автоматически устанавливают `sort_order`:
```php
$nextOrder = getNextSortOrder($db, 'notes', 'section_id', $input['section_id']);
$stmt = $db->prepare("INSERT INTO notes (..., sort_order) VALUES (?, ..., ?)");
$stmt->execute([..., $nextOrder]);
```

### 2. Время выполнения в логах

Обновлена функция `logSQL()`:
```php
function logSQL($sql, $params = [], $result = null, $error = null, $executionTime = null) {
    // ...
    if ($executionTime !== null) {
        $logEntry .= "  Execution time: " . number_format($executionTime * 1000, 2) . " ms\n";
    }
    // ...
}
```

---

## Установка

### 1. Загрузите файл на сервер

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

---

## Проверка

### Тест 1: Перемещение новых элементов

1. Создайте новую справку
2. Нажмите кнопку ↑ или ↓
3. Справка должна переместиться
4. Проверьте в БД:
   ```sql
   SELECT name, sort_order FROM notes ORDER BY sort_order;
   ```

### Тест 2: Время выполнения в логах

1. Выполните любое действие
2. Откройте `sql.log`:
   ```powershell
   Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 20
   ```
3. Должны появиться записи с `Execution time: X.XX ms`

---

## Исправление существующих данных

Если в существующих данных `sort_order` равен NULL или 0:

```sql
-- Исправить для справок
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) - 1 as new_order
    FROM notes
)
UPDATE notes SET sort_order = numbered.new_order
FROM numbered WHERE notes.id = numbered.id;

-- Исправить для показателей
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY note_id ORDER BY created_at) - 1 as new_order
    FROM indicators
)
UPDATE indicators SET sort_order = numbered.new_order
FROM numbered WHERE indicators.id = numbered.id;

-- Исправить для разрезов
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY indicator_id ORDER BY created_at) - 1 as new_order
    FROM data_slices
)
UPDATE data_slices SET sort_order = numbered.new_order
FROM numbered WHERE data_slices.id = numbered.id;

-- Исправить для источников
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slice_id ORDER BY created_at) - 1 as new_order
    FROM data_sources
)
UPDATE data_sources SET sort_order = numbered.new_order
FROM numbered WHERE data_sources.id = numbered.id;
```

---

## Анализ производительности

### Поиск медленных запросов

```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" | 
    Select-String "Execution time:" | 
    ForEach-Object {
        if ($_ -match "Execution time: ([\d.]+) ms") {
            $time = [double]$matches[1]
            if ($time -gt 100) { $_ }
        }
    }
```

### Статистика

```powershell
$times = Get-Content "C:\web\sites\DataSources\api\sql.log" | 
    Select-String "Execution time:" | 
    ForEach-Object {
        if ($_ -match "Execution time: ([\d.]+) ms") { [double]$matches[1] }
    }

Write-Host "Среднее: $([math]::Round(($times | Measure-Object -Average).Average, 2)) ms"
Write-Host "Мин: $($times | Measure-Object -Minimum | Select-Object -ExpandProperty Minimum) ms"
Write-Host "Макс: $($times | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum) ms"
```

---

## Файлы для загрузки

```
backend/api/index.php → C:/web/sites/DataSources/api/
```

---

## Документация

Полная документация: `backend/FIX_SORT_AND_LOGGING.md`

---

Проект пересобран и готов к развёртыванию.
