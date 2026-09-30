# Система контроля доступа по IP-адресам

## Описание

Реализована система контроля доступа для административных функций приложения. Только пользователи с IP-адресами из списка администраторов могут выполнять операции изменения данных.

## Функциональность

### Администраторы могут:
- ✅ Импорт данных
- ✅ Экспорт данных
- ✅ Сброс данных
- ✅ Добавление элементов
- ✅ Редактирование элементов
- ✅ Удаление элементов
- ✅ Перемещение элементов

### Обычные пользователи могут:
- ✅ Просмотр данных
- ✅ Выбор элементов
- ✅ Фильтрация по типам источников
- ✅ Развернуть/свернуть иерархию
- ❌ Импорт данных
- ❌ Экспорт данных
- ❌ Сброс данных
- ❌ Добавление элементов
- ❌ Редактирование элементов
- ❌ Удаление элементов
- ❌ Перемещение элементов

## Настройка

### 1. Конфигурация списка администраторов

Откройте файл `backend/api/config.php` и добавьте IP-адреса администраторов:

```php
'app' => [
    'debug' => false,
    'cors_origins' => ['*'],
    'sql_logging' => true,
    'default_mode' => 'local',
    
    // Список IP-адресов с правами администратора
    'admin_ips' => [
        '127.0.0.1',           // localhost
        '::1',                 // localhost IPv6
        '10.64.8.68',          // IP администратора 1
        '192.168.1.100',       // IP администратора 2
        // Добавьте сюда IP-адреса администраторов
    ],
]
```

### 2. Определение IP-адреса пользователя

Система определяет IP-адрес пользователя в следующем порядке приоритета:

1. `HTTP_X_FORWARDED_FOR` - если приложение работает за прокси
2. `HTTP_X_REAL_IP` - альтернативный заголовок прокси
3. `HTTP_CLIENT_IP` - ещё один вариант прокси
4. `REMOTE_ADDR` - прямой IP-адрес клиента

### 3. Проверка прав доступа

Пользователь может проверить свои права доступа:

```
GET /DataSources/api/permissions.php
```

Ответ:
```json
{
  "is_admin": true,
  "ip": "10.64.8.68",
  "can_edit": true,
  "can_import": true,
  "can_export": true,
  "can_delete": true
}
```

## Реализация

### Backend (PHP)

#### Файл: `backend/api/access_control.php`

Содержит функции для контроля доступа:

```php
// Получение IP-адреса пользователя
function getUserIP() { ... }

// Проверка, является ли пользователь администратором
function isAdmin() { ... }

// Проверка прав доступа (блокирует выполнение, если нет прав)
function requireAdmin() { ... }

// Получение информации о правах пользователя
function getUserPermissions() { ... }
```

#### Файл: `backend/api/index.php`

Добавлена проверка прав для всех операций изменения данных:

```php
// Проверка прав доступа для административных операций
// GET запросы разрешены всем, POST/PUT/DELETE требуют прав администратора
if ($method !== 'GET' && $resource !== 'permissions') {
    requireAdmin();
}
```

#### Файл: `backend/api/permissions.php`

Endpoint для получения информации о правах пользователя:

```php
require_once __DIR__ . '/access_control.php';
echo json_encode(getUserPermissions());
```

### Frontend (React)

#### Файл: `src/App.tsx`

1. Добавлено состояние `isAdmin`:
```typescript
const [isAdmin, setIsAdmin] = useState<boolean>(false);
```

2. Загрузка прав при старте:
```typescript
fetch('/DataSources/api/permissions.php')
  .then(response => response.json())
  .then(permissions => {
    setIsAdmin(permissions.is_admin || false);
  });
```

3. Скрытие кнопок администратора для не-администраторов:
```tsx
{isAdmin && (
  <>
    <button onClick={handleExport}>Экспорт</button>
    <button onClick={() => setShowImportModal(true)}>Импорт</button>
    <button onClick={handleReset}>Сброс</button>
  </>
)}
```

4. Отображение статуса в футере:
```tsx
{isAdmin ? (
  <span className="bg-green-100 text-green-800">Администратор</span>
) : (
  <span className="bg-gray-100 text-gray-600">Только просмотр</span>
)}
```

#### Файл: `src/components/TreeView.tsx`

1. Добавлен параметр `isAdmin` в `TreeViewProps`
2. Передача `isAdmin` во все `TreeNodeItem`
3. Скрытие кнопок действий для не-администраторов:

```tsx
{isAdmin && (
  <div className="flex items-center gap-1">
    {/* Кнопки добавления, редактирования, удаления, перемещения */}
  </div>
)}
```

## Безопасность

### Двухуровневая защита

1. **Frontend**: Кнопки административных функций скрыты для не-администраторов
2. **Backend**: API возвращает ошибку 403 при попытке выполнения запрещённой операции

### Обработка ошибок

При попытке не-администратора выполнить административную операцию:

**HTTP статус:** 403 Forbidden

**Ответ:**
```json
{
  "error": "Доступ запрещён",
  "message": "У вашего IP-адреса нет прав для выполнения этой операции",
  "your_ip": "192.168.1.50"
}
```

## Установка

### 1. Загрузите файлы на сервер

