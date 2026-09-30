<?php
/**
 * Простой тест API без буферизации
 */

// Включаем отображение ошибок для диагностики
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

try {
    // Подключаем базу данных
    require_once __DIR__ . '/Database.php';
    $db = Database::getConnection();
    
    // Простой запрос
    $stmt = $db->query("SELECT * FROM reports ORDER BY created_at");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'ok',
        'count' => count($reports),
        'reports' => $reports
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
} catch (Error $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}
