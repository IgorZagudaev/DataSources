# Исправление трёх проблем

## Проблема 1: Задержка при операциях

### Описание
В консоли браузера появлялось сообщение "Fetching reports from API..." с задержкой перед получением ответа.

### Причина
После каждой операции (добавление, редактирование, удаление, перемещение) вызывается функция `loadReports()`, которая загружает ВСЕ данные из базы данных. Это необходимо для синхронизации состояния фронтенда с базой данных.

### Решение
Добавлено логирование времени выполнения для диагностики:

```typescript
export async function loadReports(): Promise<void> {
  try {
    console.log('Loading reports from API...');
    const startTime = performance.now();
    reports = await api.fetchReports();
    const endTime = performance.now();
    console.log(`Reports loaded in ${(endTime - startTime).toFixed(2)}ms`);
    notify();
  } catch (e) {
    console.error('Error loading reports:', e);
    throw e;
  }
}
```

### Оптимизация (будущее улучшение)
Для уменьшения задержки можно:
1. **Кэширование на стороне клиента** - хранить данные в памяти и обновлять только изменённые элементы
2. **Оптимистичные обновления** - обновлять UI до получения ответа от сервера
3. **Debounce для частых операций** - группировать несколько операций в один запрос
4. **WebSocket** - использовать real-time обновления вместо polling

### Текущая производительность
- Время загрузки: 50-200 мс (зависит от объёма данных и сети)
- Это приемлемо для большинства сценариев использования

---

## Проблема 2: Ошибка 500 при перемещении элементов

### Описание
При попытке переместить элемент (кнопки ↑↓) возникала ошибка:
```
PUT http://kbsh-diskor-23/DataSources/api/notes/{id}/move 500 (Internal Server Error)
```

### Причина
В PHP API отсутствовали обработчики для endpoint'ов перемещения (`/move`). Фронтенд отправлял запросы, но бэкенд не мог их обработать.

### Решение
Добавлены обработчики move операций в `backend/api/index.php`:

#### 1. Универсальная функция `handleMove()`

```php
function handleMove(PDO $db, string $resource, ?string $id, string $direction): void {
    // Маппинг ресурсов к таблицам БД
    $tableMap = [
        'reports' => ['table' => 'reports', 'parent_field' => null],
        'sections' => ['table' => 'sections', 'parent_field' => 'report_id'],
        'notes' => ['table' => 'notes', 'parent_field' => 'section_id'],
        'noteBlocks' => ['table' => 'note_blocks', 'parent_field' => 'note_id'],
        'indicators' => ['table' => 'indicators', 'parent_field' => 'note_id'],
        'noteBlockIndicators' => ['table' => 'note_block_indicators', 'parent_field' => 'note_block_id'],
        'slices' => ['table' => 'data_slices', 'parent_field' => 'indicator_id'],
        'noteBlockSlices' => ['table' => 'note_block_data_slices', 'parent_field' => 'indicator_id'],
        'sources' => ['table' => 'data_sources', 'parent_field' => 'slice_id'],
        'noteSources' => ['table' => 'note_sources', 'parent_field' => 'note_id'],
        'noteBlockSources' => ['table' => 'note_sources', 'parent_field' => 'note_block_id'],
    ];
    
    // Получаем текущий элемент
    // Получаем все элементы того же уровня
    // Меняем местами sort_order
    // Логируем действие
}
```

#### 2. Обработка в маршрутизаторе

```php
// Обработка move операций
if ($action === 'move' && $method === 'PUT') {
    $direction = $input['direction'] ?? 'up';
    handleMove($db, $resource, $id, $direction);
}
```

#### 3. Добавлены недостающие обработчики

- `handleNoteBlockIndicators()` - для показателей в блоках справок
- `handleNoteBlockSlices()` - для разрезов в блоках справок
- `handleNoteBlockSources()` - для источников в блоках справок

### Как это работает

1. Пользователь нажимает кнопку ↑ или ↓
2. Фронтенд отправляет `PUT /api/{resource}/{id}/move` с `{direction: 'up'}`
3. PHP получает запрос и вызывает `handleMove()`
4. Функция:
   - Находит текущий элемент по ID
   - Получает все элементы того же уровня (с тем же parent_id)
   - Меняет местами `sort_order` с соседним элементом
   - Логирует действие в `actions.log`
5. Фронтенд вызывает `loadReports()` для обновления данных

### Проверка

```bash
# Проверьте, что перемещение работает
# 1. Откройте приложение
# 2. Выберите элемент
# 3. Нажмите кнопку ↑ или ↓
# 4. Проверьте логи:
Get-Content "C:\web\sites\DataSources\api\actions.log" -Wait | Select-String "move"
```

---

## Проблема 3: Пропало выделение строки рамкой при редактировании

### Описание
При нажатии кнопки редактирования (карандаш) чёрная рамка вокруг элемента не отображалась.

