-- ============================================================
-- SQL скрипт для создания базы данных справочника источников
-- данных показателей в докладе
-- СУБД: PostgreSQL
-- Совместимость: PostgreSQL 12+
-- 
-- Иерархия (7 уровней, все отношения 1:N):
-- 1. Доклад (reports)
-- 2. Раздел доклада (sections)
-- 3. Справка (notes)
-- 4. Блок справки (note_blocks) - необязательный
-- 5. Показатель (indicators)
-- 6. Разрез данных (data_slices)
-- 7. Источник данных (data_sources)
-- ============================================================

-- Создание базы данных (выполнить отдельно при необходимости)
-- CREATE DATABASE report_data_sources;

-- ============================================================
-- Уровень 1: Таблица докладов
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Уровень 2: Таблица разделов доклада
-- Отношение: N:1 к reports
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sections_report_id ON sections(report_id);

-- ============================================================
-- Уровень 3: Таблица справок
-- Отношение: N:1 к sections
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    short_name VARCHAR(200),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_section_id ON notes(section_id);

-- ============================================================
-- Уровень 4: Таблица блоков справок (необязательный уровень)
-- Отношение: N:1 к notes
-- ============================================================
CREATE TABLE IF NOT EXISTS note_blocks (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_note_blocks_note_id ON note_blocks(note_id);

-- ============================================================
-- Уровень 4 (альтернативный): Таблица источников данных напрямую в справках
-- Отношение: N:1 к notes
-- ============================================================
CREATE TABLE IF NOT EXISTS note_sources (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_note_sources_note_id ON note_sources(note_id);

-- ============================================================
-- Уровень 4: Таблица показателей
-- Отношение: N:1 к notes
-- ============================================================
CREATE TABLE IF NOT EXISTS indicators (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indicators_note_id ON indicators(note_id);

-- ============================================================
-- Уровень 5: Таблица разрезов данных
-- Отношение: N:1 к indicators
-- ============================================================
CREATE TABLE IF NOT EXISTS data_slices (
    id VARCHAR(36) PRIMARY KEY,
    indicator_id VARCHAR(36) NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_slices_indicator_id ON data_slices(indicator_id);

-- ============================================================
-- Уровень 6: Таблица источников данных
-- Отношение: N:1 к data_slices
-- ============================================================
CREATE TABLE IF NOT EXISTS data_sources (
    id VARCHAR(36) PRIMARY KEY,
    slice_id VARCHAR(36) NOT NULL REFERENCES data_slices(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_sources_slice_id ON data_sources(slice_id);

-- ============================================================
-- Функция автоматического обновления updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для всех таблиц
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_indicators_updated_at ON indicators;
CREATE TRIGGER update_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_slices_updated_at ON data_slices;
CREATE TRIGGER update_data_slices_updated_at
    BEFORE UPDATE ON data_slices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at
    BEFORE UPDATE ON data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Начальные данные (пример)
-- ============================================================
INSERT INTO reports (id, name, description) VALUES
    ('report-1', 'Социально-экономическое развитие региона 2024', 'Ежегодный доклад о социально-экономическом развитии')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sections (id, report_id, name, description, sort_order) VALUES
    ('section-1', 'report-1', 'Демография', 'Раздел о демографических показателях', 1),
    ('section-2', 'report-1', 'Экономика', 'Раздел об экономических показателях', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes (id, section_id, name, description, sort_order) VALUES
    ('note-1', 'section-1', 'Численность и состав населения', 'Справка о текущей численности и составе населения региона', 1),
    ('note-2', 'section-2', 'Валовой региональный продукт', 'Справка о ВРП и его динамике', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO indicators (id, note_id, name, description, sort_order) VALUES
    ('indicator-1', 'note-1', 'Численность населения', 'Общая численность постоянного населения', 1),
    ('indicator-2', 'note-2', 'ВРП', 'Валовой региональный продукт', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_slices (id, indicator_id, name, description, sort_order) VALUES
    ('slice-1', 'indicator-1', 'По полу', 'Разбивка по мужскому и женскому населению', 1),
    ('slice-2', 'indicator-1', 'По возрастным группам', 'Разбивка по возрастным группам', 2),
    ('slice-3', 'indicator-2', 'По видам экономической деятельности', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_sources (id, slice_id, name, description, sort_order) VALUES
    ('source-1', 'slice-1', 'Росстат (форма 1-Т)', 'Ежегодные данные Федеральной службы государственной статистики', 1),
    ('source-2', 'slice-1', 'ЗАГС', 'Данные о регистрации актов гражданского состояния', 2),
    ('source-3', 'slice-2', 'Перепись населения 2020', 'Данные Всероссийской переписи населения', 1),
    ('source-4', 'slice-3', 'Росстат (форма 1-ВРП)', 'Данные о валовом региональном продукте', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Представление для получения полной иерархии
-- ============================================================
CREATE OR REPLACE VIEW v_full_hierarchy AS
SELECT
    r.id AS report_id,
    r.name AS report_name,
    s.id AS section_id,
    s.name AS section_name,
    n.id AS note_id,
    n.name AS note_name,
    n.description AS note_description,
    i.id AS indicator_id,
    i.name AS indicator_name,
    i.description AS indicator_description,
    ds.id AS slice_id,
    ds.name AS slice_name,
    ds.description AS slice_description,
    dsrc.id AS source_id,
    dsrc.name AS source_name,
    dsrc.description AS source_description
FROM reports r
LEFT JOIN sections s ON s.report_id = r.id
LEFT JOIN notes n ON n.section_id = s.id
LEFT JOIN indicators i ON i.note_id = n.id
LEFT JOIN data_slices ds ON ds.indicator_id = i.id
LEFT JOIN data_sources dsrc ON dsrc.slice_id = ds.id
ORDER BY r.name, s.sort_order, n.sort_order, i.sort_order, ds.sort_order, dsrc.sort_order;
