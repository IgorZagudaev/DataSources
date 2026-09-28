# Краткая инструкция: IP-адрес и логирование действий

## Что добавлено

✅ **Отображение IP-адреса** в футере приложения  
✅ **Логирование всех действий** пользователей в файл `actions.log`

## Формат лога действий

```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Доклад 1
```

## Установка

### 1. Загрузите файлы на сервер

```powershell
# Новые PHP файлы
copy backend\api\user-info.php C:\web\sites\DataSources\api\
copy backend\api\action_logger.php C:\web\sites\DataSources\api\

# Обновлённые файлы
copy backend\api\index.php C:\web\sites\DataSources\api\
copy backend\.htaccess C:\web\sites\DataSources\

# Обновлённый фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

### 3. Проверьте работу

1. Откройте приложение в браузере
2. В футере должен появиться IP-адрес
3. Выполните любое действие (добавление/редактирование/удаление)
4. Проверьте файл `C:\web\sites\DataSources\api\actions.log`

## Просмотр логов

### В реальном времени

```powershell
Get-Content "C:\web\sites\DataSources\api\actions.log" -Wait
```

### Поиск по IP

```powershell
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "10.64.8.68"
```

### Поиск по действию

```powershell
# Все удаления
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Действие: Удаление"

# Все добавления
Select-String -Path "C:\web\sites\DataSources\api\actions.log" -Pattern "Действие: Добавление"
```

## Что логируется

### Типы действий
- **Добавление** - создание нового элемента
- **Редактирование** - изменение существующего элемента
- **Удаление** - удаление элемента

### Типы сущностей
- `report` - доклад
- `section` - раздел
- `note` - справка
- `noteBlock` - блок справки
- `indicator` - показатель
- `slice` - разрез данных
- `source` - источник данных
- `noteSource` - источник в справке

## Примеры логов

```
[2026-09-17 16:30:45] IP: 10.64.8.68 | Действие: Добавление | Тип: report | ID: abc123 | Имя: Социально-экономическое развитие 2024
[2026-09-17 16:31:12] IP: 10.64.8.68 | Действие: Редактирование | Тип: section | ID: def456 | Имя: Демография
[2026-09-17 16:32:01] IP: 10.64.8.68 | Действие: Удаление | Тип: note | ID: ghi789 | Имя: Численность населения
[2026-09-17 16:33:15] IP: 10.64.8.68 | Действие: Добавление | Тип: source | ID: jkl012 | Имя: Росстат
```

## Решение проблем

### IP не отображается

1. Проверьте доступность: `http://сервер/DataSources/api/user-info.php`
2. Проверьте консоль браузера (F12)
3. Убедитесь, что включён режим PostgreSQL

### Логи не записываются

1. Проверьте права на запись в папку `C:/web/sites/DataSources/api/`
2. Проверьте, что файлы загружены:
   - `user-info.php`
   - `action_logger.php`
   - `index.php` (обновлённый)
   - `.htaccess` (обновлённый)

### IP отображается как "unknown"

1. Проверьте настройки Apache (mod_remoteip)
2. Проверьте, что прокси передаёт заголовки
3. Проверьте файл `user-info.php`

## Документация

Полная документация: `backend/IP_DISPLAY_AND_ACTION_LOGGING.md`

## Файлы для загрузки

```
backend/api/user-info.php → C:/web/sites/DataSources/api/
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/index.php → C:/web/sites/DataSources/api/
backend/.htaccess → C:/web/sites/DataSources/
dist/* → C:/web/sites/DataSources/
```
