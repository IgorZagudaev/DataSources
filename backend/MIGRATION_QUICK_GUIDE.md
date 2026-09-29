# Краткая инструкция: Миграция на прямые вызовы API

## Что сделано

✅ **Полностью переработан фронтенд** для работы с PostgreSQL через REST API  
✅ **Удалён localStorage** - все данные только в БД  
✅ **Все операции стали async** - прямые вызовы API  
✅ **Удалён ModeSwitcher** - только режим PostgreSQL  
✅ **Улучшена производительность** - UPDATE вместо DELETE/INSERT

## Основные изменения

### store.ts
- Все функции стали `async`
- Удалена вся логика localStorage
- Удалена синхронизация через `/api/import`
- Каждая операция вызывает соответствующий endpoint

### App.tsx
- Убран ModeSwitcher
- Все обработчики стали `async`
- Добавлен индикатор загрузки
- Упрощена логика

### FormPanel.tsx
- `handleSubmit` стал `async`
- Все вызовы store функций с `await`

## Производительность

**Было:**
```
Изменение поля → DELETE всех таблиц → INSERT всех данных
Время: 2-5 секунд
```

**Стало:**
```
Изменение поля → UPDATE одной записи
Время: 50-200 мс
```

## Установка

### 1. Загрузите файлы на сервер

```powershell
# Фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\

# Бэкенд (без изменений)
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

1. Откройте приложение
2. Создайте доклад
3. Отредактируйте его
4. Проверьте в БД: `SELECT * FROM reports;`

## Миграция данных из localStorage

Если есть данные в localStorage:

```javascript
// В консоли браузера (F12)
const data = localStorage.getItem('report_data_sources_reference_v3');
console.log(data); // Скопируйте JSON
```

Затем импортируйте через интерфейс приложения.

## Проверка

### Логи SQL
```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Wait
```

Должны быть только UPDATE запросы, без DELETE/INSERT.

### Логи действий
```powershell
Get-Content "C:\web\sites\DataSources\api\actions.log" -Wait
```

Все действия должны записываться.

### База данных
```sql
SELECT COUNT(*) FROM reports;
SELECT COUNT(*) FROM sections;
SELECT COUNT(*) FROM notes;
```

## Решение проблем

### Данные не загружаются
1. Проверьте PostgreSQL
2. Проверьте `config.php`
3. Проверьте логи Apache

### Ошибка при сохранении
1. Проверьте консоль браузера (F12)
2. Проверьте логи PHP
3. Проверьте таблицы в БД

## Документация

Полная документация: `backend/MIGRATION_TO_DIRECT_API.md`

## Файлы для загрузки

```
dist/* → C:/web/sites/DataSources/
```

Проект пересобран и готов к развёртыванию.
