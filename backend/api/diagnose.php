<?php
/**
 * Диагностика работы API
 */

header('Content-Type: application/json; charset=utf-8');

try {
    // Проверка подключения config.php
    $config = require __DIR__ . '/config.php';
    
    // Проверка подключения Database.php
    require_once __DIR__ . '/Database.php';
    
    // Проверка подключения к БД
    $db = Database::getConnection();
    
    // Проверка запроса к БД
    $stmt = $db->query("SELECT COUNT(*) as count FROM reports");
    $result = $stmt->fetch();
    
    echo json_encode([
        'status' => 'ok',
        'config_loaded' => true,
        'database_connected' => true,
        'reports_count' => $result['count'],
        'default_mode' => $config['app']['default_mode'] ?? 'not set',
        'admin_ips' => $config['app']['admin_ips'] ?? [],
        'your_ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Error $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
