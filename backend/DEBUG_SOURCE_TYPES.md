# Отладка проблемы с сохранением source_types при редактировании

## Проблема

При редактировании источника с типами (sourceTypes) данные не сохраняются в PostgreSQL. При импорте типы сохраняются корректно, но при редактировании через интерфейс - нет.

## Диагностика

### Шаг 1: Проверка логов PHP

Откройте лог-файл Apache:
```
C:/web/Apache24/logs/error.log
```

Ищите записи вида:
```
Updating source ID: xxx
Input data: {...}
Source types to save: [...]
Importing source: xxx, source_types: [...]
```

### Шаг 2: Проверка конвертации данных

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверка конвертации camelCase → snake_case
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

console.log('sourceTypes →', camelToSnake('sourceTypes')); // должно быть: source_types
console.log('noteBlocks →', camelToSnake('noteBlocks')); // должно быть: note_blocks
```

### Шаг 3: Проверка данных перед отправкой

В консоли браузера добавьте временный лог в функцию syncToAPI:

```javascript
// В store.ts, функция syncToAPI, добавьте:
console.log('Data to send:', JSON.stringify(reportsToSend, null, 2));
```

Проверьте, что в отправляемых данных есть поле `source_types` (не `sourceTypes`).

## Возможные причины

### Причина 1: Неправильная конвертация camelCase → snake_case

**Симптом:** В логах PHP видно `source_types: null` или поле отсутствует.

**Решение:** Проверьте функцию `camelToSnake` в `src/store.ts`:
```typescript
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
```

### Причина 2: PHP не получает source_types

**Симптом:** В логах PHP `Input data` не содержит `source_types`.

**Решение:** Проверьте, что фронтенд отправляет данные в правильном формате. Добавьте логирование в `src/api.ts`:
```typescript
export async function importAllReports(reports: any[]) {
  console.log('Sending to API:', JSON.stringify(reports, null, 2));
  return apiRequest('/import', 'POST', { reports });
}
```

### Причина 3: PHP не сохраняет source_types

**Симптом:** В логах PHP `Source types to save` содержит данные, но в БД поле пустое.

**Решение:** Проверьте структуру таблицы `data_sources`:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'data_sources';
```

Поле `source_types` должно быть типа `TEXT`.

### Причина 4: Ошибка при сохранении

**Симптом:** В логах PHP есть ошибки SQL.

**Решение:** Проверьте логи PHP на наличие ошибок:
```
SQLSTATE[...]: ...
```

## Тестирование

### Тест 1: Создание нового источника с типами

1. Переключитесь в режим PostgreSQL
2. Создайте новый источник с типами
3. Проверьте логи PHP
4. Обновите страницу (F5)
5. Проверьте, что типы сохранились

### Тест 2: Редактирование источника с типами

1. Выберите существующий источник с типами
2. Нажмите кнопку редактирования
3. Измените типы источников
4. Нажмите "Сохранить"
5. Проверьте логи PHP
6. Обновите страницу (F5)
7. Проверьте, что типы обновились

### Тест 3: Импорт с типами

1. Подготовьте JSON с источниками и типами:
```json
{
  "reports": [{
    "name": "Тест",
    "sections": [{
      "name": "Раздел",
      "notes": [{
        "name": "Справка",
        "indicators": [{
          "name": "Показатель",
          "slices": [{
            "name": "Разрез",
            "sources": [{
              "name": "Источник",
              "sourceTypes": ["Робот", "ПО"]
            }]
          }]
        }]
      }]
    }]
  }]
}
```

2. Импортируйте данные
3. Проверьте, что типы сохранились

## Ожидаемые логи PHP

### При успешном редактировании:

```
Updating source ID: abc123
Input data: {"name":"Источник","description":"Описание","source_types":["Робот","ПО"]}
Source types to save: ["Робот","ПО"]
```

### При успешном импорте:

```
Importing source: Источник, source_types: ["Робот","ПО"]
```

## Решение проблемы

### Если source_types не конвертируется

Проверьте, что в `src/store.ts` функция `convertToSnakeCase` правильно обрабатывает массивы:

```typescript
function convertToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = convertToSnakeCase(obj[key]);
    }
    return result;
  }
  return obj;
}
```

### Если PHP не получает данные

Проверьте, что в `src/api.ts` функция `importAllReports` отправляет данные правильно:

```typescript
export async function importAllReports(reports: any[]) {
  console.log('Sending reports:', reports);
  return apiRequest('/import', 'POST', { reports });
}
```

### Если PHP не сохраняет данные

Проверьте SQL запрос в `backend/api/index.php`:

```php
$sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
$stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$sourceId, $sliceId, $source['name'], $source['description'] ?? null, $sourceTypes, $source['sort_order'] ?? 0]);
```

## Дополнительные проверки

### Проверка структуры БД

```sql
-- Проверка таблицы data_sources
\d data_sources

-- Проверка наличия поля source_types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'data_sources' AND column_name = 'source_types';
```

### Проверка данных в БД

```sql
-- Проверка сохраненных source_types
SELECT id, name, source_types
FROM data_sources
WHERE source_types IS NOT NULL
LIMIT 10;
```

### Проверка JSON в source_types

```sql
-- Декодирование JSON
SELECT id, name, source_types::json
FROM data_sources
WHERE source_types IS NOT NULL
LIMIT 10;
```

## Временное решение

Если проблема не решается, можно временно использовать прямое обновление через SQL:

```sql
UPDATE data_sources
SET source_types = '["Робот","ПО"]'::text
WHERE id = 'xxx';
```

Но это не рекомендуется для продакшена.

## Контакты для поддержки

Если проблема не решается, предоставьте:

1. Логи PHP из `C:/web/Apache24/logs/error.log`
2. Скриншот консоли браузера с ошибками
3. Пример JSON данных, которые отправляются на сервер
4. Результат SQL запроса:
   ```sql
   SELECT * FROM data_sources WHERE id = 'xxx';
   ```

## Обновления

### Версия 1.0 (2026-09-17)
- Добавлено логирование в PHP для отладки source_types
- Добавлена валидация обязательных полей в handleSources
- Создана инструкция по отладке

### Следующие шаги
- [ ] Добавить автоматические тесты для проверки конвертации
- [ ] Добавить валидацию на фронтенде перед отправкой
- [ ] Добавить индикатор статуса синхронизации в UI
