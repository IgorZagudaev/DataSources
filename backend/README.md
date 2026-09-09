# Справочник источников данных показателей в докладе

## Описание

Веб-приложение для управления справочной информацией об источниках данных показателей в докладе. 
Поддерживает иерархическую структуру данных с возможностью редактирования.

## Иерархическая структура

```
1. Доклад (Уровень 1)
   └── N Разделов доклада (Уровень 2)
       ├── N Справок (Уровень 3)
       └── N Показателей (Уровень 3)
           └── N Разрезов данных (Уровень 4)
               └── N Источников данных (Уровень 5)
```

Все отношения: 1 (старший) к N (младший)

## Технологический стек

- **Фронтенд:** React + TypeScript + Tailwind CSS
- **Бэкенд:** PHP 8 (REST API)
- **База данных:** PostgreSQL
- **Веб-сервер:** Apache (Windows Server 2008)

## Структура проекта

```
├── src/                    # React фронтенд
│   ├── App.tsx            # Главный компонент
│   ├── types.ts           # Типы данных
│   ├── store.ts           # Хранилище данных (localStorage)
│   ├── hooks.ts           # React хуки
│   └── components/        # UI компоненты
│       ├── TreeView.tsx   # Дерево навигации
│       ├── DetailPanel.tsx # Панель деталей
│       └── Modal.tsx      # Модальные окна
├── backend/               # PHP бэкенд
│   ├── api/
│   │   ├── index.php     # REST API endpoints
│   │   ├── config.php    # Конфигурация БД
│   │   └── Database.php  # Подключение к PostgreSQL
│   ├── database/
│   │   └── init.sql      # SQL скрипт инициализации БД
│   └── .htaccess         # Конфигурация Apache
└── dist/                  # Сборка фронтенда (после npm run build)
```

## Развёртывание на Windows Server 2008

### 1. Установка PostgreSQL

1. Скачать PostgreSQL с официального сайта (версия 12+)
2. Установить, запомнить пароль пользователя postgres
3. Создать базу данных:
   ```sql
   CREATE DATABASE report_data_sources;
   ```
4. Выполнить скрипт инициализации:
   ```
   psql -U postgres -d report_data_sources -f backend/database/init.sql
   ```

### 2. Настройка Apache + PHP 8

1. Установить Apache 2.4 для Windows
2. Установить PHP 8.x для Windows
3. Включить расширение PostgreSQL в php.ini:
   ```ini
   extension=pdo_pgsql
   extension=pgsql
   ```
4. Настроить VirtualHost в httpd.conf:
   ```apache
   <VirtualHost *:80>
       ServerName your-server-name
       DocumentRoot "C:/path/to/app/dist"
       
       <Directory "C:/path/to/app/dist">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       # API proxy
       Alias /api "C:/path/to/app/backend/api"
       <Directory "C:/path/to/app/backend/api">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
           
           # PHP handler
           <FilesMatch \.php$>
               SetHandler application/x-httpd-php
           </FilesMatch>
       </Directory>
   </VirtualHost>
   ```

### 3. Настройка конфигурации БД

Отредактировать файл `backend/api/config.php`:
```php
return [
    'database' => [
        'host' => 'localhost',
        'port' => '5432',
        'dbname' => 'report_data_sources',
        'user' => 'postgres',
        'password' => 'ваш_пароль',
    ]
];
```

### 4. Сборка фронтенда

```bash
npm install
npm run build
```

Результат сборки будет в папке `dist/`.

### 5. Размещение файлов

```
C:/www/app/
├── dist/          ← содержимое dist/ после сборки
│   ├── index.html
│   └── assets/
├── backend/
│   ├── api/       ← PHP файлы API
│   └── .htaccess
```

## Использование

### Фронтенд (демо-режим)

Приложение работает автономно с данными в localStorage браузера.
Поддерживает:
- Создание/редактирование/удаление всех уровней иерархии
- Экспорт/импорт данных в JSON
- Навигация по дереву
- Просмотр деталей элементов

### API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/reports | Получить все доклады с полной иерархией |
| POST | /api/reports | Создать доклад |
| PUT | /api/reports/{id} | Обновить доклад |
| DELETE | /api/reports/{id} | Удалить доклад |
| POST | /api/sections | Создать раздел |
| PUT | /api/sections/{id} | Обновить раздел |
| DELETE | /api/sections/{id} | Удалить раздел |
| POST | /api/notes | Создать справку |
| PUT | /api/notes/{id} | Обновить справку |
| DELETE | /api/notes/{id} | Удалить справку |
| POST | /api/indicators | Создать показатель |
| PUT | /api/indicators/{id} | Обновить показатель |
| DELETE | /api/indicators/{id} | Удалить показатель |
| POST | /api/slices | Создать разрез |
| PUT | /api/slices/{id} | Обновить разрез |
| DELETE | /api/slices/{id} | Удалить разрез |
| POST | /api/sources | Создать источник |
| PUT | /api/sources/{id} | Обновить источник |
| DELETE | /api/sources/{id} | Удалить источник |

## Примечания для Windows Server 2008

- Убедитесь, что установлен .NET Framework 3.5+ (требуется для некоторых компонентов)
- PostgreSQL 12+ поддерживает Windows Server 2008 R2
- PHP 8.x требует Visual C++ Redistributable 2019
- Рекомендуется использовать Apache 2.4.x (последняя версия для Win2008)
- Настройте firewall для портов 80 (HTTP) и 5432 (PostgreSQL, если удалённый доступ)
