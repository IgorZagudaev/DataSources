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
$path = str_replace('/api/', '', $path);
$segments = explode('/', trim($path, '/'));

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
                    $report['sections'] = getSectionsForReport($db, $report['id']);
                }
                echo json_encode($reports);
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
    $stmt = $db->prepare("SELECT * FROM sections WHERE report_id = ? ORDER BY sort_order");
    $stmt->execute([$reportId]);
    $sections = $stmt->fetchAll();
    
    foreach ($sections as &$section) {
        $section['notes'] = getNotesForSection($db, $section['id']);
    }
    
    return $sections;
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
    $stmt = $db->prepare("SELECT * FROM notes WHERE section_id = ? ORDER BY sort_order");
    $stmt->execute([$sectionId]);
    $notes = $stmt->fetchAll();
    
    foreach ($notes as &$note) {
        $note['noteBlocks'] = getNoteBlocksForNote($db, $note['id']);
        $note['indicators'] = getIndicatorsForNote($db, $note['id']);
        $note['sources'] = getSourcesForNote($db, $note['id']);
    }
    
    return $notes;
}

function getNoteBlocksForNote(PDO $db, string $noteId): array {
    $stmt = $db->prepare("SELECT * FROM note_blocks WHERE note_id = ? ORDER BY sort_order");
    $stmt->execute([$noteId]);
    $noteBlocks = $stmt->fetchAll();
    
    foreach ($noteBlocks as &$noteBlock) {
        $noteBlock['indicators'] = getIndicatorsForNoteBlock($db, $noteBlock['id']);
    }
    
    return $noteBlocks;
}

function getIndicatorsForNoteBlock(PDO $db, string $noteBlockId): array {
    $stmt = $db->prepare("SELECT * FROM indicators WHERE note_block_id = ? ORDER BY sort_order");
    $stmt->execute([$noteBlockId]);
    $indicators = $stmt->fetchAll();
    
    foreach ($indicators as &$indicator) {
        $indicator['slices'] = getSlicesForIndicator($db, $indicator['id']);
    }
    
    return $indicators;
}



function getSourcesForNote(PDO $db, string $noteId): array {
    $stmt = $db->prepare("SELECT * FROM note_sources WHERE note_id = ? ORDER BY sort_order");
    $stmt->execute([$noteId]);
    return $stmt->fetchAll();
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
    $stmt = $db->prepare("SELECT * FROM indicators WHERE note_id = ? ORDER BY sort_order");
    $stmt->execute([$noteId]);
    $indicators = $stmt->fetchAll();
    
    foreach ($indicators as &$indicator) {
        $indicator['slices'] = getSlicesForIndicator($db, $indicator['id']);
    }
    
    return $indicators;
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
    $stmt = $db->prepare("SELECT * FROM data_slices WHERE indicator_id = ? ORDER BY sort_order");
    $stmt->execute([$indicatorId]);
    $slices = $stmt->fetchAll();
    
    foreach ($slices as &$slice) {
        $slice['sources'] = getSourcesForSlice($db, $slice['id']);
    }
    
    return $slices;
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
    $stmt = $db->prepare("SELECT * FROM data_sources WHERE slice_id = ? ORDER BY sort_order");
    $stmt->execute([$sliceId]);
    return $stmt->fetchAll();
}

// ============================================================
// Sources handlers (Уровень 6)
// ============================================================
function handleSources(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO data_sources (id, slice_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['slice_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE data_sources SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
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
