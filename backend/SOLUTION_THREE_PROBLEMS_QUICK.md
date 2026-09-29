# Краткая инструкция: Решение трех проблем

## ✅ Все три проблемы решены

### 1. Action.log не пишется
**Решение:** Упрощена функция логирования, создан диагностический скрипт

**Проверка:**
```
http://ваш_сервер/DataSources/api/test_logging.php
```

### 2. Выбор режима в файле конфига
**Решение:** Добавлен параметр `default_mode` в `config.php`

**Настройка:**
```php
// backend/api/config.php
'app' => [
    'default_mode' => 'local', // или 'api' для PostgreSQL
]
```

### 3. Индикатор загрузки при долгой загрузке из БД
**Решение:** Добавлен спиннер загрузки при переключении в режим API

---

## Установка

### Шаг 1: Загрузите файлы на сервер

```powershell
# Backend
copy backend\api\action_logger.php C:\web\sites\DataSources\api\
copy backend\api\test_logging.php C:\web\sites\DataSources\api\
copy backend\api\config.php C:\web\sites\DataSources\api\
copy backend\api\config-endpoint.php C:\web\sites\DataSources\api\

# Frontend
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### Шаг 2: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 3: Проверьте логирование

1. Откройте: `http://ваш_сервер/DataSources/api/test_logging.php`
2. Убедитесь, что все тесты прошли ✅
3. Выполните действие в приложении
4. Проверьте файл `actions.log`

### Шаг 4: Настройте режим по умолчанию

1. Откройте `C:\web\sites\DataSources\api\config.php`
2. Измените:
   ```php
   'default_mode' => 'api', // для PostgreSQL
   ```
3. Сохраните файл
4. Очистите localStorage в браузере:
   ```javascript
   localStorage.clear();
   ```
5. Перезагрузите страницу

### Шаг 5: Проверьте индикатор загрузки

1. Переключитесь в режим PostgreSQL
2. Перезагрузите страницу (F5)
3. Должен появиться спиннер загрузки
4. После загрузки данных спиннер исчезнет

---

## Проверка работы

### Тест 1: Логирование действий

```powershell
# Выполните действие в приложении
# Затем проверьте лог
Get-Content "C:\web\sites\DataSources\api\actions.log" -Tail 10
```

**Ожидаемый результат:**
```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Доклад 1
```

### Тест 2: Режим по умолчанию

```powershell
# Проверьте конфигурацию
Select-String -Path "C:\web\sites\DataSources\api\config.php" -Pattern "default_mode"
```

**Ожидаемый результат:**
```php
'default_mode' => 'api',
```

### Тест 3: Индикатор загрузки

1. Откройте приложение
2. Переключитесь в режим PostgreSQL
3. Перезагрузите страницу (Ctrl+F5)
4. Должен появиться спиннер с текстом "Загрузка данных..."

---

## Решение проблем

### Проблема: Action.log не создается

**Решение:**
```powershell
# Создайте файл вручную
New-Item -Path "C:\web\sites\DataSources\api\actions.log" -ItemType File

# Дайте права
icacls "C:\web\sites\DataSources\api\actions.log" /grant "Все:F"
```

### Проблема: Режим не переключается

**Решение:**
```javascript
// В консоли браузера
localStorage.clear();
location.reload();
```

### Проблема: Спиннер не отображается

**Решение:**
1. Проверьте консоль браузера (F12) на ошибки
2. Убедитесь, что загружены обновленные файлы из `dist/`
3. Очистите кэш браузера (Ctrl+Shift+Delete)

---

## Файлы для загрузки

```
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/test_logging.php → C:/web/sites/DataSources/api/
backend/api/config.php → C:/web/sites/DataSources/api/
backend/api/config-endpoint.php → C:/web/sites/DataSources/api/
dist/* → C:/web/sites/DataSources/
```

---

## Документация

- **Полная документация:** `backend/SOLUTION_THREE_PROBLEMS.md`
- **Диагностика логирования:** `backend/api/test_logging.php`
- **Конфигурация:** `backend/api/config.php`

---

**Статус:** ✅ Все три проблемы решены  
**Проект собран:** ✅ Да  
**Готово к развёртыванию:** ✅ Да
