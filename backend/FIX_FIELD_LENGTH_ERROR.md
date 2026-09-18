# Исправление ошибки превышения длины поля

## Проблема

При импорте данных возникала ошибка:
```
SQLSTATE[22001]: String data, right truncated: значение не умещается в тип character varying(500)
```

## Причина

Поля `name` и `short_name` в таблицах имели тип `VARCHAR(500)` или `VARCHAR(200)`, что ограничивало длину данных.

## Решение

В PostgreSQL тип `TEXT` оптимальнее, чем `VARCHAR(n)`, потому что:
- Нет ограничения длины (до 1 ГБ)
- Одинаковая производительность с VARCHAR
- Greater гибкость

Все текстовые поля изменены на тип `TEXT`.

## Инструкция по применению

### Шаг 1: Выполните SQL скрипт

Откройте pgAdmin или psql и выполните скрипт из файла:
```
backend/database/fix_field_lengths.sql
```

Или выполните команды вручную:

```sql
-- Изменение типа полей name на TEXT во всех таблицах
ALTER TABLE reports ALTER COLUMN name TYPE TEXT;
ALTER TABLE sections ALTER COLUMN name TYPE TEXT;
ALTER TABLE notes ALTER COLUMN name TYPE TEXT;
ALTER TABLE note_blocks ALTER COLUMN name TYPE TEXT;
ALTER TABLE indicators ALTER COLUMN name TYPE TEXT;
ALTER TABLE note_block_indicators ALTER COLUMN name TYPE TEXT;
ALTER TABLE data_slices ALTER COLUMN name TYPE TEXT;
ALTER TABLE note_block_data_slices ALTER COLUMN name TYPE TEXT;
ALTER TABLE data_sources ALTER COLUMN name TYPE TEXT;
ALTER TABLE note_sources ALTER COLUMN name TYPE TEXT;

-- Изменение типа полей description на TEXT
ALTER TABLE reports ALTER COLUMN description TYPE TEXT;
ALTER TABLE sections ALTER COLUMN description TYPE TEXT;
ALTER TABLE notes ALTER COLUMN description TYPE TEXT;
ALTER TABLE note_blocks ALTER COLUMN description TYPE TEXT;
ALTER TABLE indicators ALTER COLUMN description TYPE TEXT;
ALTER TABLE note_block_indicators ALTER COLUMN description TYPE TEXT;
ALTER TABLE data_slices ALTER COLUMN description TYPE TEXT;
ALTER TABLE note_block_data_slices ALTER COLUMN description TYPE TEXT;
ALTER TABLE data_sources ALTER COLUMN description TYPE TEXT;
ALTER TABLE note_sources ALTER COLUMN description TYPE TEXT;

-- Изменение типа поля short_name на TEXT
ALTER TABLE notes ALTER COLUMN short_name TYPE TEXT;
```

### Шаг 2: Проверьте результат

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name IN ('name', 'description', 'short_name')
ORDER BY table_name, column_name;
```

Все поля должны иметь тип `text`.

### Шаг 3: Перезапустите Apache

```bash
httpd -k restart
```

### Шаг 4: Проверьте работу

1. Откройте сайт: `http://10.64.8.68/DataSources/`
2. Переключитесь в режим **PostgreSQL**
3. Импортируйте JSON с длинными названиями
4. Данные должны импортироваться без ошибок

## Обновлённый init.sql

Файл `backend/database/init.sql` также обновлён. Все текстовые поля теперь создаются с типом `TEXT` вместо `VARCHAR(500)`.

Для новой установки базы данных используйте обновлённый `init.sql`.

## Структура таблиц после изменений

Все таблицы теперь используют `TEXT` для текстовых полей:

```sql
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,              -- было VARCHAR(500)
    description TEXT,
    ...
);

CREATE TABLE notes (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL,
    name TEXT NOT NULL,              -- было VARCHAR(500)
    short_name TEXT,                 -- было VARCHAR(200)
    description TEXT,
    ...
);
```

## Преимущества TEXT в PostgreSQL

1. **Нет ограничения длины** - до 1 ГБ данных
2. **Одинаковая производительность** - PostgreSQL хранит TEXT и VARCHAR одинаково
3. **Гибкость** - не нужно заранее угадывать максимальную длину
4. **Стандарт SQL** - TEXT является стандартным типом SQL

## Решение проблем

### Проблема: Ошибка всё ещё появляется
**Решение:** Убедитесь, что SQL скрипт выполнен успешно и Apache перезапущен.

### Проблема: Ошибка при выполнении ALTER TABLE
**Решение:** Проверьте, что у пользователя есть права на изменение структуры таблиц.

### Проблема: Данные не импортируются
**Решение:** Проверьте логи PHP на наличие ошибок:
```
C:/web/Apache24/logs/error.log
```

## Примечание

Для существующих данных изменение типа с VARCHAR на TEXT происходит мгновенно, так как PostgreSQL хранит оба типа одинаково. Данные не пересчитываются и не копируются.
