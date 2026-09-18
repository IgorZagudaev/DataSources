-- ============================================================
-- SQL скрипт для изменения типов полей на TEXT
-- Решение ошибки: "значение не умещается в тип character varying(500)"
-- ============================================================

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

-- Изменение типа полей description на TEXT (если ещё не TEXT)
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
