-- ============================================================
-- SQL скрипт для увеличения размера полей в таблицах
-- Решение ошибки: "значение не умещается в тип character varying(500)"
-- ============================================================

-- Увеличение размера полей name во всех таблицах
ALTER TABLE reports ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE sections ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE notes ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE note_blocks ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE indicators ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE note_block_indicators ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE data_slices ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE note_block_data_slices ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE data_sources ALTER COLUMN name TYPE VARCHAR(2000);
ALTER TABLE note_sources ALTER COLUMN name TYPE VARCHAR(2000);

-- Увеличение размера полей description во всех таблицах
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
