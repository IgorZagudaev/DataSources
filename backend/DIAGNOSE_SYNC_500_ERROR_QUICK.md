# Краткая инструкция: Диагностика ошибки 500 при синхронизации

## ✅ Что исправлено

### 1. Перемещение разделов
**Проблема:** При перемещении раздела синхронизировался весь доклад  
**Решение:** Изменены функции `moveSectionUp` и `moveSectionDown` - теперь вызывается `notify(reportId, sectionId)`

### 2. Добавлено логирование
Добавлено детальное логирование в `handleReportSync` и `handleSectionSync` для диагностики ошибок

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
   - Размер: ~5-20 КБ

## Диагностика ошибки 500

### Проверьте логи PHP

```powershell
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
...
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
Stack trace: #0 C:\web\sites\DataSources\api\index.php(1050): PDOStatement->execute()
Rolling back transaction...
```

## Проверка оптимизации

### Тест 1: Перемещение раздела

1. Откройте Network tab (F12)
2. Переместите раздел кнопкой ↑ или ↓
3. Проверьте запрос:
   - ✅ URL: `/api/report/{reportId}/section/{sectionId}/sync`
   - ✅ Размер payload: ~5-20 КБ
   - ✅ Время: ~50-200 мс

### Тест 2: Редактирование элемента

1. Откройте Network tab (F12)
2. Отредактируйте заметку в разделе
3. Проверьте запрос:
   - ✅ URL: `/api/report/{reportId}/section/{sectionId}/sync`
   - ✅ Размер payload: ~5-20 КБ

### Тест 3: Добавление раздела

1. Откройте Network tab (F12)
2. Добавьте новый раздел
3. Проверьте запрос:
   - ✅ URL: `/api/report/{reportId}/sync`
   - ✅ Размер payload: ~50-100 КБ (весь доклад)

## Решение проблем

### Проблема: Ошибка 500 при перемещении раздела

**Решение:**
1. Проверьте логи PHP
2. Убедитесь, что загружен обновлённый `store.ts`
3. Проверьте Network tab - должен быть запрос к `/section/{sectionId}/sync`

### Проблема: Отправляется весь доклад вместо раздела

**Решение:**
1. Проверьте, что загружен обновлённый `store.ts`
2. Проверьте функции `moveSectionUp` и `moveSectionDown`
3. Убедитесь, что вызывается `notify(reportId, sectionId)`

### Проблема: Fallback на полную синхронизацию

**Решение:**
1. Проверьте логи PHP на наличие ошибок
2. Проверьте консоль браузера
3. Убедитесь, что эндпоинт `/api/report/{id}/section/{id}/sync` работает

## Файлы для загрузки

```
dist/* → C:/web/sites/DataSources/
backend/api/index.php → C:/web/sites/DataSources/api/
```

## Документация

- **Полная диагностика:** `backend/DIAGNOSE_SYNC_500_ERROR.md`
- **Исправление ошибки 500:** `backend/FIX_SYNC_500_ERROR.md`
- **Архитектура синхронизации:** `backend/SYNC_ARCHITECTURE.md`

---

**Статус:** 🔧 Диагностика  
**Требуется:** Проверка логов PHP для определения точной причины ошибки 500
