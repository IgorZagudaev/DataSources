# Диагностика проблемы с отображением полной структуры

## Проблема

После редактирования элемента отображается только изменённая ветка иерархии, а не вся структура.

## Диагностика

Добавлено подробное логирование для диагностики проблемы.

### Шаг 1: Загрузите обновлённые файлы

```powershell
# PHP API
copy backend\api\index.php C:\web\sites\DataSources\api\

# Фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### Шаг 2: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 3: Очистите кэш браузера

```
Ctrl + Shift + Delete
```

### Шаг 4: Откройте консоль браузера

1. Откройте приложение
2. Нажмите F12 для открытия консоли браузера
3. Перейдите на вкладку "Console"

### Шаг 5: Выполните редактирование

1. Выберите любой источник
2. Нажмите "Редактировать"
3. Измените название
4. Нажмите "Сохранить"

### Шаг 6: Проверьте логи

В консоли браузера должны появиться следующие сообщения:

```
Loading hierarchy for sources/abc123...
Received hierarchy: {
  reportId: "report-1",
  reportName: "Доклад 1",
  sectionsCount: 2,
  sections: [
    { id: "section-1", name: "Раздел 1", notesCount: 3 },
    { id: "section-2", name: "Раздел 2", notesCount: 2 }
  ]
}
updateLocalState: updating report report-1
Current reports count: 1
Hierarchy sections count: 2
Found report at index 0
Current report sections count: 2
deepMerge: merging { targetKeys: [...], sourceKeys: [...] }
deepMerge: replacing array 'sections' (2 items)
After merge, sections count: 2
Hierarchy loaded in 123.45ms
```

## Анализ логов

### Проверьте следующие параметры:

1. **`sectionsCount`** - количество секций в полученном докладе
   - Должно быть равно количеству секций в докладе
   - Если меньше - проблема в PHP API

2. **`Hierarchy sections count`** - количество секций в иерархии
   - Должно совпадать с `sectionsCount`

3. **`Current report sections count`** - количество секций в текущем докладе
   - Должно совпадать с `Hierarchy sections count`

4. **`After merge, sections count`** - количество секций после слияния
   - Должно совпадать с `Hierarchy sections count`

### Возможные проблемы:

#### Проблема 1: `sectionsCount` меньше ожидаемого

**Причина:** PHP API не возвращает все секции

**Решение:**
1. Проверьте, что загружен обновлённый `index.php`
2. Проверьте функцию `getReportWithChildren()` в PHP
3. Проверьте логи PHP в `C:/web/Apache24/logs/error.log`

#### Проблема 2: `After merge, sections count` меньше `Hierarchy sections count`

**Причина:** Функция `deepMerge()` неправильно сливает массивы

**Решение:**
1. Проверьте функцию `deepMerge()` в `store.ts`
2. Проверьте логи `deepMerge: replacing array 'sections'`
3. Убедитесь, что массивы заменяются полностью

#### Проблема 3: Ошибки в консоли

**Причина:** JavaScript ошибки

**Решение:**
1. Проверьте все ошибки в консоли
2. Проверьте Network tab на наличие ошибок API
3. Проверьте логи PHP

## Проверка PHP API

### Тест 1: Проверьте endpoint напрямую

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/sources/{id}/hierarchy
```

Замените `{id}` на ID любого источника из базы данных.

**Ожидаемый результат:** JSON с полным докладом, включая все секции, заметки, индикаторы, срезы и источники.

### Тест 2: Проверьте SQL запросы

Откройте логи SQL:
```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 50
```

**Ожидаемые запросы:**
```sql
SELECT * FROM data_sources WHERE id = ?
SELECT * FROM data_slices WHERE id = ?
SELECT * FROM indicators WHERE id = ?
SELECT * FROM notes WHERE id = ?
SELECT * FROM sections WHERE id = ?
SELECT * FROM reports WHERE id = ?
SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order
SELECT * FROM notes WHERE section_id = ? ORDER BY sort_order
...
```

Должно быть много запросов для загрузки всех дочерних элементов.

### Тест 3: Проверьте количество запросов

```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 100 | 
  Select-String "SELECT" | 
  Measure-Object | 
  Select-Object Count
```

**Ожидаемое количество:** 20-50 запросов (для загрузки всей иерархии)

**Если меньше 10:** PHP API не загружает все данные

## Проверка базы данных

### Проверьте количество данных

```sql
-- Количество секций в докладе
SELECT COUNT(*) FROM sections WHERE report_id = 'report-1';

-- Количество заметок в разделе
SELECT COUNT(*) FROM notes WHERE section_id = 'section-1';

-- Количество индикаторов в заметке
SELECT COUNT(*) FROM indicators WHERE note_id = 'note-1';

-- Количество срезов в индикаторе
SELECT COUNT(*) FROM data_slices WHERE indicator_id = 'indicator-1';

-- Количество источников в срезе
SELECT COUNT(*) FROM data_sources WHERE slice_id = 'slice-1';
```

**Ожидаемые результаты:** Должно быть больше 0 для всех запросов.

## Решение проблем

### Проблема: PHP API не возвращает все данные

**Решение:**
1. Проверьте, что загружен обновлённый `index.php`
2. Проверьте функцию `handleGetHierarchy()` в PHP
3. Проверьте, что используются функции `getReportWithChildren()`, `getSectionWithChildren()` и т.д.
4. Проверьте логи PHP на наличие ошибок

### Проблема: Фронтенд не сливает данные правильно

**Решение:**
1. Проверьте функцию `updateLocalState()` в `store.ts`
2. Проверьте функцию `deepMerge()` в `store.ts`
3. Проверьте логи в консоли браузера
4. Убедитесь, что массивы заменяются полностью

### Проблема: Кэширование браузера

**Решение:**
1. Очистите кэш браузера (Ctrl + Shift + Delete)
2. Перезагрузите страницу с принудительным обновлением (Ctrl + F5)
3. Проверьте Network tab на наличие кэшированных ответов

## Отправка информации для анализа

Если проблема не решена, отправьте следующую информацию:

1. **Логи консоли браузера** (весь вывод после редактирования)
2. **Логи SQL** (последние 50 записей)
3. **Логи PHP** (последние 50 записей из `error.log`)
4. **Скриншот Network tab** (запрос к `/api/{level}/{id}/hierarchy`)
5. **Результат SQL запросов** (количество данных в каждой таблице)

## Временное решение

Если проблема не решается, можно временно отключить частичную загрузку и использовать полную загрузку:

### В файле `src/store.ts`:

Замените все вызовы `loadHierarchy()` на `loadReports()`:

```typescript
// Было:
await loadHierarchy('sources', sourceId);

// Стало:
await loadReports();
```

Это вернёт старое поведение с полной загрузкой всех данных.

## Документация

- **Полная документация:** `backend/DIAGNOSE_DISPLAY_ISSUE.md`
- **Предыдущее исправление:** `backend/FIX_FULL_STRUCTURE_DISPLAY.md`
- **Оптимизация загрузки:** `backend/PARTIAL_LOADING_IMPLEMENTATION.md`

## Файлы для загрузки

```
backend/api/index.php → C:/web/sites/DataSources/api/
dist/* → C:/web/sites/DataSources/
```

---

**Дата:** 2026-09-17  
**Статус:** 🔍 Диагностика  
**Готово к развёртыванию:** ⚠️ Требуется проверка логов
