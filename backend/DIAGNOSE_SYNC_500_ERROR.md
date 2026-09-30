# Диагностика ошибки 500 при синхронизации

## Что было исправлено

### 1. Проблема с перемещением разделов

**Проблема:** При перемещении раздела вызывался `notify(reportId)` без `sectionId`, поэтому синхронизировался весь доклад вместо только раздела.

**Решение:** Изменены функции `moveSectionUp` и `moveSectionDown` в `src/store.ts`:

```typescript
// Было:
notify(reportId); // Для перемещения раздела синхронизируем весь доклад

// Стало:
notify(reportId, sectionId); // Синхронизируем только этот раздел
```

### 2. Добавлено детальное логирование

Добавлено логирование в функции `handleReportSync` и `handleSectionSync` для диагностики ошибок:

```php
error_log("=== handleReportSync called for report: $reportId ===");
error_log("Report data received: " . json_encode(['id' => $report['id'] ?? 'null', 'name' => $report['name'] ?? 'null']));
error_log("Transaction started");
error_log("Deleting data_sources...");
// ... и т.д.
```

## Установка

### Шаг 1: Загрузите обновлённые файлы

```powershell
# Frontend
xcopy /E /Y dist\* C:\web\sites\DataSources\

# Backend
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### Шаг 2: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 3: Проверьте работу

1. Откройте приложение
2. Откройте консоль браузера (F12)
3. Переместите раздел кнопками ↑↓
4. Проверьте Network tab:
   - Запрос: `/api/report/{reportId}/section/{sectionId}/sync`
   - Статус: должен быть 200 OK
   - Размер: ~5-20 КБ (не 50-100 КБ)

## Диагностика ошибки 500

### Проверка логов PHP

Если ошибка 500 всё ещё возникает, проверьте логи PHP:

```powershell
# Проверьте последние записи в логе
Get-Content "C:\web\Apache24\logs\error.log" -Tail 100
```

Ищите строки с:
- `=== handleReportSync called ===`
- `=== handleSectionSync called ===`
- `!!! EXCEPTION in handleReportSync:`
- `!!! EXCEPTION in handleSectionSync:`

### Пример успешного выполнения

```
=== handleSectionSync called for section: abc123 in report: def456 ===
Section data received: {"id":"abc123","name":"Раздел 1"}
Transaction started
Deleting data_sources...
Deleting note_sources...
Deleting data_slices...
Deleting note_block_data_slices...
Deleting indicators...
Deleting note_block_indicators...
Deleting note_blocks...
Deleting notes...
Deleting sections...
Deleting report...
Inserting new report...
Report inserted successfully
Committing transaction...
Transaction committed successfully
=== handleSectionSync completed successfully ===
```

### Пример ошибки

```
=== handleReportSync called for report: abc123 ===
Report data received: {"id":"abc123","name":"Доклад 1"}
Transaction started
Deleting data_sources...
!!! EXCEPTION in handleReportSync: SQLSTATE[23000]: Integrity constraint violation...
Exception class: PDOException
Stack trace: #0 C:\web\sites\DataSources\api\index.php(1050): PDOStatement->execute()
...
Rolling back transaction...
Transaction rolled back
```

## Возможные причины ошибки 500

### 1. Нарушение целостности данных

**Симптом:** Ошибка `SQLSTATE[23000]: Integrity constraint violation`

**Причина:** Внешние ключи не позволяют удалить данные

**Решение:** Проверьте, что все связанные данные удаляются в правильном порядке

### 2. Отсутствие таблицы

**Симптом:** Ошибка `SQLSTATE[42S02]: Base table or view not found`

**Причина:** Таблица не существует в БД

**Решение:** Выполните SQL скрипт создания таблиц:
```bash
psql -U postgres -d report_data_sources -f backend/database/init.sql
```

### 3. Недостаточно прав

**Симптом:** Ошибка `SQLSTATE[42501]: insufficient privilege`

**Причина:** Пользователь БД не имеет прав на удаление/вставку

**Решение:** Проверьте права пользователя PostgreSQL

### 4. Превышение размера данных

**Симптом:** Ошибка `SQLSTATE[54000]: too many records`

**Причина:** Слишком много данных для одной транзакции

**Решение:** Разбейте операцию на несколько транзакций

## Проверка оптимизации

### Тест 1: Перемещение раздела

1. Откройте Network tab (F12)
2. Переместите раздел кнопкой ↑ или ↓
3. Проверьте запрос:
   - URL: `/api/report/{reportId}/section/{sectionId}/sync`
   - Метод: POST
   - Размер payload: ~5-20 КБ
   - Время: ~50-200 мс

### Тест 2: Редактирование элемента в разделе

1. Откройте Network tab (F12)
2. Отредактируйте заметку в разделе
3. Проверьте запрос:
   - URL: `/api/report/{reportId}/section/{sectionId}/sync`
   - Метод: POST
   - Размер payload: ~5-20 КБ
   - Время: ~50-200 мс

### Тест 3: Добавление раздела

1. Откройте Network tab (F12)
2. Добавьте новый раздел
3. Проверьте запрос:
   - URL: `/api/report/{reportId}/sync`
   - Метод: POST
   - Размер payload: ~50-100 КБ (весь доклад)
   - Время: ~100-500 мс

## Логи для проверки

### Успешная синхронизация раздела

```
[2026-09-17 16:30:45] === handleSectionSync called for section: abc123 in report: def456 ===
[2026-09-17 16:30:45] Section data received: {"id":"abc123","name":"Раздел 1"}
[2026-09-17 16:30:45] Transaction started
[2026-09-17 16:30:45] Deleting data_sources...
[2026-09-17 16:30:45] Deleting note_sources...
[2026-09-17 16:30:45] Deleting data_slices...
[2026-09-17 16:30:45] Deleting note_block_data_slices...
[2026-09-17 16:30:45] Deleting indicators...
[2026-09-17 16:30:45] Deleting note_block_indicators...
[2026-09-17 16:30:45] Deleting note_blocks...
[2026-09-17 16:30:45] Deleting notes...
[2026-09-17 16:30:45] Deleting sections...
[2026-09-17 16:30:45] Deleting report...
[2026-09-17 16:30:45] Inserting new report...
[2026-09-17 16:30:45] Report inserted successfully
[2026-09-17 16:30:45] Committing transaction...
[2026-09-17 16:30:45] Transaction committed successfully
[2026-09-17 16:30:45] === handleSectionSync completed successfully ===
```

### Успешная синхронизация доклада

```
[2026-09-17 16:30:45] === handleReportSync called for report: def456 ===
[2026-09-17 16:30:45] Report data received: {"id":"def456","name":"Доклад 1"}
[2026-09-17 16:30:45] Transaction started
[2026-09-17 16:30:45] Deleting data_sources...
[2026-09-17 16:30:45] Deleting note_sources...
[2026-09-17 16:30:45] Deleting data_slices...
[2026-09-17 16:30:45] Deleting note_block_data_slices...
[2026-09-17 16:30:45] Deleting indicators...
[2026-09-17 16:30:45] Deleting note_block_indicators...
[2026-09-17 16:30:45] Deleting note_blocks...
[2026-09-17 16:30:45] Deleting notes...
[2026-09-17 16:30:45] Deleting sections...
[2026-09-17 16:30:45] Deleting report...
[2026-09-17 16:30:45] Inserting new report...
[2026-09-17 16:30:45] Report inserted successfully
[2026-09-17 16:30:45] Committing transaction...
[2026-09-17 16:30:45] Transaction committed successfully
[2026-09-17 16:30:45] === handleReportSync completed successfully ===
```

## Решение проблем

### Проблема: Ошибка 500 при перемещении раздела

**Решение:**
1. Проверьте логи PHP
2. Убедитесь, что загружен обновлённый `store.ts`
3. Проверьте, что вызывается `notify(reportId, sectionId)`
4. Проверьте Network tab - должен быть запрос к `/section/{sectionId}/sync`

### Проблема: Отправляется весь доклад вместо раздела

**Решение:**
1. Проверьте, что загружен обновлённый `store.ts`
2. Проверьте функции `moveSectionUp` и `moveSectionDown`
3. Убедитесь, что вызывается `notify(reportId, sectionId)`

### Проблема: Fallback на полную синхронизацию

**Решение:**
1. Проверьте логи PHP на наличие ошибок
2. Проверьте консоль браузера на наличие ошибок
3. Убедитесь, что эндпоинт `/api/report/{id}/section/{id}/sync` работает
4. Проверьте права доступа к БД

## Файлы для загрузки

```
dist/* → C:/web/sites/DataSources/
backend/api/index.php → C:/web/sites/DataSources/api/
```

## Документация

- **Полная диагностика:** `backend/DIAGNOSE_SYNC_500_ERROR.md` (этот файл)
- **Исправление ошибки 500:** `backend/FIX_SYNC_500_ERROR.md`
- **Архитектура синхронизации:** `backend/SYNC_ARCHITECTURE.md`

---

**Дата:** 2026-09-17  
**Статус:** 🔧 Диагностика  
**Требуется:** Проверка логов PHP для определения точной причины ошибки 500
