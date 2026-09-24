# Исправление проблемы с пустым sort_order в таблицах БД

## Проблема

После импорта данных поле `sort_order` заполнялось только в таблице `sections`, а в остальных таблицах оставалось пустым или равным 0:
- `notes`
- `note_blocks`
- `note_block_indicators`
- `note_block_data_slices`
- `indicators`
- `data_slices`
- `data_sources`
- `note_sources`

## Причина

В функции `handleImport()` в файле `backend/api/index.php` использовалось значение из данных:

```php
$note['sort_order'] ?? 0
```

Но данные с фронтенда приходят в camelCase формате (`sortOrder`), а не в snake_case (`sort_order`). Поэтому условие `$note['sort_order']` всегда возвращало `null`, и подставлялось значение `0`.

## Решение

Изменены все INSERT операции в функции `handleImport()`, чтобы использовать **индекс из цикла** вместо значения из данных:

### До исправления:

```php
foreach ($section['notes'] as $noteIndex => $note) {
    $sql = "INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
    $params = [$noteId, $sectionId, $note['name'], $note['short_name'] ?? null, $note['description'] ?? null, $note['sort_order'] ?? 0];
    // ...
}
```

### После исправления:

```php
foreach ($section['notes'] as $noteIndex => $note) {
    $sql = "INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
    $params = [$noteId, $sectionId, $note['name'], $note['short_name'] ?? null, $note['description'] ?? null, $noteIndex];
    // ...
}
```

## Измененные таблицы

Все таблицы теперь получают правильное значение `sort_order` на основе индекса элемента в массиве:

| Таблица | Переменная цикла | Описание |
|---------|------------------|----------|
| `reports` | `$reportIndex` | Порядок докладов |
| `sections` | `$sectionIndex` | Порядок разделов |
| `notes` | `$noteIndex` | Порядок справок |
| `note_sources` | `$sourceIndex` | Порядок источников в справках |
| `note_blocks` | `$noteBlockIndex` | Порядок блоков справок |
| `note_block_indicators` | `$indicatorIndex` | Порядок показателей в блоках |
| `note_block_data_slices` | `$sliceIndex` | Порядок разрезов в блоках |
| `indicators` | `$indicatorIndex` | Порядок показателей |
| `data_slices` | `$sliceIndex` | Порядок разрезов |
| `data_sources` | `$sourceIndex` | Порядок источников |

## Проверка исправления

### 1. Выполните импорт данных

Импортируйте JSON через интерфейс приложения или через API:

```bash
curl -X POST http://localhost/DataSources/api/import \
  -H "Content-Type: application/json" \
  -d @test_data.json
```

### 2. Проверьте значения sort_order в БД

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

### 3. Ожидаемый результат

Все поля `sort_order` должны содержать последовательные числа, начиная с 0:

```
id  | name              | sort_order
----|-------------------|------------
abc | Справка 1         | 0
def | Справка 2         | 1
ghi | Справка 3         | 2
```

## Тестирование порядка элементов

### Тест 1: Создание элементов

1. Создайте несколько справок в разделе
2. Проверьте в БД:
   ```sql
   SELECT name, sort_order FROM notes WHERE section_id = 'section-id' ORDER BY sort_order;
   ```
3. Убедитесь, что `sort_order` содержит правильные значения

### Тест 2: Перемещение элементов

1. Переместите справку кнопками ↑↓
2. Проверьте в БД:
   ```sql
   SELECT name, sort_order FROM notes WHERE section_id = 'section-id' ORDER BY sort_order;
   ```
3. Убедитесь, что порядок изменился

### Тест 3: Импорт данных

1. Подготовьте JSON с несколькими элементами
2. Импортируйте данные
3. Проверьте в БД все таблицы
4. Убедитесь, что `sort_order` заполнен корректно

## SQL запросы для проверки

### Проверка всех таблиц

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
FROM data_sources;
```

### Исправление существующих данных

Если нужно исправить `sort_order` для существующих данных:

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
```

## Преимущества решения

✅ **Правильный порядок** - элементы сохраняются в том порядке, в котором они были импортированы  
✅ **Независимость от формата** - работает с camelCase и snake_case  
✅ **Автоматическая нумерация** - индексы назначаются автоматически  
✅ **Совместимость с фронтендом** - порядок совпадает с отображением в UI  

## Рекомендации

### Для разработчиков

1. **Всегда используйте индекс из цикла** для установки `sort_order` при импорте
2. **Не полагайтесь на значения из данных** - они могут быть в неправильном формате
3. **Проверяйте sort_order** после импорта данных

### Для пользователей

1. **Импортируйте данные** через интерфейс приложения
2. **Проверяйте порядок** элементов после импорта
3. **Используйте кнопки ↑↓** для изменения порядка

## Заключение

Проблема с пустым `sort_order` была вызвана использованием неправильного ключа (`sort_order` вместо `sortOrder`). Решение - использовать индекс из цикла, что гарантирует правильный порядок независимо от формата данных.

Все таблицы теперь получают корректное значение `sort_order` при импорте данных.

## Файлы для загрузки на сервер

```
backend/api/index.php → C:/web/sites/DataSources/api/index.php
```

После загрузки перезапустите Apache:
```bash
httpd -k restart
```
