# Исправление проблем с сохранением данных в PostgreSQL

## Проблемы

1. **Изменения в БД не сохраняются** - при редактировании данных в режиме PostgreSQL изменения не синхронизировались с базой данных
2. **Сбросилось поле short_name** - у всех справок потерялось значение поля "Краткое название"

## Причины

### Проблема 1: Неполное преобразование camelCase ↔ snake_case

**Фронтенд (TypeScript):**
- Функция `convertToSnakeCase()` преобразовывала только `sourceTypes` → `source_types`
- Остальные поля (`noteBlocks`, `shortName`, `noteBlockIndicators` и т.д.) оставались в camelCase
- PHP API ожидал данные в snake_case формате

**Бэкенд (PHP):**
- Функция `getNotesForSection()` возвращала данные с camelCase ключами (`noteBlocks`, `indicators`, `sources`)
- Данные из БД приходили в snake_case (`note_blocks`, `short_name`)
- Фронтенд не мог корректно обработать смешанный формат

### Проблема 2: Потеря данных при синхронизации

При синхронизации данных с сервером:
1. Фронтенд отправлял данные в camelCase формате
2. PHP API не находил поля `note_blocks`, `short_name` и другие
3. Эти поля сохранялись как NULL или пустые значения
4. При обратной загрузке данные терялись

## Решения

### 1. Полное преобразование camelCase ↔ snake_case

**Файл:** `src/store.ts`

Добавлены универсальные функции преобразования:

```typescript
// Преобразование camelCase в snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

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

// Преобразование snake_case в camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function convertToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = convertToCamelCase(obj[key]);
    }
    return result;
  }
  return obj;
}
```

**Преобразуемые поля:**
- `shortName` ↔ `short_name`
- `noteBlocks` ↔ `note_blocks`
- `noteBlockIndicators` ↔ `note_block_indicators`
- `sourceTypes` ↔ `source_types`
- `reportId` ↔ `report_id`
- `sectionId` ↔ `section_id`
- `noteId` ↔ `note_id`
- `indicatorId` ↔ `indicator_id`
- `sliceId` ↔ `slice_id`
- `sortOrder` ↔ `sort_order`
- `createdAt` ↔ `created_at`
- `updatedAt` ↔ `updated_at`

### 2. Исправление PHP API

**Файл:** `backend/api/index.php`

#### Изменение 1: Поддержка обоих форматов при импорте

```php
// Note blocks (поддержка обоих форматов: noteBlocks и note_blocks)
$noteBlocks = $note['noteBlocks'] ?? $note['note_blocks'] ?? [];
if (is_array($noteBlocks) && !empty($noteBlocks)) {
    foreach ($noteBlocks as $noteBlock) {
        // ...
    }
}
```

#### Изменение 2: Возврат данных в snake_case формате

```php
function getNotesForSection(PDO $db, string $sectionId): array {
    // ...
    foreach ($notes as &$note) {
        // Используем snake_case для совместимости с фронтендом
        $note['note_blocks'] = getNoteBlocksForNote($db, $note['id']);
        $note['indicators'] = getIndicatorsForNote($db, $note['id']);
        $note['sources'] = getSourcesForNote($db, $note['id']);
    }
    return $notes;
}
```

### 3. Исправление функции convertToSnakeCase

**Было:**
```typescript
function convertToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Преобразуем только sourceTypes
      const snakeKey = key === 'sourceTypes' ? 'source_types' : key;
      result[snakeKey] = convertToSnakeCase(obj[key]);
    }
    return result;
  }
  return obj;
}
```

**Стало:**
```typescript
function convertToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Преобразуем все camelCase ключи в snake_case
      const snakeKey = camelToSnake(key);
      result[snakeKey] = convertToSnakeCase(obj[key]);
    }
    return result;
  }
  return obj;
}
```

## Тестирование

### Проверка сохранения данных

1. Переключитесь в режим PostgreSQL
2. Создайте новую справку с кратким названием
3. Добавьте типы источников
4. Обновите страницу (F5)
5. Проверьте, что все данные сохранились:
   - Название справки
   - Краткое название (short_name)
   - Типы источников (source_types)
   - Блоки справки (note_blocks)

### Проверка синхронизации

1. Откройте консоль браузера (F12)
2. Переключитесь в режим PostgreSQL
3. Выполните любое действие (добавление, редактирование, удаление)
4. Проверьте логи:
   ```
   Syncing data to API...
   Sync to API completed
   ```
