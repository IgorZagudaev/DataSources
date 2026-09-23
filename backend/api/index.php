<?php
/**
 * REST API для справочника источников данных показателей
 * 
 * Иерархия (7 уровней, все отношения 1:N):
 * 1. Доклад (reports)
 * 2. Раздел доклада (sections)
 * 3. Справка (notes)
 * 4. Блок справки (note_blocks) - необязательный
 * 5. Показатель (indicators)
 * 6. Разрез данных (slices)
 * 7. Источник данных (sources)
 * 
 * Endpoints:
 * GET    /api/reports              - Список всех докладов (полная иерархия)
 * POST   /api/reports              - Создать доклад
 * PUT    /api/reports/{id}         - Обновить доклад
 * DELETE /api/reports/{id}         - Удалить доклад
 * 
 * POST   /api/sections             - Создать раздел
 * PUT    /api/sections/{id}        - Обновить раздел
 * DELETE /api/sections/{id}        - Удалить раздел
 * 
 * POST   /api/notes                - Создать справку
 * PUT    /api/notes/{id}           - Обновить справку
 * DELETE /api/notes/{id}           - Удалить справку
 * 
 * POST   /api/noteBlocks           - Создать блок справки
 * PUT    /api/noteBlocks/{id}      - Обновить блок справки
 * DELETE /api/noteBlocks/{id}      - Удалить блок справки
 * 
 * POST   /api/indicators           - Создать показатель
 * PUT    /api/indicators/{id}      - Обновить показатель
 * DELETE /api/indicators/{id}      - Удалить показатель
 * 
 * POST   /api/slices               - Создать разрез
 * PUT    /api/slices/{id}          - Обновить разрез
 * DELETE /api/slices/{id}          - Удалить разрез
 * 
 * POST   /api/sources              - Создать источник
 * PUT    /api/sources/{id}         - Обновить источник
 * DELETE /api/sources/{id}         - Удалить источник
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/Database.php';

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Извлекаем часть после /api/
if (preg_match('/\/api\/(.*)$/', $path, $matches)) {
    $path = $matches[1];
} else {
    $path = '';
}

$segments = array_values(array_filter(explode('/', trim($path, '/'))));

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;

// Get JSON body
$input = json_decode(file_get_contents('php://input'), true);

$db = Database::getConnection();

try {
    switch ($resource) {
        case 'reports':
            handleReports($db, $method, $id, $input);
            break;
        case 'sections':
            handleSections($db, $method, $id, $input);
            break;
        case 'notes':
            handleNotes($db, $method, $id, $input);
            break;
        case 'noteSources':
            handleNoteSources($db, $method, $id, $input);
            break;
        case 'noteBlocks':
            handleNoteBlocks($db, $method, $id, $input);
            break;
        case 'indicators':
            handleIndicators($db, $method, $id, $input);
            break;
        case 'slices':
            handleSlices($db, $method, $id, $input);
            break;
        case 'sources':
            handleSources($db, $method, $id, $input);
            break;
        case 'import':
            if ($method === 'POST') {
                handleImport($db, $input);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================================
// Reports handlers (Уровень 1)
// ============================================================
function handleReports(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'GET':
            try {
                if ($id) {
                    $stmt = $db->prepare("SELECT * FROM reports WHERE id = ?");
                    $stmt->execute([$id]);
                    $report = $stmt->fetch();
                    if ($report) {
                        $report['sections'] = getSectionsForReport($db, $id);
                    }
                    echo json_encode($report ?: ['error' => 'Not found']);
                } else {
                    $stmt = $db->query("SELECT * FROM reports ORDER BY created_at");
                    $reports = $stmt->fetchAll();
                    foreach ($reports as &$report) {
                        try {
                            $report['sections'] = getSectionsForReport($db, $report['id']);
                        } catch (Exception $e) {
                            error_log("Error loading sections for report {$report['id']}: " . $e->getMessage());
                            $report['sections'] = [];
                        }
                    }
                    echo json_encode($reports);
                }
            } catch (Exception $e) {
                error_log("Error in handleReports GET: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to load reports: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO reports (id, name, description) VALUES (?, ?, ?)");
            $stmt->execute([$newId, $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId, 'name' => $input['name']]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE reports SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM reports WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSectionsForReport(PDO $db, string $reportId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order");
        $stmt->execute([$reportId]);
        $sections = $stmt->fetchAll();
        
        foreach ($sections as &$section) {
            try {
                $section['notes'] = getNotesForSection($db, $section['id']);
            } catch (Exception $e) {
                error_log("Error loading notes for section {$section['id']}: " . $e->getMessage());
                $section['notes'] = [];
            }
        }
        
        return $sections;
    } catch (Exception $e) {
        error_log("Error in getSectionsForReport: " . $e->getMessage());
        return [];
    }
}

// ============================================================
// Sections handlers (Уровень 2)
// ============================================================
function handleSections(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO sections (id, report_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['report_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE sections SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM sections WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

function getNotesForSection(PDO $db, string $sectionId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM notes WHERE section_id = ? ORDER BY sort_order");
        $stmt->execute([$sectionId]);
        $notes = $stmt->fetchAll();
        
        foreach ($notes as &$note) {
            try {
                // Используем snake_case для совместимости с фронтендом
                $note['note_blocks'] = getNoteBlocksForNote($db, $note['id']);
                $note['indicators'] = getIndicatorsForNote($db, $note['id']);
                $note['sources'] = getSourcesForNote($db, $note['id']);
            } catch (Exception $e) {
                error_log("Error loading note data for note {$note['id']}: " . $e->getMessage());
                $note['note_blocks'] = [];
                $note['indicators'] = [];
                $note['sources'] = [];
            }
        }
        
        return $notes;
    } catch (Exception $e) {
        error_log("Error in getNotesForSection: " . $e->getMessage());
        return [];
    }
}

function getNoteBlocksForNote(PDO $db, string $noteId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM note_blocks WHERE note_id = ? ORDER BY sort_order");
        $stmt->execute([$noteId]);
        $noteBlocks = $stmt->fetchAll();
        
        foreach ($noteBlocks as &$noteBlock) {
            try {
                // Используем snake_case для совместимости с фронтендом
                $noteBlock['indicators'] = getIndicatorsForNoteBlock($db, $noteBlock['id']);
            } catch (Exception $e) {
                error_log("Error loading indicators for noteBlock {$noteBlock['id']}: " . $e->getMessage());
                $noteBlock['indicators'] = [];
            }
        }
        
        return $noteBlocks;
    } catch (Exception $e) {
        error_log("Error in getNoteBlocksForNote: " . $e->getMessage());
        return [];
    }
}

function getIndicatorsForNoteBlock(PDO $db, string $noteBlockId): array {
    try {
        // Используем таблицу note_block_indicators, а не indicators
        $stmt = $db->prepare("SELECT * FROM note_block_indicators WHERE note_block_id = ? ORDER BY sort_order");
        $stmt->execute([$noteBlockId]);
        $indicators = $stmt->fetchAll();
        
        foreach ($indicators as &$indicator) {
            try {
                $indicator['slices'] = getSlicesForNoteBlockIndicator($db, $indicator['id']);
            } catch (Exception $e) {
                error_log("Error loading slices for noteBlockIndicator {$indicator['id']}: " . $e->getMessage());
                $indicator['slices'] = [];
            }
        }
        
        return $indicators;
    } catch (Exception $e) {
        error_log("Error in getIndicatorsForNoteBlock: " . $e->getMessage());
        return [];
    }
}

function getSlicesForNoteBlockIndicator(PDO $db, string $indicatorId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM note_block_data_slices WHERE indicator_id = ? ORDER BY sort_order");
        $stmt->execute([$indicatorId]);
        $slices = $stmt->fetchAll();
        
        foreach ($slices as &$slice) {
            try {
                $slice['sources'] = getSourcesForSlice($db, $slice['id']);
            } catch (Exception $e) {
                error_log("Error loading sources for slice {$slice['id']}: " . $e->getMessage());
                $slice['sources'] = [];
            }
        }
        
        return $slices;
    } catch (Exception $e) {
        error_log("Error in getSlicesForNoteBlockIndicator: " . $e->getMessage());
        return [];
    }
}



function getSourcesForNote(PDO $db, string $noteId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM note_sources WHERE note_id = ? ORDER BY sort_order");
        $stmt->execute([$noteId]);
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Error in getSourcesForNote: " . $e->getMessage());
        return [];
    }
}

// ============================================================
// Notes handlers (Уровень 3)
// ============================================================
function handleNotes(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO notes (id, section_id, name, short_name, description) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['section_id'], $input['name'], $input['short_name'] ?? null, $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE notes SET name = ?, short_name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['short_name'] ?? null, $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM notes WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Note Sources handlers (Уровень 4 - напрямую в справке)
// ============================================================
function handleNoteSources(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO note_sources (id, note_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_sources SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM note_sources WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Note Blocks handlers (Уровень 4 - необязательный)
// ============================================================
function handleNoteBlocks(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO note_blocks (id, note_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_blocks SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM note_blocks WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

function getIndicatorsForNote(PDO $db, string $noteId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM indicators WHERE note_id = ? ORDER BY sort_order");
        $stmt->execute([$noteId]);
        $indicators = $stmt->fetchAll();
        
        foreach ($indicators as &$indicator) {
            try {
                $indicator['slices'] = getSlicesForIndicator($db, $indicator['id']);
            } catch (Exception $e) {
                error_log("Error loading slices for indicator {$indicator['id']}: " . $e->getMessage());
                $indicator['slices'] = [];
            }
        }
        
        return $indicators;
    } catch (Exception $e) {
        error_log("Error in getIndicatorsForNote: " . $e->getMessage());
        return [];
    }
}

// ============================================================
// Indicators handlers (Уровень 4)
// ============================================================
function handleIndicators(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO indicators (id, note_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE indicators SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM indicators WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSlicesForIndicator(PDO $db, string $indicatorId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM data_slices WHERE indicator_id = ? ORDER BY sort_order");
        $stmt->execute([$indicatorId]);
        $slices = $stmt->fetchAll();
        
        foreach ($slices as &$slice) {
            try {
                $slice['sources'] = getSourcesForSlice($db, $slice['id']);
            } catch (Exception $e) {
                error_log("Error loading sources for slice {$slice['id']}: " . $e->getMessage());
                $slice['sources'] = [];
            }
        }
        
        return $slices;
    } catch (Exception $e) {
        error_log("Error in getSlicesForIndicator: " . $e->getMessage());
        return [];
    }
}

// ============================================================
// Slices handlers (Уровень 5)
// ============================================================
function handleSlices(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO data_slices (id, indicator_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['indicator_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE data_slices SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM data_slices WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSourcesForSlice(PDO $db, string $sliceId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM data_sources WHERE slice_id = ? ORDER BY sort_order");
        $stmt->execute([$sliceId]);
        $sources = $stmt->fetchAll();
        
        // Decode source_types JSON
        foreach ($sources as &$source) {
            if (isset($source['source_types']) && $source['source_types']) {
                $decoded = json_decode($source['source_types'], true);
                $source['source_types'] = $decoded !== null ? $decoded : [];
            } else {
                $source['source_types'] = [];
            }
        }
        
        return $sources;
    } catch (Exception $e) {
        error_log("Error in getSourcesForSlice: " . $e->getMessage());
        return [];
    }
}

// ============================================================
// Sources handlers (Уровень 6)
// ============================================================
function handleSources(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            $stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description, source_types) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['slice_id'], $input['name'], $input['description'] ?? null, $sourceTypes]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            // Логирование входных данных для отладки
            error_log("Updating source ID: $id");
            error_log("Input data: " . json_encode($input));
            
            // Валидация обязательных полей
            if (!isset($input['name']) || empty($input['name'])) {
                error_log("Error updating source: name is required");
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                return;
            }
            
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            error_log("Source types to save: " . $sourceTypes);
            
            $stmt = $db->prepare("UPDATE data_sources SET name = ?, description = ?, source_types = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $sourceTypes, $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("DELETE FROM data_sources WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Import handler - полная замена всех данных
// ============================================================
function handleImport(PDO $db, array $input): void {
    error_log("=== handleImport called ===");
    
    if (!isset($input['reports']) || !is_array($input['reports'])) {
        error_log("Invalid import data: reports not set or not array");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid import data']);
        return;
    }
    
    $reports = $input['reports'];
    error_log("Importing " . count($reports) . " reports");
    
    // Логируем структуру первого источника для проверки source_types
    foreach ($reports as $report) {
        if (isset($report['sections']) && is_array($report['sections'])) {
            foreach ($report['sections'] as $section) {
                if (isset($section['notes']) && is_array($section['notes'])) {
                    foreach ($section['notes'] as $note) {
                        if (isset($note['indicators']) && is_array($note['indicators'])) {
                            foreach ($note['indicators'] as $indicator) {
                                if (isset($indicator['slices']) && is_array($indicator['slices'])) {
                                    foreach ($indicator['slices'] as $slice) {
                                        if (isset($slice['sources']) && is_array($slice['sources']) && count($slice['sources']) > 0) {
                                            $firstSource = $slice['sources'][0];
                                            error_log("First source structure: " . json_encode($firstSource));
                                            error_log("Source types: " . json_encode($firstSource['source_types'] ?? 'NOT SET'));
                                            break 5;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    try {
        $db->beginTransaction();
        
        // Очищаем все таблицы в правильном порядке (от дочерних к родительским)
        $db->exec("DELETE FROM data_sources");
        $db->exec("DELETE FROM data_slices");
        $db->exec("DELETE FROM note_block_data_slices");
        $db->exec("DELETE FROM indicators");
        $db->exec("DELETE FROM note_block_indicators");
        $db->exec("DELETE FROM note_sources");
        $db->exec("DELETE FROM note_blocks");
        $db->exec("DELETE FROM notes");
        $db->exec("DELETE FROM sections");
        $db->exec("DELETE FROM reports");
        
        // Импортируем данные
        foreach ($reports as $reportIndex => $report) {
            error_log("Importing report $reportIndex: " . ($report['name'] ?? 'NO NAME'));
            
            // Валидация обязательных полей
            if (!isset($report['name']) || empty($report['name'])) {
                error_log("Warning: Report $reportIndex has no name, skipping");
                continue;
            }
            
            $reportId = $report['id'] ?? generateUUID();
            $stmt = $db->prepare("INSERT INTO reports (id, name, description) VALUES (?, ?, ?)");
            $stmt->execute([$reportId, $report['name'], $report['description'] ?? null]);
            
            if (isset($report['sections']) && is_array($report['sections'])) {
                foreach ($report['sections'] as $sectionIndex => $section) {
                    error_log("  Importing section $sectionIndex: " . ($section['name'] ?? 'NO NAME'));
                    
                    if (!isset($section['name']) || empty($section['name'])) {
                        error_log("  Warning: Section $sectionIndex has no name, skipping");
                        continue;
                    }
                    
                    $sectionId = $section['id'] ?? generateUUID();
                    $stmt = $db->prepare("INSERT INTO sections (id, report_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$sectionId, $reportId, $section['name'], $section['description'] ?? null, $section['sort_order'] ?? 0]);
                    
                    if (isset($section['notes']) && is_array($section['notes'])) {
                        foreach ($section['notes'] as $noteIndex => $note) {
                            if (!isset($note['name']) || empty($note['name'])) {
                                error_log("    Warning: Note $noteIndex has no name, skipping");
                                continue;
                            }
                            
                            $noteId = $note['id'] ?? generateUUID();
                            $stmt = $db->prepare("INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
                            $stmt->execute([$noteId, $sectionId, $note['name'], $note['short_name'] ?? null, $note['description'] ?? null, $note['sort_order'] ?? 0]);
                            
                            // Note sources
                            if (isset($note['sources'])) {
                                foreach ($note['sources'] as $source) {
                                    $sourceId = $source['id'] ?? generateUUID();
                                    $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                    $stmt = $db->prepare("INSERT INTO note_sources (id, note_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
                                    $stmt->execute([$sourceId, $noteId, $source['name'], $source['description'] ?? null, $sourceTypes, $source['sort_order'] ?? 0]);
                                }
                            }
                            
                            // Note blocks (поддержка обоих форматов: noteBlocks и note_blocks)
                            $noteBlocks = $note['noteBlocks'] ?? $note['note_blocks'] ?? [];
                            if (is_array($noteBlocks) && !empty($noteBlocks)) {
                                foreach ($noteBlocks as $noteBlock) {
                                    $noteBlockId = $noteBlock['id'] ?? generateUUID();
                                    $stmt = $db->prepare("INSERT INTO note_blocks (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                    $stmt->execute([$noteBlockId, $noteId, $noteBlock['name'], $noteBlock['description'] ?? null, $noteBlock['sort_order'] ?? 0]);
                                    
                                    if (isset($noteBlock['indicators'])) {
                                        foreach ($noteBlock['indicators'] as $indicator) {
                                            $indicatorId = $indicator['id'] ?? generateUUID();
                                            $stmt = $db->prepare("INSERT INTO note_block_indicators (id, note_block_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                            $stmt->execute([$indicatorId, $noteBlockId, $indicator['name'], $indicator['description'] ?? null, $indicator['sort_order'] ?? 0]);
                                            
                                            if (isset($indicator['slices'])) {
                                                foreach ($indicator['slices'] as $slice) {
                                                    $sliceId = $slice['id'] ?? generateUUID();
                                                    $stmt = $db->prepare("INSERT INTO note_block_data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                                    $stmt->execute([$sliceId, $indicatorId, $slice['name'], $slice['description'] ?? null, $slice['sort_order'] ?? 0]);
                                                    
                                                    if (isset($slice['sources'])) {
                                                        foreach ($slice['sources'] as $source) {
                                                            $sourceId = $source['id'] ?? generateUUID();
                                                            $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                                            error_log("Importing source: " . $source['name'] . ", source_types: " . $sourceTypes);
                                                            $stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
                                                            $stmt->execute([$sourceId, $sliceId, $source['name'], $source['description'] ?? null, $sourceTypes, $source['sort_order'] ?? 0]);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Indicators
                            if (isset($note['indicators'])) {
                                foreach ($note['indicators'] as $indicator) {
                                    $indicatorId = $indicator['id'] ?? generateUUID();
                                    $stmt = $db->prepare("INSERT INTO indicators (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                    $stmt->execute([$indicatorId, $noteId, $indicator['name'], $indicator['description'] ?? null, $indicator['sort_order'] ?? 0]);
                                    
                                    if (isset($indicator['slices'])) {
                                        foreach ($indicator['slices'] as $slice) {
                                            $sliceId = $slice['id'] ?? generateUUID();
                                            $stmt = $db->prepare("INSERT INTO data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                            $stmt->execute([$sliceId, $indicatorId, $slice['name'], $slice['description'] ?? null, $slice['sort_order'] ?? 0]);
                                            
                                            if (isset($slice['sources'])) {
                                                foreach ($slice['sources'] as $source) {
                                                    $sourceId = $source['id'] ?? generateUUID();
                                                    $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                                    error_log("Importing source: " . $source['name'] . ", source_types: " . $sourceTypes);
                                                    $stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
                                                    $stmt->execute([$sourceId, $sliceId, $source['name'], $source['description'] ?? null, $sourceTypes, $source['sort_order'] ?? 0]);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        $db->commit();
        error_log("=== Import completed successfully ===");
        echo json_encode(['success' => true, 'imported' => count($reports)]);
    } catch (Exception $e) {
        $db->rollBack();
        error_log("=== Import failed: " . $e->getMessage() . " ===");
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Import failed: ' . $e->getMessage()]);
    }
}

// ============================================================
// Helper functions
// ============================================================
function generateUUID(): string {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
