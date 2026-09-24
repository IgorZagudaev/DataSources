# Краткая инструкция по исправлению sort_order

## Проблема

Поле `sort_order` заполнялось только в таблице `sections`, в остальных таблицах оставалось пустым или равным 0.

## Причина

Код использовал `$note['sort_order']`, но данные приходили в формате `sortOrder` (camelCase), поэтому значение всегда было `null`.

## Решение

Изменены все INSERT операции в функции `handleImport()` - теперь используется индекс из цикла вместо значения из данных.

## Что исправлено

Все таблицы теперь получают правильное значение `sort_order`:

- ✅ `reports` - порядок докладов
- ✅ `sections` - порядок разделов
- ✅ `notes` - порядок справок
- ✅ `note_sources` - порядок источников в справках
- ✅ `note_blocks` - порядок блоков справок
- ✅ `note_block_indicators` - порядок показателей в блоках
- ✅ `note_block_data_slices` - порядок разрезов в блоках
- ✅ `indicators` - порядок показателей
- ✅ `data_slices` - порядок разрезов
- ✅ `data_sources` - порядок источников

## Применение исправления

### 1. Загрузите обновленный файл на сервер

```bash
# Скопируйте файл
copy backend\api\index.php C:\web\sites\DataSources\api\index.php
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Переимпортируйте данные

Импортируйте данные заново через интерфейс приложения или через API:

```bash
curl -X POST http://localhost/DataSources/api/import \
  -H "Content-Type: application/json" \
  -d @your_data.json
```

### 4. Проверьте результат

```sql
-- Проверить notes
SELECT id, name, sort_order 
FROM notes 
ORDER BY sort_order;

-- Проверить indicators
SELECT id, name, sort_order 
FROM indicators 
ORDER BY sort_order;

-- Проверить data_slices
SELECT id, name, sort_order 
FROM data_slices 
ORDER BY sort_order;

-- Проверить data_sources
SELECT id, name, sort_order 
FROM data_sources 
ORDER BY sort_order;
```

Все поля `sort_order` должны содержать последовательные числа, начиная с 0.

## Исправление существующих данных

Если нужно исправить `sort_order` для уже существующих данных без переимпорта:

```sql
-- Исправить notes
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) - 1 as new_order
  FROM notes
)
UPDATE notes
SET sort_order = numbered.new_order
FROM numbered
WHERE notes.id = numbered.id;

-- Исправить indicators
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY note_id ORDER BY created_at) - 1 as new_order
  FROM indicators
)
UPDATE indicators
SET sort_order = numbered.new_order
FROM numbered
WHERE indicators.id = numbered.id;

-- Исправить data_slices
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY indicator_id ORDER BY created_at) - 1 as new_order
  FROM data_slices
)
UPDATE data_slices
SET sort_order = numbered.new_order
FROM numbered
WHERE data_slices.id = numbered.id;

-- Исправить data_sources
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slice_id ORDER BY created_at) - 1 as new_order
  FROM data_sources
)
UPDATE data_sources
SET sort_order = numbered.new_order
FROM numbered
WHERE data_sources.id = numbered.id;

-- Исправить note_blocks
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY note_id ORDER BY created_at) - 1 as new_order
  FROM note_blocks
)
UPDATE note_blocks
SET sort_order = numbered.new_order
FROM numbered
WHERE note_blocks.id = numbered.id;

-- Исправить note_block_indicators
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY note_block_id ORDER BY created_at) - 1 as new_order
  FROM note_block_indicators
)
UPDATE note_block_indicators
SET sort_order = numbered.new_order
FROM numbered
WHERE note_block_indicators.id = numbered.id;

-- Исправить note_block_data_slices
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY indicator_id ORDER BY created_at) - 1 as new_order
  FROM note_block_data_slices
)
UPDATE note_block_data_slices
SET sort_order = numbered.new_order
FROM numbered
WHERE note_block_data_slices.id = numbered.id;

-- Исправить note_sources
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY note_id ORDER BY created_at) - 1 as new_order
  FROM note_sources
)
UPDATE note_sources
SET sort_order = numbered.new_order
FROM numbered
WHERE note_sources.id = numbered.id;
```

## Проверка всех таблиц

```sql
-- Проверить все таблицы на наличие sort_order
SELECT 'notes' as table_name, COUNT(*) as count, 
       SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END) as null_count
FROM notes
UNION ALL
SELECT 'note_blocks', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM note_blocks
UNION ALL
SELECT 'indicators', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM indicators
UNION ALL
SELECT 'data_slices', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM data_slices
UNION ALL
SELECT 'data_sources', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM data_sources
UNION ALL
SELECT 'note_sources', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM note_sources
UNION ALL
SELECT 'note_block_indicators', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM note_block_indicators
UNION ALL
SELECT 'note_block_data_slices', COUNT(*), SUM(CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END)
FROM note_block_data_slices;
```

Результат должен показать `null_count = 0` для всех таблиц.

## Файлы для загрузки

```
backend/api/index.php → C:/web/sites/DataSources/api/index.php
```

## Документация

Полная документация: `FIX_SORT_ORDER_IN_IMPORT.md`