```powershell
# Backend
copy backend\api\config.php C:\web\sites\DataSources\api\
copy backend\api\access_control.php C:\web\sites\DataSources\api\
copy backend\api\permissions.php C:\web\sites\DataSources\api\
copy backend\api\index.php C:\web\sites\DataSources\api\
copy backend\.htaccess C:\web\sites\DataSources\

# Frontend
xcopy /E /Y dist\* C:\web\sites\DataSources\
```

### 2. Настройте список администраторов

Отредактируйте `C:\web\sites\DataSources\api\config.php`:

```php
'admin_ips' => [
    '127.0.0.1',           // localhost
    '::1',                 // localhost IPv6
    '10.64.8.68',          // Ваш IP-адрес
],
```

### 3. Перезапустите Apache

```bash
httpd -k restart
```

### 4. Проверьте работу

1. Откройте приложение с IP администратора
2. В футере должен появиться значок "Администратор"
3. Все кнопки административных функций должны быть доступны
4. Откройте приложение с другого IP
5. В футере должен появиться значок "Только просмотр"
6. Кнопки административных функций должны быть скрыты

## Проверка прав доступа

### Тест 1: Проверка endpoint permissions

```bash
curl http://ваш_сервер/DataSources/api/permissions.php
```

Ожидаемый ответ:
```json
{
  "is_admin": true,
  "ip": "10.64.8.68",
  "can_edit": true,
  "can_import": true,
  "can_export": true,
  "can_delete": true
}
```

### Тест 2: Проверка запрета доступа

С другого IP-адреса (не из списка администраторов):

```bash
curl -X POST http://ваш_сервер/DataSources/api/reports \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест"}'
```

Ожидаемый ответ:
```json
{
  "error": "Доступ запрещён",
  "message": "У вашего IP-адреса нет прав для выполнения этой операции",
  "your_ip": "192.168.1.50"
}
```

HTTP статус: 403

### Тест 3: Проверка UI

1. Откройте приложение с IP администратора
2. Проверьте, что видны кнопки: Экспорт, Импорт, Сброс
3. Проверьте, что видны кнопки действий в дереве: +, ✎, ✕, ↑, ↓
4. Откройте приложение с другого IP
5. Проверьте, что кнопки администратора скрыты
6. Проверьте, что кнопки действий в дереве скрыты

## Решение проблем

### Проблема: Администратор не имеет прав

**Решение:**
1. Проверьте, что IP-адрес добавлен в `admin_ips` в `config.php`
2. Проверьте, как определяется IP-адрес:
   ```
   http://ваш_сервер/DataSources/api/permissions.php
   ```
3. Если IP определяется неправильно (за прокси), проверьте заголовки:
   - `HTTP_X_FORWARDED_FOR`
   - `HTTP_X_REAL_IP`
   - `HTTP_CLIENT_IP`

### Проблема: Кнопки всё ещё видны

**Решение:**
1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Перезагрузите страницу с принудительным обновлением (Ctrl+F5)
3. Проверьте консоль браузера на наличие ошибок JavaScript

### Проблема: Ошибка 403 при выполнении операции

**Решение:**
1. Проверьте, что IP-адрес добавлен в `admin_ips`
2. Проверьте логи PHP на наличие ошибок
3. Проверьте, что файл `access_control.php` загружен на сервер

## Мониторинг

### Логи доступа

Все попытки несанкционированного доступа логируются в `actions.log`:

```
[2026-09-17 16:30:45] IP: 192.168.1.50 | Действие: Попытка доступа | Тип: report | Метод: POST | Статус: Запрещено
```

### Проверка прав пользователя

```bash
# Проверить права текущего пользователя
curl http://ваш_сервер/DataSources/api/permissions.php

# Проверить права с другого IP (используйте прокси или VPN)
curl -x http://proxy:port http://ваш_сервер/DataSources/api/permissions.php
```

## Расширение функциональности

### Добавление ролей

В будущем можно добавить систему ролей:

```php
'admin_ips' => [
    '10.64.8.68' => 'super_admin',
    '10.64.8.69' => 'editor',
    '10.64.8.70' => 'viewer',
],

'roles' => [
    'super_admin' => ['import', 'export', 'delete', 'edit', 'add', 'move'],
    'editor' => ['edit', 'add', 'move'],
    'viewer' => [],
],
```

### Аутентификация

Для более надёжной защиты можно добавить:
- Аутентификацию по логину/паролю
- JWT токены
- Сессии PHP

### Логирование действий

Все действия администраторов логируются в `actions.log` с указанием IP-адреса.

## Документация

- **Полная документация:** `backend/IP_ACCESS_CONTROL.md`
- **Конфигурация:** `backend/api/config.php`
- **Контроль доступа:** `backend/api/access_control.php`
- **Endpoint прав:** `backend/api/permissions.php`

## Файлы для загрузки

```
backend/api/config.php → C:/web/sites/DataSources/api/
backend/api/access_control.php → C:/web/sites/DataSources/api/
backend/api/permissions.php → C:/web/sites/DataSources/api/
backend/api/index.php → C:/web/sites/DataSources/api/
backend/.htaccess → C:/web/sites/DataSources/
dist/* → C:/web/sites/DataSources/
```

---

**Дата:** 2026-09-17  
**Статус:** ✅ Завершено  
**Готово к развёртыванию:** ✅ Да
