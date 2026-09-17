# Инструкция по исправлению ошибки "note_block_id не существует"

## Проблема

В логах PHP появлялась ошибка:
```
SQLSTATE[42703]: Undefined column: столбец "note_block_id" не существует
LINE 1: SELECT * FROM indicators WHERE note_block_id = $1 ORDER BY s...
```

## Причина

Функция `getIndicatorsForNoteBlock` пыталась читать показатели из таблицы `indicators` с полем `note_block_id`, но такого поля не существует. Показатели в блоках справок должны храниться в отдельной таблице `note_block_indicators` с полем `note_block_id`.

## Что исправлено

1. **Функция `getIndicatorsForNoteBlock`** (строка 274):
   - Было: `SELECT * FROM indicators WHERE note_block_id = ?`
   - Стало: `SELECT * FROM note_block_indicators WHERE note_block_id = ?`

2. **Добавлена функция `getSlicesForNoteBlockIndicator`** (строка 297):
   - Читает разрезы для показателей в блоках справок
   - Использует таблицу `data_slices` с полем `indicator_id`

3. **Исправлен импорт показателей в блоках справок** (строка 670):
   - Было: `INSERT INTO indicators (id, note_id, ...)`
   - Стало: `INSERT INTO note_block_indicators (id, note_block_id, ...)`

## Структура таблиц

### Таблица `indicators` (показатели в справках)
```sql
CREATE TABLE indicators (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### Таблица `note_block_indicators` (показатели в блоках справок)
```sql
CREATE TABLE note_block_indicators (
    id VARCHAR(36) PRIMARY KEY,
    note_block_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_block_id) REFERENCES note_blocks(id) ON DELETE CASCADE
);
```

## Инструкция по обновлению

### 1. Остановите Apache (опционально)
```bash
httpd -k stop
```

### 2. Загрузите обновлённый файл API
Замените файл:
```
C:/web/sites/DataSources/api/index.php
```

### 3. Загрузите обновлённые файлы фронтенда
Замените содержимое папки:
```
C:/web/sites/DataSources/
├── index.html
└── assets/
    ├── index-*.js
    └── index-*.css
```

### 4. Запустите Apache (если останавливали)
```bash
httpd -k start
```

### 5. Очистите данные в БД (опционально)
Если нужно начать с чистыми данными:
```sql
-- Очистка всех таблиц в правильном порядке
DELETE FROM data_sources;
DELETE FROM data_slices;
DELETE FROM indicators;
DELETE FROM note_block_indicators;
DELETE FROM note_sources;
DELETE FROM note_blocks;
DELETE FROM notes;
DELETE FROM sections;
DELETE FROM reports;
```

### 6. Проверьте работу
1. Откройте сайт: `http://10.64.8.68/DataSources/`
2. Переключитесь в режим **PostgreSQL**
3. Импортируйте JSON через textarea или загрузите тестовые данные
4. Обновите страницу (F5)
5. Проверьте, что данные отображаются корректно

### 7. Проверьте логи PHP
Откройте логи Apache:
```
C:/web/Apache24/logs/error.log
```

Убедитесь, что ошибка `note_block_id не существует` больше не появляется.

## Проверка структуры БД

Выполните SQL запрос для проверки наличия таблиц:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('indicators', 'note_block_indicators', 'note_blocks', 'notes', 'sections', 'reports', 'data_slices', 'data_sources', 'note_sources')
ORDER BY table_name;
```

Должны быть все 9 таблиц.

## Проверка структуры таблиц

Выполните SQL запрос для проверки структуры таблиц:
```sql
-- Проверка таблицы indicators
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'indicators' 
ORDER BY ordinal_position;

-- Проверка таблицы note_block_indicators
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'note_block_indicators' 
ORDER BY ordinal_position;
```

### Ожидаемая структура `indicators`:
- `id` (character varying)
- `note_id` (character varying) ← важное поле
- `name` (character varying)
- `description` (text)
- `sort_order` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Ожидаемая структура `note_block_indicators`:
- `id` (character varying)
- `note_block_id` (character varying) ← важное поле
- `name` (character varying)
- `description` (text)
- `sort_order` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Если таблицы отсутствуют

Если таблица `note_block_indicators` отсутствует, создайте её:
```sql
CREATE TABLE note_block_indicators (
    id VARCHAR(36) PRIMARY KEY,
    note_block_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_block_id) REFERENCES note_blocks(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_block_indicators_note_block_id ON note_block_indicators(note_block_id);
```

## Решение проблем

### Проблема: Ошибка "note_block_id не существует" всё ещё появляется
**Решение:** Убедитесь, что загружен обновлённый файл `index.php` и перезапустите Apache.

### Проблема: Данные не отображаются после импорта
**Решение:** Проверьте логи PHP на наличие ошибок. Убедитесь, что все таблицы созданы и имеют правильную структуру.

### Проблема: Ошибка при импорте
**Решение:** Проверьте, что JSON валидный и содержит все необходимые поля. Проверьте логи PHP для получения деталей ошибки.

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
              "indicators": [
                {
                  "name": "Тестовый показатель в справке",
                  "description": "Описание показателя",
                  "slices": [
                    {
                      "name": "Тестовый разрез",
                      "description": "Описание разреза",
                      "sources": [
                        {
                          "name": "Тестовый источник",
                          "description": "Описание источника",
                          "sourceTypes": ["ПО"]
                        }
                      ]
                    }
                  ]
                }
              ],
              "sources": [
                {
                  "name": "Прямой источник в справке",
                  "description": "Описание источника",
                  "sourceTypes": ["Ручная выгрузка"]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Этот JSON содержит все уровни иерархии и позволит проверить корректность работы всех функций.
