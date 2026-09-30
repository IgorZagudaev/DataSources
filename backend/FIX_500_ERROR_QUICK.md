# Краткая инструкция: Исправление ошибки 500

## ✅ Найдена главная причина

**Проблема:** Функция `getUserIP()` была определена **дважды** в разных файлах, что вызывало Fatal Error.

## Установка (ОБЯЗАТЕЛЬНО загрузите ВСЕ файлы!)

### 1. Загрузите все обновлённые файлы

```powershell
copy backend\api\index.php C:\web\sites\DataSources\api\
copy backend\api\action_logger.php C:\web\sites\DataSources\api\
copy backend\api\access_control.php C:\web\sites\DataSources\api\
copy backend\api\Database.php C:\web\sites\DataSources\api\
copy backend\api\diagnose_full.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Запустите диагностику

```
http://ваш_сервер/DataSources/api/diagnose_full.php
```

Все проверки должны показать ✅

### 4. Проверьте API

```
http://ваш_сервер/DataSources/api/reports
```

Должен вернуть JSON с данными.

## Если видите ошибку "Cannot redeclare getUserIP()"

Вы **не загрузили все файлы**! Загрузите ВСЕ файлы из списка выше.

## Документация

- **Полная инструкция:** `backend/FIX_500_ERROR_FINAL.md`
- **Диагностика:** `backend/api/diagnose_full.php`

---

**Статус:** ✅ Проблема решена  
**Требуется:** Загрузить ВСЕ 5 файлов
