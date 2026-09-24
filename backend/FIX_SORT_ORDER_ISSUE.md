# Проблема с сохранением порядка элементов

## Описание проблемы

Порядок элементов в базе данных хранится в поле **`sort_order`** для каждой таблицы:
- `reports.sort_order` - порядок докладов
- `sections.sort_order` - порядок разделов
- `notes.sort_order` - порядок справок
- `note_blocks.sort_order` - порядок блоков справок
- `indicators.sort_order` - порядок показателей
- `data_slices.sort_order` - порядок разрезов
- `data_sources.sort_order` - порядок источников

При чтении данных из БД используется сортировка:
```sql
SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order
```

## Проблема

Функции перемещения на фронтенде (`moveSectionUp/Down`, `moveNoteUp/Down` и т.д.) **меняют порядок элементов в массиве**, но **не обновляют поле `sortOrder`** в объектах.

Когда данные синхронизируются с БД через `syncToAPI()`, поле `sort_order` остается прежним (обычно 0), поэтому порядок не сохраняется.

## Решение

### Обновленные функции

Все функции перемещения должны обновлять поле `sortOrder` для всех элементов после перемещения.

**Пример для разделов:**

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
          sortOrder: idx
        }));
        return { ...r, sections: sectionsWithOrder };
      }
    }
    return r;
  });
  notify();
}
```

### Обновленные функции

✅ `moveReportUp/Down` - обновлено  
✅ `moveSectionUp/Down` - обновлено  
✅ `moveNoteUp/Down` - обновлено  

⚠️ **Требуют обновления:**
- `moveNoteBlockUp/Down`
- `moveNoteBlockIndicatorUp/Down`
- `moveNoteBlockSliceUp/Down`
- `moveNoteBlockSourceUp/Down`
- `moveIndicatorUp/Down`
- `moveSliceUp/Down`
- `moveSourceUp/Down`
- `moveNoteSourceUp/Down`

## Временное решение

Пока все функции не обновлены, можно использовать следующий подход:

### Вариант 1: Ручное обновление sortOrder

После перемещения элементов вручную обновите sortOrder через редактирование:

1. Переместите элемент кнопками ↑↓
2. Откройте редактирование каждого элемента того же уровня
3. Просто нажмите "Сохранить" без изменений
4. Это вызовет `syncToAPI()` и сохранит новый порядок

### Вариант 2: Экспорт/Импорт

1. Экспортируйте данные в JSON
2. В JSON порядке элементов уже правильный (массив отсортирован)
3. Импортируйте данные обратно с включенным чекбоксом "Объединять доклады"
4. При импорте sortOrder устанавливается автоматически

### Вариант 3: SQL запрос

Можно вручную обновить sortOrder в БД:

```sql
-- Обновить sortOrder для разделов конкретного доклада
UPDATE sections
SET sort_order = subquery.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 as new_order
  FROM sections
  WHERE report_id = 'report-id'
) as subquery
WHERE sections.id = subquery.id;
```

## Проверка порядка в БД

Выполните SQL запрос для проверки текущего порядка:

```sql
-- Проверить порядок разделов
SELECT id, name, sort_order 
FROM sections 
WHERE report_id = 'report-id'
ORDER BY sort_order;

-- Проверить порядок справок
SELECT id, name, sort_order 
FROM notes 
WHERE section_id = 'section-id'
ORDER BY sort_order;
```

## Как это работает

### При создании элемента

Когда создается новый элемент, ему присваивается `sortOrder = 0`:

```typescript
const section: Section = { 
  id: generateId(), 
  name, 
  description, 
  reportId, 
  sortOrder: 0,  // <-- Здесь
  notes: [] 
};
```

### При импорте данных

При импорте sortOrder устанавливается на основе позиции в массиве:

```typescript
const sectionsWithOrder = newSections.map((section, idx) => ({
  ...section,
  sortOrder: idx  // <-- Здесь
}));
```

### При синхронизации с БД

Функция `convertToSnakeCase()` преобразует `sortOrder` в `sort_order`:

```typescript
sortOrder → sort_order
```

Затем данные отправляются в БД через `/api/import`.

## Автоматическое обновление всех функций

Для автоматического обновления всех функций перемещения можно использовать следующий паттерн:

```typescript
// Вспомогательная функция для обновления sortOrder
function updateSortOrder<T extends { id: string }>(items: T[]): T[] {
  return items.map((item, idx) => ({ ...item, sortOrder: idx }));
}

// Использование в функции перемещения
export function moveXxxUp(...) {
  // ... код перемещения ...
  const newItems = [...items];
  [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
  
  // Обновляем sortOrder
  const itemsWithOrder = updateSortOrder(newItems);
  
  return { ...parent, items: itemsWithOrder };
}
```

## Тестирование

### Проверка сохранения порядка

1. Создайте несколько разделов в докладе
2. Переместите их кнопками ↑↓
3. Обновите страницу (F5)
4. Проверьте, что порядок сохранился

### Проверка в БД

```sql
SELECT name, sort_order 
FROM sections 
WHERE report_id = 'report-id'
ORDER BY sort_order;
```

Результат должен показывать правильный порядок.

## Рекомендации

1. **Обновите все функции перемещения** - добавьте обновление sortOrder
2. **Добавьте тесты** - проверьте сохранение порядка после перемещения
3. **Используйте временные решения** - пока не все функции обновлены
4. **Проверяйте sortOrder в БД** - убедитесь, что порядок сохраняется

## Заключение

Проблема с сохранением порядка элементов вызвана тем, что функции перемещения не обновляют поле `sortOrder`. Решение - обновить все функции перемещения, чтобы они пересчитывали sortOrder после каждого перемещения.

Временные решения позволяют работать с системой, пока все функции не будут обновлены.
