# Диагностика проблемы с отображением полной структуры

## Добавлено логирование

Добавлено подробное логирование для диагностики проблемы с отображением только изменённой ветки иерархии.

## Установка

### 1. Загрузите обновлённые файлы

```powershell
# PHP API
copy backend\api\index.php C:\web\sites\DataSources\api\

# Фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Очистите кэш браузера

```
Ctrl + Shift + Delete
```

## Проверка

### Шаг 1: Откройте консоль браузера

1. Откройте приложение
2. Нажмите F12
3. Перейдите на вкладку "Console"

### Шаг 2: Выполните редактирование

1. Выберите любой источник
2. Нажмите "Редактировать"
3. Измените название
4. Нажмите "Сохранить"

### Шаг 3: Проверьте логи

В консоли должны появиться сообщения:

```
Loading hierarchy for sources/abc123...
Received hierarchy: {
  reportId: "report-1",
  reportName: "Доклад 1",
  sectionsCount: 2,
  sections: [...]
}
updateLocalState: updating report report-1
Current reports count: 1
Hierarchy sections count: 2
Found report at index 0
Current report sections count: 2
deepMerge: merging {...}
deepMerge: replacing array 'sections' (2 items)
After merge, sections count: 2
Hierarchy loaded in 123.45ms
```

### Шаг 4: Проверьте PHP API

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/sources/{id}/hierarchy
```

Замените `{id}` на ID любого источника.

**Ожидаемый результат:** JSON с полным докладом, включая все секции.

### Шаг 5: Проверьте SQL логи

```powershell
Get-Content "C:\web\sites\DataSources\api\sql.log" -Tail 50
```

Должно быть 20-50 SQL запросов для загрузки всей иерархии.

## Отправьте информацию

Если проблема не решена, отправьте:

1. **Логи консоли браузера** (весь вывод после редактирования)
2. **Результат запроса** `http://ваш_сервер/DataSources/api/sources/{id}/hierarchy`
3. **Последние 50 строк** из `sql.log`

## Документация

- **Полная документация:** `backend/DIAGNOSE_DISPLAY_ISSUE.md`
- **Предыдущее исправление:** `backend/FIX_FULL_STRUCTURE_DISPLAY.md`

---

**Статус:** 🔍 Диагностика  
**Требуется:** Проверка логов
