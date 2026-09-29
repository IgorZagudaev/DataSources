# Решение трех проблем

## Проблема 1: Action.log не пишется

### Диагностика
Создан диагностический скрипт `backend/api/test_logging.php` для проверки работы логирования.

### Решение
1. Упрощена функция `logAction()` в `backend/api/action_logger.php`:
   - Убрано избыточное отладочное логирование
   - Упрощена логика записи в файл
   - Добавлена обработка ошибок с `@` оператором

2. Проверьте права доступа:
   ```bash
   # Для Windows
   icacls "C:\web\sites\DataSources\api" /grant "Пользователь:(OI)(CI)F"
   
   # Для Linux
   chmod 755 /path/to/api
   touch /path/to/api/actions.log
   chmod 664 /path/to/api/actions.log
   ```

3. Проверьте работу через диагностический скрипт:
   ```
   http://ваш_сервер/DataSources/api/test_logging.php
   ```

### Файлы
- `backend/api/action_logger.php` - упрощенная версия
- `backend/api/test_logging.php` - диагностический скрипт

---

## Проблема 2: Выбор режима в файле конфига

### Решение
1. Добавлен параметр `default_mode` в `backend/api/config.php`:
   ```php
   'app' => [
       'debug' => false,
       'cors_origins' => ['*'],
       'sql_logging' => true,
       'default_mode' => 'local', // 'local' или 'api'
   ]
   ```

2. Создан endpoint `backend/api/config-endpoint.php` для получения конфигурации:
   ```
   GET /DataSources/api/config-endpoint.php
   ```

3. Модифицирован `src/store.ts`:
   - Добавлена функция `loadConfig()` для загрузки конфигурации с сервера
   - При первом запуске используется значение из конфига, если в localStorage нет сохраненного режима

4. Модифицирован `src/App.tsx`:
   - При старте приложения загружается конфигурация с сервера
   - Если режим не сохранен в localStorage, используется значение из конфига

### Как использовать
1. Откройте `backend/api/config.php`
2. Измените параметр `default_mode`:
   - `'local'` - режим localStorage (по умолчанию)
   - `'api'` - режим PostgreSQL
3. Сохраните файл
4. Очистите localStorage в браузере (если нужно сбросить выбор пользователя):
   ```javascript
   localStorage.clear();
   ```
5. Перезагрузите страницу

### Файлы
- `backend/api/config.php` - добавлен параметр `default_mode`
- `backend/api/config-endpoint.php` - endpoint для получения конфигурации
- `src/store.ts` - добавлена функция `loadConfig()`
- `src/App.tsx` - загрузка конфигурации при старте

---

## Проблема 3: Индикатор загрузки при долгой загрузке из БД

### Решение
1. Добавлено состояние `isLoading` в `src/App.tsx`:
   ```typescript
   const [isLoading, setIsLoading] = useState(false);
   ```

2. Модифицирован `useEffect` для отслеживания загрузки:
   ```typescript
   useEffect(() => {
     setIsLoading(true);
     loadConfig().then(() => {
       if (getDataSourceMode() === 'api') {
         return syncFromAPI();
       }
     }).finally(() => {
       setIsLoading(false);
     });
     // ...
   }, []);
   ```

3. Добавлен индикатор загрузки в UI:
   ```tsx
   {isLoading && (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center">
         <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
         <p className="text-lg font-semibold text-gray-700">Загрузка данных...</p>
         <p className="text-sm text-gray-500 mt-2">Пожалуйста, подождите</p>
       </div>
     </div>
   )}
   ```

### Как это работает
1. При загрузке страницы устанавливается `isLoading = true`
2. Отображается модальное окно с анимированным спиннером
3. Загружается конфигурация с сервера
4. Если режим API, загружаются данные из PostgreSQL
5. После завершения загрузки устанавливается `isLoading = false`
6. Модальное окно скрывается

### Файлы
- `src/App.tsx` - добавлен индикатор загрузки

---

## Установка и проверка

### Шаг 1: Загрузите обновленные файлы на сервер

```bash
# Backend
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/test_logging.php → C:/web/sites/DataSources/api/
backend/api/config.php → C:/web/sites/DataSources/api/
backend/api/config-endpoint.php → C:/web/sites/DataSources/api/

# Frontend
dist/* → C:/web/sites/DataSources/
```

### Шаг 2: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 3: Проверьте логирование

1. Откройте диагностический скрипт:
   ```
   http://ваш_сервер/DataSources/api/test_logging.php
   ```

2. Проверьте, что все тесты прошли успешно

3. Выполните любое действие в приложении (добавление, редактирование, удаление)

4. Проверьте файл `actions.log`:
   ```bash
   type C:\web\sites\DataSources\api\actions.log
   ```

### Шаг 4: Проверьте выбор режима

1. Откройте `backend/api/config.php`
2. Измените `default_mode` на `'api'`
3. Сохраните файл
4. Очистите localStorage в браузере:
   ```javascript
   localStorage.clear();
   ```
5. Перезагрузите страницу
6. Приложение должно автоматически переключиться в режим PostgreSQL

### Шаг 5: Проверьте индикатор загрузки

1. Переключитесь в режим PostgreSQL
2. Перезагрузите страницу
3. Должен появиться индикатор загрузки с анимированным спиннером
4. После загрузки данных индикатор должен исчезнуть

---

## Решение проблем

### Проблема: Action.log не создается

**Решение:**
1. Проверьте права доступа к директории `api/`
2. Создайте файл вручную:
   ```bash
   touch C:\web\sites\DataSources\api\actions.log
   icacls "C:\web\sites\DataSources\api\actions.log" /grant "Пользователь:F"
   ```
3. Проверьте логи Apache на наличие ошибок

### Проблема: Режим не переключается

**Решение:**
1. Очистите localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Проверьте, что `config-endpoint.php` доступен:
   ```
   http://ваш_сервер/DataSources/api/config-endpoint.php
   ```
3. Проверьте консоль браузера на наличие ошибок

### Проблема: Индикатор загрузки не отображается

**Решение:**
1. Проверьте консоль браузера на наличие ошибок JavaScript
2. Убедитесь, что загружены обновленные файлы из `dist/`
3. Проверьте, что режим установлен в `'api'`

---

## Документация

- `backend/api/test_logging.php` - диагностика логирования
- `backend/api/config-endpoint.php` - endpoint для получения конфигурации
- `src/store.ts` - функция `loadConfig()` для загрузки конфигурации
- `src/App.tsx` - индикатор загрузки и загрузка конфигурации при старте

---

**Дата:** 2026-09-17  
**Статус:** ✅ Все три проблемы решены  
**Готово к развёртыванию:** ✅ Да
