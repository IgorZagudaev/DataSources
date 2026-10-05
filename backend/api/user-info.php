<?php
/**
 * Получение информации о пользователе
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/access_control.php';

// Возвращаем информацию о пользователе (getUserIP определён в access_control.php)
echo json_encode([
    'ip' => getUserIP(),
    'is_admin' => isAdmin(),
    'timestamp' => date('Y-m-d H:i:s')
], JSON_UNESCAPED_UNICODE);
