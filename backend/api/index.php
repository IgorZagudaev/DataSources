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

// Подключаем систему логирования
require_once __DIR__ . '/action_logger.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Функция логирования SQL запросов
function logSQL($sql, $params = [], $result = null, $error = null, $executionTime = null) {
    // Проверяем, включено ли логирование в конфигурации
    $config = require __DIR__ . '/config.php';
    if (!isset($config['app']['sql_logging']) || !$config['app']['sql_logging']) {
        return; // Логирование отключено
    }
    
    $logFile = __DIR__ . '/sql.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] SQL: $sql\n";
    
    if (!empty($params)) {
        $logEntry .= "  Params: " . json_encode($params, JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    if ($executionTime !== null) {
        $logEntry .= "  Execution time: " . number_format($executionTime * 1000, 2) . " ms\n";
    }
    
    if ($error) {
        $logEntry .= "  ERROR: $error\n";
    } elseif ($result !== null) {
        if (is_array($result)) {
            $logEntry .= "  Result: " . count($result) . " rows\n";
        } else {
            $logEntry .= "  Result: " . json_encode($result, JSON_UNESCAPED_UNICODE) . "\n";
        }
    }
    
    $logEntry .= str_repeat('-', 80) . "\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Обёртка для выполнения SQL запросов с замером времени
function executeSQL(PDO $db, string $sql, array $params = [], bool $fetchAll = false) {
    $startTime = microtime(true);
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $executionTime = microtime(true) - $startTime;
    
    if ($fetchAll) {
        $result = $stmt->fetchAll();
        logSQL($sql, $params, $result, null, $executionTime);
        return $result;
    } else {
        logSQL($sql, $params, ['success' => true], null, $executionTime);
        return $stmt;
    }
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
$action = $segments[2] ?? null; // Для обработки /move и других действий

// Get JSON body
$input = json_decode(file_get_contents('php://input'), true);

$db = Database::getConnection();

try {
    // Обработка move операций
    if ($action === 'move' && $method === 'PUT') {
        $direction = $input['direction'] ?? 'up';
        handleMove($db, $resource, $id, $direction);
    }
    // Обработка hierarchy операций (загрузка ветки иерархии)
    elseif ($action === 'hierarchy' && $method === 'GET') {
        handleGetHierarchy($db, $resource, $id);
    } else {
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
            case 'noteBlockIndicators':
                handleNoteBlockIndicators($db, $method, $id, $input);
                break;
            case 'noteBlockSlices':
                handleNoteBlockSlices($db, $method, $id, $input);
                break;
            case 'noteBlockSources':
                handleNoteBlockSources($db, $method, $id, $input);
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
                    $sql = "SELECT * FROM reports WHERE id = ?";
                    $startTime = microtime(true);
                    $stmt = $db->prepare($sql);
                    $stmt->execute([$id]);
                    $report = $stmt->fetch();
                    $executionTime = microtime(true) - $startTime;
                    logSQL($sql, [$id], $report, null, $executionTime);
                    if ($report) {
                        $report['sections'] = getSectionsForReport($db, $id);
                    }
                    echo json_encode($report ?: ['error' => 'Not found']);
                } else {
                    $sql = "SELECT * FROM reports ORDER BY created_at";
                    $startTime = microtime(true);
                    $stmt = $db->query($sql);
                    $reports = $stmt->fetchAll();
                    $executionTime = microtime(true) - $startTime;
                    logSQL($sql, [], $reports, null, $executionTime);
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
                logSQL("SELECT * FROM reports", [], null, $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to load reports: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            $newId = generateUUID();
            $nextOrder = (int)$db->query("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM reports")->fetchColumn();
            $sql = "INSERT INTO reports (id, name, description, sort_order) VALUES (?, ?, ?, ?)";
            $params = [$newId, $input['name'], $input['description'] ?? null, $nextOrder];
            logSQL($sql, $params);
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            logSQL($sql, $params, ['success' => true]);
            logAction('add', 'report', $newId, $input['name']);
            echo json_encode(['id' => $newId, 'name' => $input['name']]);
            break;
            
        case 'PUT':
            $sql = "UPDATE reports SET name = ?, description = ? WHERE id = ?";
            $params = [$input['name'], $input['description'] ?? null, $id];
            logSQL($sql, $params);
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            logSQL($sql, $params, ['success' => true]);
            logAction('edit', 'report', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            // Получаем имя доклада перед удалением для логирования
            $stmt = $db->prepare("SELECT name FROM reports WHERE id = ?");
            $stmt->execute([$id]);
            $report = $stmt->fetch();
            $reportName = $report ? $report['name'] : 'unknown';
            
            $sql = "DELETE FROM reports WHERE id = ?";
            logSQL($sql, [$id]);
            $stmt = $db->prepare($sql);
            $stmt->execute([$id]);
            logSQL($sql, [$id], ['success' => true]);
            logAction('delete', 'report', $id, $reportName);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSectionsForReport(PDO $db, string $reportId): array {
    try {
        $sql = "SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$reportId]);
        $sections = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$reportId], $sections, null, $executionTime);
        
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
        logSQL("SELECT * FROM sections WHERE report_id = ?", [$reportId], null, $e->getMessage(), 0);
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
            $nextOrder = getNextSortOrder($db, 'sections', 'report_id', $input['report_id']);
            $stmt = $db->prepare("INSERT INTO sections (id, report_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['report_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'section', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE sections SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'section', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM sections WHERE id = ?");
            $stmt->execute([$id]);
            $section = $stmt->fetch();
            $sectionName = $section ? $section['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM sections WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'section', $id, $sectionName);
            echo json_encode(['success' => true]);
            break;
    }
}

function getNotesForSection(PDO $db, string $sectionId): array {
    try {
        $sql = "SELECT * FROM notes WHERE section_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$sectionId]);
        $notes = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$sectionId], $notes, null, $executionTime);
        
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
        logSQL("SELECT * FROM notes WHERE section_id = ?", [$sectionId], null, $e->getMessage(), 0);
        return [];
    }
}

function getNoteBlocksForNote(PDO $db, string $noteId): array {
    try {
        $sql = "SELECT * FROM note_blocks WHERE note_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$noteId]);
        $noteBlocks = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$noteId], $noteBlocks, null, $executionTime);
        
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
        logSQL("SELECT * FROM note_blocks WHERE note_id = ?", [$noteId], null, $e->getMessage(), 0);
        return [];
    }
}

function getIndicatorsForNoteBlock(PDO $db, string $noteBlockId): array {
    try {
        // Используем таблицу note_block_indicators, а не indicators
        $sql = "SELECT * FROM note_block_indicators WHERE note_block_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$noteBlockId]);
        $indicators = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$noteBlockId], $indicators, null, $executionTime);
        
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
        logSQL("SELECT * FROM note_block_indicators WHERE note_block_id = ?", [$noteBlockId], null, $e->getMessage(), 0);
        return [];
    }
}

function getSlicesForNoteBlockIndicator(PDO $db, string $indicatorId): array {
    try {
        $sql = "SELECT * FROM note_block_data_slices WHERE indicator_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$indicatorId]);
        $slices = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$indicatorId], $slices, null, $executionTime);
        
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
        logSQL("SELECT * FROM note_block_data_slices WHERE indicator_id = ?", [$indicatorId], null, $e->getMessage(), 0);
        return [];
    }
}