5. Проверьте в БД, что данные обновились

### Проверка преобразования

В консоли браузера выполните:

```javascript
// Проверка camelToSnake
console.log(camelToSnake('shortName')); // должно вывести: short_name
console.log(camelToSnake('noteBlocks')); // должно вывести: note_blocks

// Проверка snakeToCamel
console.log(snakeToCamel('short_name')); // должно вывести: shortName
console.log(snakeToCamel('note_blocks')); // должно вывести: noteBlocks
```

## Восстановление потерянных данных

Если поле `short_name` было потеряно, его можно восстановить:

### Вариант 1: Через интерфейс

1. Переключитесь в режим PostgreSQL
2. Для каждой справки:
   - Нажмите кнопку редактирования (✎)
   - Введите краткое название
   - Нажмите "Сохранить"

### Вариант 2: Через SQL

```sql
-- Пример обновления short_name для конкретных справок
UPDATE notes 
SET short_name = 'Краткое название' 
WHERE id = 'note-id';
```

### Вариант 3: Через экспорт/импорт

1. Экспортируйте данные в JSON
2. Отредактируйте JSON, добавив `shortName` для нужных справок
3. Импортируйте данные с включенным чекбоксом "Объединять доклады с одинаковыми названиями"

## Профилактика

### Рекомендации для разработчиков

1. **Всегда используйте snake_case в БД и API**
   - PostgreSQL: `short_name`, `note_blocks`, `source_types`
   - PHP API: возвращайте данные в snake_case
   - TypeScript: преобразуйте в camelCase для внутреннего использования

2. **Тестируйте преобразование данных**
   - Проверяйте, что все поля корректно преобразуются
   - Используйте логирование для отладки

3. **Добавляйте валидацию**
   - Проверяйте наличие обязательных полей
   - Логируйте предупреждения о пропущенных данных

### Автоматические тесты

```typescript
// Тест преобразования camelCase → snake_case
test('convertToSnakeCase', () => {
  const input = {
    shortName: 'Test',
    noteBlocks: [{ id: '1' }],
    sourceTypes: ['Робот']
  };
  
  const expected = {
    short_name: 'Test',
    note_blocks: [{ id: '1' }],
    source_types: ['Робот']
  };
  
  expect(convertToSnakeCase(input)).toEqual(expected);
});

// Тест преобразования snake_case → camelCase
test('convertToCamelCase', () => {
  const input = {
    short_name: 'Test',
    note_blocks: [{ id: '1' }],
    source_types: ['Робот']
  };
  
  const expected = {
    shortName: 'Test',
    noteBlocks: [{ id: '1' }],
    sourceTypes: ['Робот']
  };
  
  expect(convertToCamelCase(input)).toEqual(expected);
});
```

## Измененные файлы

1. **src/store.ts**
   - Добавлены функции `camelToSnake()` и `snakeToCamel()`
   - Обновлены `convertToSnakeCase()` и `convertToCamelCase()`
   - Исправлена синхронизация данных с API

2. **backend/api/index.php**
   - Исправлена функция `getNotesForSection()` - возврат в snake_case
   - Добавлена поддержка обоих форматов в `handleImport()`
   - Исправлена обработка `noteBlocks` / `note_blocks`

3. **src/components/DetailPanel.tsx**
   - Добавлена проверка `Array.isArray()` для `sourceTypes`
   - Исправлена ошибка `TypeError: p.sourceTypes.join is not a function`

## Заключение

Проблемы были вызваны неполным преобразованием между camelCase (TypeScript) и snake_case (PostgreSQL/PHP). После исправления:

✅ Все данные корректно сохраняются в БД  
✅ Поле `short_name` больше не теряется  
✅ Блоки справки корректно синхронизируются  
✅ Типы источников сохраняются и отображаются  
✅ Полная совместимость между фронтендом и бэкендом

## Дополнительные рекомендации

1. **Мониторинг синхронизации**
   - Добавьте индикатор статуса синхронизации в UI
   - Показывайте ошибки синхронизации пользователю

2. **Резервное копирование**
   - Регулярно экспортируйте данные в JSON
   - Храните резервные копии на случай потери данных

3. **Валидация данных**
   - Добавьте проверку обязательных полей на фронтенде
   - Валидируйте данные на бэкенде перед сохранением

4. **Логирование**
   - Логируйте все операции синхронизации
   - Отслеживайте ошибки преобразования данных
