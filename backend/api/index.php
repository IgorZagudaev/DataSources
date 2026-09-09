<?php
/**
 * REST API для справочника источников данных показателей
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
// Reports handlers
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
        $section['indicators'] = getIndicatorsForSection($db, $section['id']);
    }
    
    return $sections;
}

// ============================================================
// Sections handlers
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
    return $stmt->fetchAll();
}

function getIndicatorsForSection(PDO $db, string $sectionId): array {
    $stmt = $db->prepare("SELECT * FROM indicators WHERE section_id = ? ORDER BY sort_order");
    $stmt->execute([$sectionId]);
    $indicators = $stmt->fetchAll();
    
    foreach ($indicators as &$indicator) {
        $indicator['slices'] = getSlicesForIndicator($db, $indicator['id']);
    }
    
    return $indicators;
}

// ============================================================
// Notes handlers
// ============================================================
function handleNotes(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO notes (id, section_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['section_id'], $input['name'], $input['description'] ?? null]);
            echo json_encode(['id' => $newId]);
            break;
            
        case 'PUT':
            $stmt = $db->prepare("UPDATE notes SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? null, $id]);
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
// Indicators handlers
// ============================================================
function handleIndicators(PDO $db, string $method, ?string $id, ?array $input): void {
    switch ($method) {
        case 'POST':
            $newId = generateUUID();
            $stmt = $db->prepare("INSERT INTO indicators (id, section_id, name, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$newId, $input['section_id'], $input['name'], $input['description'] ?? null]);
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
// Slices handlers
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
// Sources handlers
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