function getSourcesForNote(PDO $db, string $noteId): array {
    try {
        $sql = "SELECT * FROM note_sources WHERE note_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$noteId]);
        $sources = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$noteId], $sources, null, $executionTime);
        
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
        error_log("Error in getSourcesForNote: " . $e->getMessage());
        logSQL("SELECT * FROM note_sources WHERE note_id = ?", [$noteId], null, $e->getMessage(), 0);
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
            $nextOrder = getNextSortOrder($db, 'notes', 'section_id', $input['section_id']);
            $stmt = $db->prepare("INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['section_id'], $input['name'], $input['short_name'] ?? null, $input['description'] ?? null, $nextOrder]);
            logAction('add', 'note', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE notes SET name = ?, short_name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['short_name'] ?? null, $input['description'] ?? null, $id]);
            logAction('edit', 'note', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM notes WHERE id = ?");
            $stmt->execute([$id]);
            $note = $stmt->fetch();
            $noteName = $note ? $note['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM notes WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'note', $id, $noteName);
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
            $nextOrder = getNextSortOrder($db, 'note_sources', 'note_id', $input['note_id']);
            $stmt = $db->prepare("INSERT INTO note_sources (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'noteSource', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_sources SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'noteSource', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM note_sources WHERE id = ?");
            $stmt->execute([$id]);
            $source = $stmt->fetch();
            $sourceName = $source ? $source['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM note_sources WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'noteSource', $id, $sourceName);
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
            $nextOrder = getNextSortOrder($db, 'note_blocks', 'note_id', $input['note_id']);
            $stmt = $db->prepare("INSERT INTO note_blocks (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'noteBlock', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_blocks SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'noteBlock', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM note_blocks WHERE id = ?");
            $stmt->execute([$id]);
            $block = $stmt->fetch();
            $blockName = $block ? $block['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM note_blocks WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'noteBlock', $id, $blockName);
            echo json_encode(['success' => true]);
            break;
    }
}

function getIndicatorsForNote(PDO $db, string $noteId): array {
    try {
        $sql = "SELECT * FROM indicators WHERE note_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$noteId]);
        $indicators = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$noteId], $indicators, null, $executionTime);
        
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
        logSQL("SELECT * FROM indicators WHERE note_id = ?", [$noteId], null, $e->getMessage(), 0);
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
            $nextOrder = getNextSortOrder($db, 'indicators', 'note_id', $input['note_id']);
            $stmt = $db->prepare("INSERT INTO indicators (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'indicator', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE indicators SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'indicator', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM indicators WHERE id = ?");
            $stmt->execute([$id]);
            $indicator = $stmt->fetch();
            $indicatorName = $indicator ? $indicator['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM indicators WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'indicator', $id, $indicatorName);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSlicesForIndicator(PDO $db, string $indicatorId): array {
    try {
        $sql = "SELECT * FROM data_slices WHERE indicator_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$indicatorId]);
        $slices = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$indicatorId], $slices, null, $executionTime);
        
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
        logSQL("SELECT * FROM data_slices WHERE indicator_id = ?", [$indicatorId], null, $e->getMessage(), 0);
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
            $nextOrder = getNextSortOrder($db, 'data_slices', 'indicator_id', $input['indicator_id']);
            $stmt = $db->prepare("INSERT INTO data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['indicator_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'slice', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE data_slices SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'slice', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM data_slices WHERE id = ?");
            $stmt->execute([$id]);
            $slice = $stmt->fetch();
            $sliceName = $slice ? $slice['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM data_slices WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'slice', $id, $sliceName);
            echo json_encode(['success' => true]);
            break;
    }
}

function getSourcesForSlice(PDO $db, string $sliceId): array {
    try {
        $sql = "SELECT * FROM data_sources WHERE slice_id = ? ORDER BY sort_order";
        $startTime = microtime(true);
        $stmt = $db->prepare($sql);
        $stmt->execute([$sliceId]);
        $sources = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        logSQL($sql, [$sliceId], $sources, null, $executionTime);
        
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
        logSQL("SELECT * FROM data_sources WHERE slice_id = ?", [$sliceId], null, $e->getMessage(), 0);
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
            $nextOrder = getNextSortOrder($db, 'data_sources', 'slice_id', $input['slice_id']);
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            $sql = "INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
            $params = [$newId, $input['slice_id'], $input['name'], $input['description'] ?? null, $sourceTypes, $nextOrder];
            logSQL($sql, $params);
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            logSQL($sql, $params, ['id' => $newId]);
            logAction('add', 'source', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            // Логирование входных данных для отладки (отключено)
            // error_log("Updating source ID: $id");
            // error_log("Input data: " . json_encode($input));
            
            // Валидация обязательных полей
            if (!isset($input['name']) || empty($input['name'])) {
                // error_log("Error updating source: name is required");
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                return;
            }
            
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            // error_log("Source types to save: " . $sourceTypes);
            
            $sql = "UPDATE data_sources SET name = ?, description = ?, source_types = ? WHERE id = ?";
            $params = [$input['name'], $input['description'] ?? null, $sourceTypes, $id];
            logSQL($sql, $params);
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            logSQL($sql, $params, ['success' => true]);
            logAction('edit', 'source', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM data_sources WHERE id = ?");
            $stmt->execute([$id]);
            $source = $stmt->fetch();
            $sourceName = $source ? $source['name'] : 'unknown';
            
            $sql = "DELETE FROM data_sources WHERE id = ?";
            logSQL($sql, [$id]);
            $stmt = $db->prepare($sql);
            $stmt->execute([$id]);
            logSQL($sql, [$id], ['success' => true]);
            logAction('delete', 'source', $id, $sourceName);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Import handler - полная замена всех данных
// ============================================================
function handleImport(PDO $db, array $input): void {
    // error_log("=== handleImport called ===");
    
    if (!isset($input['reports']) || !is_array($input['reports'])) {
        // error_log("Invalid import data: reports not set or not array");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid import data']);
        return;
    }
    
    $reports = $input['reports'];
    // error_log("Importing " . count($reports) . " reports");
    
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
                                            // error_log("First source structure: " . json_encode($firstSource));
                                            // error_log("Source types: " . json_encode($firstSource['source_types'] ?? 'NOT SET'));
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
        $deleteQueries = [
            "DELETE FROM data_sources",
            "DELETE FROM data_slices",
            "DELETE FROM note_block_data_slices",
            "DELETE FROM indicators",
            "DELETE FROM note_block_indicators",
            "DELETE FROM note_sources",
            "DELETE FROM note_blocks",
            "DELETE FROM notes",
            "DELETE FROM sections",
            "DELETE FROM reports"
        ];
        
        foreach ($deleteQueries as $sql) {
            logSQL($sql);
            $db->exec($sql);
            logSQL($sql, [], ['success' => true]);
        }
        
        // Импортируем данные
        foreach ($reports as $reportIndex => $report) {
            // error_log("Importing report $reportIndex: " . ($report['name'] ?? 'NO NAME'));
            
            // Валидация обязательных полей
            if (!isset($report['name']) || empty($report['name'])) {
                // error_log("Warning: Report $reportIndex has no name, skipping");
                continue;
            }
            
            $reportId = $report['id'] ?? generateUUID();
            $sql = "INSERT INTO reports (id, name, description) VALUES (?, ?, ?)";
            $params = [$reportId, $report['name'], $report['description'] ?? null];
            logSQL($sql, $params);
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            logSQL($sql, $params, ['success' => true]);
            
            if (isset($report['sections']) && is_array($report['sections'])) {
                foreach ($report['sections'] as $sectionIndex => $section) {
                    // error_log("  Importing section $sectionIndex: " . ($section['name'] ?? 'NO NAME'));
                    
                    if (!isset($section['name']) || empty($section['name'])) {
                        // error_log("  Warning: Section $sectionIndex has no name, skipping");
                        continue;
                    }
                    
                    $sectionId = $section['id'] ?? generateUUID();
                    $sql = "INSERT INTO sections (id, report_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)";
                    $params = [$sectionId, $reportId, $section['name'], $section['description'] ?? null, $section['sort_order'] ?? 0];
                    logSQL($sql, $params);
                    $stmt = $db->prepare($sql);
                    $stmt->execute($params);
                    logSQL($sql, $params, ['success' => true]);
                    
                    if (isset($section['notes']) && is_array($section['notes'])) {
                        foreach ($section['notes'] as $noteIndex => $note) {
                            if (!isset($note['name']) || empty($note['name'])) {
                                // error_log("    Warning: Note $noteIndex has no name, skipping");
                                continue;
                            }
                            
                            $noteId = $note['id'] ?? generateUUID();
                            $sql = "INSERT INTO notes (id, section_id, name, short_name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
                            $params = [$noteId, $sectionId, $note['name'], $note['short_name'] ?? null, $note['description'] ?? null, $noteIndex];
                            logSQL($sql, $params);
                            $stmt = $db->prepare($sql);
                            $stmt->execute($params);
                            logSQL($sql, $params, ['success' => true]);
                            
                            // Note sources
                            if (isset($note['sources'])) {
                                foreach ($note['sources'] as $sourceIndex => $source) {
                                    $sourceId = $source['id'] ?? generateUUID();
                                    $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                    $sql = "INSERT INTO note_sources (id, note_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
                                    $params = [$sourceId, $noteId, $source['name'], $source['description'] ?? null, $sourceTypes, $sourceIndex];
                                    logSQL($sql, $params);
                                    $stmt = $db->prepare($sql);
                                    $stmt->execute($params);
                                    logSQL($sql, $params, ['success' => true]);
                                }
                            }
                            
                            // Note blocks (поддержка обоих форматов: noteBlocks и note_blocks)
                            $noteBlocks = $note['noteBlocks'] ?? $note['note_blocks'] ?? [];
                            if (is_array($noteBlocks) && !empty($noteBlocks)) {
                                foreach ($noteBlocks as $noteBlockIndex => $noteBlock) {
                                    $noteBlockId = $noteBlock['id'] ?? generateUUID();
                                    $stmt = $db->prepare("INSERT INTO note_blocks (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                    $stmt->execute([$noteBlockId, $noteId, $noteBlock['name'], $noteBlock['description'] ?? null, $noteBlockIndex]);
                                    
                                    if (isset($noteBlock['indicators'])) {
                                        foreach ($noteBlock['indicators'] as $indicatorIndex => $indicator) {
                                            $indicatorId = $indicator['id'] ?? generateUUID();
                                            $stmt = $db->prepare("INSERT INTO note_block_indicators (id, note_block_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                            $stmt->execute([$indicatorId, $noteBlockId, $indicator['name'], $indicator['description'] ?? null, $indicatorIndex]);
                                            
                                            if (isset($indicator['slices'])) {
                                                foreach ($indicator['slices'] as $sliceIndex => $slice) {
                                                    $sliceId = $slice['id'] ?? generateUUID();
                                                    $stmt = $db->prepare("INSERT INTO note_block_data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                                    $stmt->execute([$sliceId, $indicatorId, $slice['name'], $slice['description'] ?? null, $sliceIndex]);
                                                    
                                                    if (isset($slice['sources'])) {
                                                        foreach ($slice['sources'] as $sourceIndex => $source) {
                                                            $sourceId = $source['id'] ?? generateUUID();
                                                            $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                                            // error_log("Importing source: " . $source['name'] . ", source_types: " . $sourceTypes);
                                                            $sql = "INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
                                                            $params = [$sourceId, $sliceId, $source['name'], $source['description'] ?? null, $sourceTypes, $sourceIndex];
                                                            logSQL($sql, $params);
                                                            $stmt = $db->prepare($sql);
                                                            $stmt->execute($params);
                                                            logSQL($sql, $params, ['success' => true]);
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
                                foreach ($note['indicators'] as $indicatorIndex => $indicator) {
                                    $indicatorId = $indicator['id'] ?? generateUUID();
                                    $stmt = $db->prepare("INSERT INTO indicators (id, note_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                    $stmt->execute([$indicatorId, $noteId, $indicator['name'], $indicator['description'] ?? null, $indicatorIndex]);
                                    
                                    if (isset($indicator['slices'])) {
                                        foreach ($indicator['slices'] as $sliceIndex => $slice) {
                                            $sliceId = $slice['id'] ?? generateUUID();
                                            $stmt = $db->prepare("INSERT INTO data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                                            $stmt->execute([$sliceId, $indicatorId, $slice['name'], $slice['description'] ?? null, $sliceIndex]);
                                            
                                            if (isset($slice['sources'])) {
                                                foreach ($slice['sources'] as $sourceIndex => $source) {
                                                    $sourceId = $source['id'] ?? generateUUID();
                                                    $sourceTypes = isset($source['source_types']) ? json_encode($source['source_types']) : null;
                                                    // error_log("Importing source: " . $source['name'] . ", source_types: " . $sourceTypes);
                                                    $sql = "INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)";
                                                    $params = [$sourceId, $sliceId, $source['name'], $source['description'] ?? null, $sourceTypes, $sourceIndex];
                                                    logSQL($sql, $params);
                                                    $stmt = $db->prepare($sql);
                                                    $stmt->execute($params);
                                                    logSQL($sql, $params, ['success' => true]);
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
        // error_log("=== Import completed successfully ===");
        echo json_encode(['success' => true, 'imported' => count($reports)]);
    } catch (Exception $e) {
        $db->rollBack();
        error_log("=== Import failed: " . $e->getMessage() . " ===");
        // error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Import failed: ' . $e->getMessage()]);
    }
}

// ============================================================
// Hierarchy handler - загрузка ветки иерархии для элемента
// ============================================================
function handleGetHierarchy(PDO $db, string $resource, ?string $id): void {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }
    
    try {
        $hierarchy = [];
        
        switch ($resource) {
            case 'reports':
                $report = getReportWithChildren($db, $id);
                echo json_encode($report);
                return;
                
            case 'sections':
                $section = getSectionWithChildren($db, $id);
                $report = getReport($db, $section['report_id']);
                $report['sections'] = [$section];
                echo json_encode($report);
                return;
                
            case 'notes':
                $note = getNoteWithChildren($db, $id);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'noteBlocks':
                $noteBlock = getNoteBlockWithChildren($db, $id);
                $note = getNoteWithChildren($db, $noteBlock['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'indicators':
                $indicator = getIndicatorWithChildren($db, $id);
                $note = getNoteWithChildren($db, $indicator['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'noteBlockIndicators':
                $indicator = getNoteBlockIndicatorWithChildren($db, $id);
                $noteBlock = getNoteBlockWithChildren($db, $indicator['note_block_id']);
                $note = getNoteWithChildren($db, $noteBlock['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'slices':
                $slice = getSliceWithChildren($db, $id);
                $indicator = getIndicatorWithChildren($db, $slice['indicator_id']);
                $note = getNoteWithChildren($db, $indicator['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'noteBlockSlices':
                $slice = getNoteBlockSliceWithChildren($db, $id);
                $indicator = getNoteBlockIndicatorWithChildren($db, $slice['indicator_id']);
                $noteBlock = getNoteBlockWithChildren($db, $indicator['note_block_id']);
                $note = getNoteWithChildren($db, $noteBlock['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'sources':
                $source = getSource($db, $id);
                $slice = getSliceWithChildren($db, $source['slice_id']);
                $indicator = getIndicatorWithChildren($db, $slice['indicator_id']);
                $note = getNoteWithChildren($db, $indicator['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'noteSources':
                $source = getNoteSource($db, $id);
                $note = getNoteWithChildren($db, $source['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            case 'noteBlockSources':
                $source = getSource($db, $id);
                $slice = getNoteBlockSliceWithChildren($db, $source['slice_id']);
                $indicator = getNoteBlockIndicatorWithChildren($db, $slice['indicator_id']);
                $noteBlock = getNoteBlockWithChildren($db, $indicator['note_block_id']);
                $note = getNoteWithChildren($db, $noteBlock['note_id']);
                $section = getSectionWithChildren($db, $note['section_id']);
                $report = getReportWithChildren($db, $section['report_id']);
                echo json_encode($report);
                return;
                
            default:
                http_response_code(404);
                echo json_encode(['error' => 'Resource not found']);
                return;
        }
    } catch (Exception $e) {
        error_log("Error in handleGetHierarchy: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load hierarchy: ' . $e->getMessage()]);
    }
}

// Helper функции для загрузки отдельных элементов
function getReport(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM reports WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getReportWithChildren(PDO $db, string $id): array {
    $report = getReport($db, $id);
    if ($report) {
        $report['sections'] = getSectionsForReport($db, $id);
    }
    return $report;
}

function getSection(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM sections WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getSectionWithChildren(PDO $db, string $id): array {
    $section = getSection($db, $id);
    if ($section) {
        $section['notes'] = getNotesForSection($db, $id);
    }
    return $section;
}

function getNote(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM notes WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getNoteWithChildren(PDO $db, string $id): array {
    $note = getNote($db, $id);
    if ($note) {
        $note['note_blocks'] = getNoteBlocksForNote($db, $id);
        $note['indicators'] = getIndicatorsForNote($db, $id);
        $note['sources'] = getSourcesForNote($db, $id);
    }
    return $note;
}

function getNoteBlock(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM note_blocks WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getNoteBlockWithChildren(PDO $db, string $id): array {
    $noteBlock = getNoteBlock($db, $id);
    if ($noteBlock) {
        $noteBlock['indicators'] = getIndicatorsForNoteBlock($db, $id);
    }
    return $noteBlock;
}

function getIndicator(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM indicators WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getIndicatorWithChildren(PDO $db, string $id): array {
    $indicator = getIndicator($db, $id);
    if ($indicator) {
        $indicator['slices'] = getSlicesForIndicator($db, $id);
    }
    return $indicator;
}

function getNoteBlockIndicator(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM note_block_indicators WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getNoteBlockIndicatorWithChildren(PDO $db, string $id): array {
    $indicator = getNoteBlockIndicator($db, $id);
    if ($indicator) {
        $indicator['slices'] = getSlicesForNoteBlockIndicator($db, $id);
    }
    return $indicator;
}

function getSlice(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM data_slices WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getSliceWithChildren(PDO $db, string $id): array {
    $slice = getSlice($db, $id);
    if ($slice) {
        $slice['sources'] = getSourcesForSlice($db, $id);
    }
    return $slice;
}

function getNoteBlockSlice(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM note_block_data_slices WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function getNoteBlockSliceWithChildren(PDO $db, string $id): array {
    $slice = getNoteBlockSlice($db, $id);
    if ($slice) {
        $slice['sources'] = getSourcesForSlice($db, $id);
    }
    return $slice;
}

function getSource(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM data_sources WHERE id = ?");
    $stmt->execute([$id]);
    $source = $stmt->fetch() ?: [];
    if ($source && isset($source['source_types'])) {
        $decoded = json_decode($source['source_types'], true);
        $source['source_types'] = $decoded !== null ? $decoded : [];
    }
    return $source;
}

function getNoteSource(PDO $db, string $id): array {
    $stmt = $db->prepare("SELECT * FROM note_sources WHERE id = ?");
    $stmt->execute([$id]);
    $source = $stmt->fetch() ?: [];
    if ($source && isset($source['source_types'])) {
        $decoded = json_decode($source['source_types'], true);
        $source['source_types'] = $decoded !== null ? $decoded : [];
    }
    return $source;
}

// ============================================================
// Move handler - перемещение элементов
// ============================================================
function handleMove(PDO $db, string $resource, ?string $id, string $direction): void {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }
    
    // Определяем таблицу и родительское поле по ресурсу
    $tableMap = [
        'reports' => ['table' => 'reports', 'parent_field' => null],
        'sections' => ['table' => 'sections', 'parent_field' => 'report_id'],
        'notes' => ['table' => 'notes', 'parent_field' => 'section_id'],
        'noteBlocks' => ['table' => 'note_blocks', 'parent_field' => 'note_id'],
        'indicators' => ['table' => 'indicators', 'parent_field' => 'note_id'],
        'noteBlockIndicators' => ['table' => 'note_block_indicators', 'parent_field' => 'note_block_id'],
        'slices' => ['table' => 'data_slices', 'parent_field' => 'indicator_id'],
        'noteBlockSlices' => ['table' => 'note_block_data_slices', 'parent_field' => 'indicator_id'],
        'sources' => ['table' => 'data_sources', 'parent_field' => 'slice_id'],
        'noteSources' => ['table' => 'note_sources', 'parent_field' => 'note_id'],
        'noteBlockSources' => ['table' => 'note_sources', 'parent_field' => 'note_block_id'],
    ];
    
    if (!isset($tableMap[$resource])) {
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found']);
        return;
    }
    
    $table = $tableMap[$resource]['table'];
    $parentField = $tableMap[$resource]['parent_field'];
    
    try {
        // Получаем текущий элемент
        $stmt = $db->prepare("SELECT * FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();
        
        if (!$item) {
            http_response_code(404);
            echo json_encode(['error' => 'Item not found']);
            return;
        }
        
        $currentOrder = $item['sort_order'];
        
        // Получаем все элементы того же уровня
        if ($parentField) {
            $parentId = $item[$parentField];
            $stmt = $db->prepare("SELECT id, sort_order FROM $table WHERE $parentField = ? ORDER BY sort_order");
            $stmt->execute([$parentId]);
        } else {
            $stmt = $db->query("SELECT id, sort_order FROM $table ORDER BY sort_order");
        }
        
        $items = $stmt->fetchAll();
        
        // Находим индекс текущего элемента
        $currentIndex = -1;
        foreach ($items as $index => $it) {
            if ($it['id'] === $id) {
                $currentIndex = $index;
                break;
            }
        }
        
        if ($currentIndex === -1) {
            http_response_code(404);
            echo json_encode(['error' => 'Item not found in list']);
            return;
        }
        
        // Определяем новый индекс
        $newIndex = $currentIndex;
        if ($direction === 'up' && $currentIndex > 0) {
            $newIndex = $currentIndex - 1;
        } elseif ($direction === 'down' && $currentIndex < count($items) - 1) {
            $newIndex = $currentIndex + 1;
        }
        
        // Если индекс не изменился, ничего не делаем
        if ($newIndex === $currentIndex) {
            echo json_encode(['success' => true, 'moved' => false]);
            return;
        }
        
        // Меняем местами элементы
        $db->beginTransaction();
        
        $itemId1 = $items[$currentIndex]['id'];
        $itemId2 = $items[$newIndex]['id'];
        $order1 = $items[$currentIndex]['sort_order'];
        $order2 = $items[$newIndex]['sort_order'];
        
        $stmt = $db->prepare("UPDATE $table SET sort_order = ? WHERE id = ?");
        $stmt->execute([$order2, $itemId1]);
        $stmt->execute([$order1, $itemId2]);
        
        $db->commit();
        
        logAction('move', $resource, $id, $item['name'] ?? 'unknown', "direction: $direction");
        
        echo json_encode(['success' => true, 'moved' => true]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Error in handleMove: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Move failed: ' . $e->getMessage()]);
    }
}

// ============================================================
// Note Block Indicators handlers
// ============================================================
function handleNoteBlockIndicators(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $nextOrder = getNextSortOrder($db, 'note_block_indicators', 'note_block_id', $input['note_block_id']);
            $stmt = $db->prepare("INSERT INTO note_block_indicators (id, note_block_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['note_block_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'noteBlockIndicator', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_block_indicators SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'noteBlockIndicator', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM note_block_indicators WHERE id = ?");
            $stmt->execute([$id]);
            $indicator = $stmt->fetch();
            $indicatorName = $indicator ? $indicator['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM note_block_indicators WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'noteBlockIndicator', $id, $indicatorName);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Note Block Slices handlers
// ============================================================
function handleNoteBlockSlices(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $nextOrder = getNextSortOrder($db, 'note_block_data_slices', 'indicator_id', $input['indicator_id']);
            $stmt = $db->prepare("INSERT INTO note_block_data_slices (id, indicator_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['indicator_id'], $input['name'], $input['description'] ?? null, $nextOrder]);
            logAction('add', 'noteBlockSlice', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE note_block_data_slices SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
            logAction('edit', 'noteBlockSlice', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM note_block_data_slices WHERE id = ?");
            $stmt->execute([$id]);
            $slice = $stmt->fetch();
            $sliceName = $slice ? $slice['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM note_block_data_slices WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'noteBlockSlice', $id, $sliceName);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Note Block Sources handlers
// ============================================================
function handleNoteBlockSources(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $nextOrder = getNextSortOrder($db, 'data_sources', 'slice_id', $input['slice_id']);
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            $stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description, source_types, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $input['slice_id'], $input['name'], $input['description'] ?? null, $sourceTypes, $nextOrder]);
            logAction('add', 'noteBlockSource', $newId, $input['name']);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $sourceTypes = isset($input['source_types']) ? json_encode($input['source_types']) : null;
            $stmt = $db->prepare("UPDATE data_sources SET name = ?, description = ?, source_types = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $sourceTypes, $id]);
            logAction('edit', 'noteBlockSource', $id, $input['name']);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $db->prepare("SELECT name FROM data_sources WHERE id = ?");
            $stmt->execute([$id]);
            $source = $stmt->fetch();
            $sourceName = $source ? $source['name'] : 'unknown';
            
            $stmt = $db->prepare("DELETE FROM data_sources WHERE id = ?");
            $stmt->execute([$id]);
            logAction('delete', 'noteBlockSource', $id, $sourceName);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================================
// Helper functions
// ============================================================

// Получение следующего sort_order для элемента
function getNextSortOrder(PDO $db, string $table, string $parentField, string $parentId): int {
    $stmt = $db->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM $table WHERE $parentField = ?");
    $stmt->execute([$parentId]);
    return (int)$stmt->fetchColumn();
}

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