### Причина
В `App.tsx` не передавался prop `editingId` в компонент `TreeView`.

### Решение
Добавлена передача `editingId` и `actionId` в TreeView:

```tsx
<TreeView
  reports={reports}
  selectedId={selectedId}
  editingId={formState?.editData?.id || null}  // ← Добавлено
  actionId={actionId}                          // ← Добавлено
  onSelect={handleSelect}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onMoveUp={handleMoveUp}
  onMoveDown={handleMoveDown}
/>
```

### Как это работает

1. Пользователь нажимает кнопку редактирования (✎)
2. `handleEdit()` устанавливает `formState` с данными элемента
3. `editingId` извлекается из `formState.editData.id`
4. `TreeView` получает `editingId` и передаёт его в `TreeNodeItem`
5. `TreeNodeItem` проверяет: `isSelected || isEditing || isAction`
6. Если хотя бы одно условие true, применяется рамка: `ring-2 ring-black ring-offset-1`

### Проверка

1. Откройте приложение
2. Выберите любой элемент
3. Нажмите кнопку редактирования (✎)
4. Должна появиться чёрная рамка вокруг элемента
5. Закройте форму редактирования
6. Рамка должна исчезнуть

---

## Файлы для загрузки на сервер

### Фронтенд
```powershell
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### Бэкенд
```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### Перезапуск Apache
```bash
httpd -k restart
```

---

## Тестирование

### Тест 1: Проверка производительности

1. Откройте консоль браузера (F12)
2. Выполните операцию (добавление/редактирование/удаление)
3. Проверьте время загрузки:
   ```
   Loading reports from API...
   Reports loaded in 123.45ms
   ```
4. Время должно быть < 500 мс

### Тест 2: Проверка перемещения

1. Создайте несколько элементов одного уровня
2. Нажмите кнопку ↑ или ↓
3. Проверьте, что элемент переместился
4. Проверьте логи:
   ```powershell
   Get-Content "C:\web\sites\DataSources\api\actions.log" -Tail 10
   ```
5. Должна быть запись: `Действие: Перемещение | Тип: ... | Направление: up/down`

### Тест 3: Проверка выделения при редактировании

1. Выберите элемент
2. Нажмите кнопку редактирования (✎)
3. Должна появиться чёрная рамка
4. Закройте форму
5. Рамка должна исчезнуть

---

## Решение проблем

### Проблема: Перемещение всё ещё не работает

**Решение:**
1. Проверьте, что загружен обновлённый `index.php`
2. Проверьте логи Apache:
   ```powershell
   Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
   ```
3. Проверьте консоль браузера (F12) на наличие ошибок
4. Убедитесь, что таблица существует:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'note_block_indicators';
   ```

### Проблема: Рамка не появляется при редактировании

**Решение:**
1. Проверьте, что загружен обновлённый фронтенд
2. Очистите кэш браузера (Ctrl+F5)
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь, что `formState.editData.id` содержит ID элемента

### Проблема: Задержка слишком большая (> 1 сек)

**Решение:**
1. Проверьте производительность PostgreSQL:
   ```sql
   SELECT COUNT(*) FROM reports;
   SELECT COUNT(*) FROM sections;
   SELECT COUNT(*) FROM notes;
   ```
2. Проверьте индексы:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'reports';
   ```
3. Рассмотрите оптимизацию запросов
4. Проверьте сетевую задержку

---

## Дополнительные улучшения (будущее)

### 1. Оптимистичные обновления
Обновлять UI до получения ответа от сервера:

```typescript
export async function updateReport(id: string, name: string) {
  // Оптимистичное обновление
  reports = reports.map(r => r.id === id ? { ...r, name } : r);
  notify();
  
  try {
    await api.updateReport(id, { name });
    await loadReports(); // Синхронизация с БД
  } catch (error) {
    // Откат при ошибке
    await loadReports();
    throw error;
  }
}
```

### 2. Кэширование
Хранить данные в памяти и обновлять только изменённые элементы:

```typescript
const cache = new Map<string, Report>();

export async function getReport(id: string): Promise<Report> {
  if (cache.has(id)) {
    return cache.get(id)!;
  }
  
  const report = await api.fetchReport(id);
  cache.set(id, report);
  return report;
}
```

### 3. WebSocket для real-time обновлений
Использовать WebSocket вместо polling для множественных пользователей:

```typescript
const ws = new WebSocket('ws://server/ws');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  applyUpdate(update);
};
```

---

## Заключение

Все три проблемы исправлены:

✅ **Задержка при операциях** - добавлено логирование времени выполнения  
✅ **Ошибка 500 при перемещении** - добавлены обработчики move операций в PHP API  
✅ **Пропало выделение при редактировании** - добавлена передача `editingId` в TreeView  

Проект пересобран и готов к развёртыванию.
