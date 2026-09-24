# Краткое руководство по сохранению порядка элементов

## Где хранится порядок в БД

Порядок элементов хранится в поле **`sort_order`** для каждой таблицы:

| Таблица | Поле | Описание |
|---------|------|----------|
| `reports` | `sort_order` | Порядок докладов |
| `sections` | `sort_order` | Порядок разделов |
| `notes` | `sort_order` | Порядок справок |
| `note_blocks` | `sort_order` | Порядок блоков справок |
| `indicators` | `sort_order` | Порядок показателей |
| `data_slices` | `sort_order` | Порядок разрезов |
| `data_sources` | `sort_order` | Порядок источников |
| `note_sources` | `sort_order` | Порядок источников в справках |
| `note_block_indicators` | `sort_order` | Порядок показателей в блоках |
| `note_block_data_slices` | `sort_order` | Порядок разрезов в блоках |

При чтении данных используется сортировка:
```sql
SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order
```

## Проблема

Функции перемещения на фронтенде меняют порядок в массиве, но **не обновляют поле `sortOrder`**. При синхронизации с БД порядок не сохраняется.

## Обновленные функции

✅ **Обновлены и работают корректно:**
- `moveReportUp/Down` - перемещение докладов
- `moveSectionUp/Down` - перемещение разделов
- `moveNoteUp/Down` - перемещение справок
- `moveNoteBlockUp/Down` - перемещение блоков справок

⚠️ **Требуют обновления:**
- `moveNoteBlockIndicatorUp/Down`
- `moveNoteBlockSliceUp/Down`
- `moveNoteBlockSourceUp/Down`
- `moveIndicatorUp/Down`
- `moveSliceUp/Down`
- `moveSourceUp/Down`
- `moveNoteSourceUp/Down`

## Временные решения

### Решение 1: Ручное сохранение через редактирование

После перемещения элементов:
1. Откройте редактирование любого элемента того же уровня
2. Нажмите "Сохранить" без изменений
3. Это вызовет `syncToAPI()` и сохранит новый порядок

### Решение 2: Экспорт/Импорт

1. Экспортируйте данные в JSON
2. В JSON порядок уже правильный
3. Импортируйте с чекбоксом "Объединять доклады"

### Решение 3: SQL запрос

Вручную обновите `sort_order` в БД:

```sql
-- Обновить порядок разделов
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 as new_order
  FROM sections
  WHERE report_id = 'report-id'
)
UPDATE sections
SET sort_order = numbered.new_order
FROM numbered
WHERE sections.id = numbered.id;
```

## Проверка порядка в БД

```sql
-- Проверить порядок разделов
SELECT name, sort_order 
FROM sections 
WHERE report_id = 'report-id'
ORDER BY sort_order;

-- Проверить порядок справок
SELECT name, sort_order 
FROM notes 
WHERE section_id = 'section-id'
ORDER BY sort_order;
```

## Как это работает

### При создании элемента
```typescript
const section: Section = { 
  id: generateId(), 
  name, 
  sortOrder: 0,  // <-- Начальное значение
  ...
};
```

### При перемещении (обновленная функция)
```typescript
export function moveSectionUp(reportId: string, sectionId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      const index = r.sections.findIndex(s => s.id === sectionId);
      if (index > 0) {
        const newSections = [...r.sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        // Обновляем sortOrder для всех разделов
        const sectionsWithOrder = newSections.map((section, idx) => ({
          ...section,
          sortOrder: idx  // <-- Обновление порядка
        }));
        return { ...r, sections: sectionsWithOrder };
      }
    }
    return r;
  });
  notify();
}
```

### При синхронизации с БД
```typescript
// convertToSnakeCase() преобразует:
sortOrder → sort_order
```

## Тестирование

### Проверка сохранения порядка

1. Создайте 3 раздела: "Раздел 1", "Раздел 2", "Раздел 3"
2. Переместите "Раздел 3" на первое место кнопкой ↑
3. Обновите страницу (F5)
4. Проверьте, что порядок сохранился: "Раздел 3", "Раздел 1", "Раздел 2"

### Проверка в БД

```sql
SELECT name, sort_order 
FROM sections 
WHERE report_id = 'report-id'
ORDER BY sort_order;
```

Ожидаемый результат:
```
name      | sort_order
----------|------------
Раздел 3  | 0
Раздел 1  | 1
Раздел 2  | 2
```

## Рекомендации

### Для разработчиков

1. **Обновите все функции перемещения** по паттерну:
```typescript
const itemsWithOrder = newItems.map((item, idx) => ({ 
  ...item, 
  sortOrder: idx 
}));
```

2. **Добавьте тесты** для проверки сохранения порядка

3. **Используйте временные решения** пока все функции не обновлены

### Для пользователей

1. **Используйте кнопки ↑↓** для перемещения элементов
2. **После перемещения** откройте редактирование любого элемента и нажмите "Сохранить"
3. **Или используйте экспорт/импорт** для гарантированного сохранения порядка

## Примеры использования

### Пример 1: Перемещение разделов

```typescript
// Переместить раздел вверх
moveSectionUp('report-1', 'section-2');

// Проверить порядок
const report = reports.find(r => r.id === 'report-1');
console.log(report.sections.map(s => s.name));
// ["Раздел 2", "Раздел 1", "Раздел 3"]

// Проверить sortOrder
console.log(report.sections.map(s => ({ name: s.name, sortOrder: s.sortOrder })));
// [
//   { name: "Раздел 2", sortOrder: 0 },
//   { name: "Раздел 1", sortOrder: 1 },
//   { name: "Раздел 3", sortOrder: 2 }
// ]
```

### Пример 2: SQL запрос для проверки

```sql
-- Получить все разделы с порядком
SELECT 
  r.name as report_name,
  s.name as section_name,
  s.sort_order
FROM reports r
JOIN sections s ON r.id = s.report_id
ORDER BY r.name, s.sort_order;
```

## Заключение

Порядок элементов в БД хранится в поле `sort_order`. Функции перемещения должны обновлять это поле после каждого перемещения. Пока все функции не обновлены, используйте временные решения: ручное сохранение через редактирование или экспорт/импорт.

Подробная документация: `FIX_SORT_ORDER_ISSUE.md`
