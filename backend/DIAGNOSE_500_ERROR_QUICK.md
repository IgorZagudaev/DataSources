# Краткая инструкция: Диагностика ошибки 500

## Что исправлено

✅ Убрана буферизация вывода (`ob_start()`)  
✅ Включено отображение ошибок для диагностики  
✅ Удалён проблемный блок `finally`  

## Установка (3 шага)

### 1. Загрузите файлы

```powershell
# Основной файл
copy backend\api\index.php C:\web\sites\DataSources\api\

# Тестовый файл для диагностики
copy backend\api\test_simple.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/test_simple.php
```

**Если работает** → откройте `http://ваш_сервер/DataSources/api/reports`  
**Если не работает** → смотрите диагностику ниже

## Диагностика

### Шаг 1: Проверьте простой тест

```
http://ваш_сервер/DataSources/api/test_simple.php
```

Должен вернуть JSON с данными.

### Шаг 2: Проверьте основной API

```
http://ваш_сервер/DataSources/api/reports
```

Теперь вы увидите либо JSON, либо текст ошибки PHP.

### Шаг 3: Проверьте логи Apache

```powershell
Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
```

Ищите строки с `PHP Fatal error`, `PHP Parse error`, `Exception`.

### Шаг 4: Проверьте синтаксис PHP

```bash
php -l C:\web\sites\DataSources\api\index.php
```

Должно вывести: `No syntax errors detected`

## Если видите ошибку PHP

Скопируйте текст ошибки и пришлите для анализа.

Типичные ошибки:
- `Call to undefined function` → проблема в коде
- `Database connection failed` → проверьте `config.php`
- `relation "reports" does not exist` → выполните `init.sql`
- `Permission denied` → проверьте права доступа

## Файлы

- **Полная диагностика:** `backend/DIAGNOSE_500_ERROR.md`
- **Обновлённый index.php:** `backend/api/index.php`
- **Простой тест:** `backend/api/test_simple.php`

---

**Статус:** 🔧 Диагностика  
**Приоритет:** Критический
