# Диагностика проблемы с логированием действий

## Проблема

Файл `actions.log` не создаётся при выполнении действий в приложении.

## Причина

Возможные причины:
1. Недостаточно прав на запись в папку `C:/web/sites/DataSources/api/`
2. Функция `logAction()` не вызывается
3. Ошибка PHP при записи в файл
4. Файл не может быть создан из-за ограничений безопасности

## Решение

### Шаг 1: Загрузите диагностический скрипт

```powershell
copy backend\api\diagnostic.php C:\web\sites\DataSources\api\
```

### Шаг 2: Запустите диагностику

Откройте в браузере:
```
http://ваш_сервер/DataSources/api/diagnostic.php
```

Скрипт проверит:
- ✅ Права доступа к директории
- ✅ Наличие и доступность файла `action_logger.php`
- ✅ Работоспособность функции `logAction()`
- ✅ Создание и запись в файл `actions.log`
- ✅ Последние записи в логе

### Шаг 3: Проверьте результаты

Диагностический скрипт покажет:
- Зелёным цветом - что работает правильно
- Красным цветом - проблемы и ошибки
- Рекомендации по исправлению

### Шаг 4: Проверьте логи Apache

Откройте файл:
```
C:/web/Apache24/logs/error.log
```

Ищите записи вида:
```
logAction вызван: action=add, type=report, id=xxx, name=xxx
Путь к файлу лога: C:\web\sites\DataSources\api\actions.log
Директория существует: да
Директория доступна для записи: да/нет
```

### Шаг 5: Исправьте права доступа (если нужно)

Если диагностика показала проблему с правами:

**Через PowerShell (от администратора):**
```powershell
# Дать полные права пользователю Apache на папку
icacls "C:\web\sites\DataSources\api" /grant "Пользователь:(OI)(CI)F"

# Или дать права всем (не рекомендуется для продакшена)
icacls "C:\web\sites\DataSources\api" /grant "Все:(OI)(CI)F"
```

**Через проводник Windows:**
1. Правый клик на папке `C:\web\sites\DataSources\api`
2. Свойства → Безопасность
3. Изменить → Добавить
4. Добавьте пользователя `IIS_IUSRS` или `SYSTEM`
5. Дайте полные права

### Шаг 6: Создайте файл вручную (если нужно)

```powershell
# Создать пустой файл
New-Item -Path "C:\web\sites\DataSources\api\actions.log" -ItemType File

# Дать права на запись
icacls "C:\web\sites\DataSources\api\actions.log" /grant "Все:F"
```

### Шаг 7: Проверьте работу

1. Выполните любое действие в приложении (добавление/редактирование/удаление)
2. Проверьте файл `C:\web\sites\DataSources\api\actions.log`
3. Проверьте логи Apache на наличие ошибок

## Пример успешной записи

```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Доклад 1
[2026-09-17 16:31:12] IP: 10.64.8.68 | Действие: Редактирование | Тип: section | ID: def456 | Имя: Раздел 1
```

## Отладочная информация

После обновления `action_logger.php` в логах Apache будет подробная информация:

```
logAction вызван: action=add, type=report, id=xxx, name=xxx
Путь к файлу лога: C:\web\sites\DataSources\api\actions.log
Директория существует: да
Директория доступна для записи: да
Запись лога: [2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: xxx | Имя: xxx
Файл лога не существует, пытаемся создать
Файл лога создан успешно
Запись в лог успешна, размер записи: 150 байт
```

## Решение проблем

### Проблема: Диагностика показывает "Директория не доступна для записи"

**Решение:**
```powershell
# Дать права пользователю Apache
icacls "C:\web\sites\DataSources\api" /grant "IIS_IUSRS:(OI)(CI)F"
```

### Проблема: Диагностика показывает "Файл не доступен для записи"

**Решение:**
```powershell
# Удалить файл и создать заново
Remove-Item "C:\web\sites\DataSources\api\actions.log" -ErrorAction SilentlyContinue
New-Item -Path "C:\web\sites\DataSources\api\actions.log" -ItemType File
icacls "C:\web\sites\DataSources\api\actions.log" /grant "IIS_IUSRS:F"
```

### Проблема: Функция logAction не вызывается

**Решение:**
1. Проверьте, что `action_logger.php` подключен в `index.php`:
   ```php
   require_once __DIR__ . '/action_logger.php';
   ```
2. Проверьте логи Apache на наличие ошибок подключения
3. Перезапустите Apache: `httpd -k restart`

### Проблема: Записи появляются в логах Apache, но не в actions.log

**Решение:**
1. Проверьте путь к файлу в `action_logger.php`:
   ```php
   $logFile = __DIR__ . '/actions.log';
   ```
2. Убедитесь, что `__DIR__` указывает на правильную директорию
3. Проверьте права на запись в эту директорию

## Файлы для загрузки

```
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/diagnostic.php → C:/web/sites/DataSources/api/
```

## Проверка после исправления

1. Откройте диагностику: `http://сервер/DataSources/api/diagnostic.php`
2. Все пункты должны быть зелёными
3. Выполните действие в приложении
4. Проверьте файл `actions.log`
5. Проверьте логи Apache

## Дополнительная информация

- Логи Apache: `C:/web/Apache24/logs/error.log`
- Файл действий: `C:/web/sites/DataSources/api/actions.log`
- Диагностический скрипт: `http://сервер/DataSources/api/diagnostic.php`
