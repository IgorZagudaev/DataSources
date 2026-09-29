<?php
/**
 * Получение конфигурации приложения
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$config = require __DIR__ . '/config.php';

echo json_encode([
    'default_mode' => $config['app']['default_mode'] ?? 'local',
    'sql_logging' => $config['app']['sql_logging'] ?? false,
    'debug' => $config['app']['debug'] ?? false
]);
