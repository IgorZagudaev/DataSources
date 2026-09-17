# Инструкция по исправлению ошибки внешнего ключа

## Проблема

При импорте данных возникала ошибка:
```
SQLSTATE[23503]: Foreign key violation: INSERT или UPDATE в таблице "data_slices" 
нарушает ограничение внешнего ключа "data_slices_indicator_id_fkey"
DETAIL: Ключ (indicator_id)=(mu5i3vb28xuc7fdse5) отсутствует в таблице "indicators".
```

## Причина

Показатели в блоках справок хранятся в таблице `note_block_indicators`, а не в `indicators`. 
Разрезы данных для этих показателей должны храниться в отдельной таблице `note_block_data_slices`, 
а не в `data_slices`, так как `data_slices` имеет внешний ключ на `indicators`.

## Решение

Созданы две новые таблицы:
1. `note_block_indicators` - для показателей в блоках справок
2. `note_block_data_slices` - для разрезов данных в блоках справок

Также изменена таблица `data_sources`, чтобы она могла ссылаться на обе таблицы разрезов 
(убран внешний ключ на `data_slices`).

## Инструкция по обновлению

### Шаг 1: Выполните SQL скрипт обновления

Откройте pgAdmin или psql и выполните скрипт из файла:
```
backend/database/update_schema.sql
```

Или выполните следующие SQL команды вручную:

```sql
-- Создание таблицы показателей в блоках справок
CREATE TABLE IF NOT EXISTS note_block_indicators (
    id VARCHAR(36) PRIMARY KEY,
    note_block_id VARCHAR(36) NOT NULL REFERENCES note_blocks(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_block_indicators_note_block_id ON note_block_indicators(note_block_id);

-- Создание таблицы разрезов данных в блоках справок
CREATE TABLE IF NOT EXISTS note_block_data_slices (
    id VARCHAR(36) PRIMARY KEY,
    indicator_id VARCHAR(36) NOT NULL REFERENCES note_block_indicators(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_block_data_slices_indicator_id ON note_block_data_slices(indicator_id);

-- Удаление внешнего ключа из таблицы data_sources
ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_slice_id_fkey;

-- Создание индекса для slice_id
CREATE INDEX IF NOT EXISTS idx_data_sources_slice_id ON data_sources(slice_id);
```

### Шаг 2: Загрузите обновлённый файл API

Замените файл:
```
C:/web/sites/DataSources/api/index.php
```

Новым файлом из:
```
backend/api/index.php
```

### Шаг 3: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 4: Проверьте работу

1. Откройте сайт: `http://10.64.8.68/DataSources/`
2. Переключитесь в режим **PostgreSQL**
3. Импортируйте JSON через textarea или загрузите тестовые данные
4. Обновите страницу (F5)
5. Проверьте, что данные отображаются корректно

## Проверка структуры БД

Выполните SQL запрос для проверки наличия новых таблиц:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('note_block_indicators', 'note_block_data_slices')
ORDER BY table_name;
```

Должны быть обе таблицы.

## Проверка структуры таблиц

```sql
-- Проверка таблицы note_block_indicators
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'note_block_indicators' 
ORDER BY ordinal_position;

-- Проверка таблицы note_block_data_slices
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'note_block_data_slices' 
ORDER BY ordinal_position;
```

### Ожидаемая структура `note_block_indicators`:
- `id` (character varying)
- `note_block_id` (character varying)
- `name` (character varying)
- `description` (text)
- `sort_order` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Ожидаемая структура `note_block_data_slices`:
- `id` (character varying)
- `indicator_id` (character varying)
- `name` (character varying)
- `description` (text)
- `sort_order` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Проверка отсутствия внешнего ключа

```sql
-- Проверка, что внешний ключ удалён из data_sources
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'data_sources' 
AND constraint_type = 'FOREIGN KEY';
```

Не должно быть внешнего ключа на `data_slices`.

## Решение проблем

### Проблема: Ошибка "таблица note_block_indicators не существует"
**Решение:** Выполните SQL скрипт обновления из файла `backend/database/update_schema.sql`

### Проблема: Ошибка "таблица note_block_data_slices не существует"
**Решение:** Выполните SQL скрипт обновления из файла `backend/database/update_schema.sql`

### Проблема: Ошибка внешнего ключа всё ещё появляется
**Решение:** 
1. Убедитесь, что выполнен SQL скрипт обновления
2. Убедитесь, что загружен обновлённый файл `index.php`
3. Перезапустите Apache

### Проблема: Данные не отображаются после импорта
**Решение:** Проверьте логи PHP на наличие ошибок:
```
C:/web/Apache24/logs/error.log
```

## Тестовые данные

Для тестирования используйте следующий JSON:
```json
{
  "reports": [
    {
      "name": "Тестовый доклад",
      "description": "Описание доклада",
      "sections": [
        {
          "name": "Тестовый раздел",
          "description": "Описание раздела",
          "notes": [
            {
              "name": "Тестовая справка",
              "shortName": "ТС",
              "description": "Описание справки",
              "noteBlocks": [
                {
                  "name": "Тестовый блок справки",
                  "description": "Описание блока",
                  "indicators": [
                    {
                      "name": "Тестовый показатель в блоке",
                      "description": "Описание показателя",
                      "slices": [
                        {
                          "name": "Тестовый разрез",
                          "description": "Описание разреза",
                          "sources": [
                            {
                              "name": "Тестовый источник",
                              "description": "Описание источника",
                              "sourceTypes": ["Робот"]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              "indicators": [],
              "sources": []
            }
          ]
        }
      ]
    }
  ]
}
```

Этот JSON содержит блоки справок с показателями и позволит проверить корректность работы всех функций.

## Структура данных

### Полная иерархия:

```
Доклад (reports)
└── Раздел (sections)
    └── Справка (notes)
        ├── Блок справки (note_blocks) [необязательный]
        │   └── Показатель (note_block_indicators)
        │       └── Разрез (note_block_data_slices)
        │           └── Источник (data_sources)
        ├── Показатель (indicators)
        │   └── Разрез (data_slices)
        │       └── Источник (data_sources)
        └── Источник (note_sources) [прямой]
```

### Таблицы БД:

1. `reports` - доклады
2. `sections` - разделы
3. `notes` - справки
4. `note_blocks` - блоки справок
5. `note_block_indicators` - показатели в блоках справок
6. `note_block_data_slices` - разрезы в блоках справок
7. `indicators` - показатели в справках
8. `data_slices` - разрезы в показателях
9. `note_sources` - прямые источники в справках
10. `data_sources` - источники данных (для обеих таблиц разрезов)
