# Краткая инструкция: Исправление ошибки JSON

## ✅ Проблема решена

Все `echo json_encode()` заменены на `sendJsonResponse()` с буферизацией вывода.

## Установка (3 шага)

### 1. Загрузите файл

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Очистите кэш браузера

- `Ctrl + Shift + Delete` → очистите кэш
- Или `Ctrl + F5` для жёсткой перезагрузки

## Проверка

Откройте в браузере:

```
http://ваш_сервер/DataSources/api/reports
```

**Должно быть:** JSON с данными  
**Не должно быть:** HTML с ошибкой

## Что исправлено

✅ Буферизация вывода предотвращает HTML ошибки  
✅ Все `echo json_encode()` заменены на `sendJsonResponse()`  
✅ Корректные HTTP статусы для всех ошибок  
✅ Подробное логирование в PHP логи  

## Если не работает

1. Проверьте `php.ini`:
   ```ini
   display_errors = Off
   ```

2. Проверьте логи:
   ```powershell
   Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
   ```

3. Проверьте синтаксис:
   ```bash
   php -l C:\web\sites\DataSources\api\index.php
   ```

## Файлы

- **Полная документация:** `backend/FIX_JSON_ERROR_FINAL.md`
- **Диагностика:** `backend/DIAGNOSE_API_ERROR.md`
- **Обновлённый файл:** `backend/api/index.php`

---

**Статус:** ✅ Готово к развёртыванию
