-- ============================================================
-- SQL скрипт для обновления базы данных
-- Добавление таблиц для показателей и разрезов в блоках справок
-- ============================================================

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

-- Удаление внешнего ключа из таблицы data_sources, чтобы она могла ссылаться на обе таблицы разрезов
ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_slice_id_fkey;

-- Создание индекса для slice_id (если его еще нет)
CREATE INDEX IF NOT EXISTS idx_data_sources_slice_id ON data_sources(slice_id);
