<?php
/**
 * Получение информации о пользователе
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Получаем IP-адрес пользователя
function getUserIP() {
    // Проверяем заголовки прокси
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Может содержать несколько IP через запятую
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// Возвращаем информацию о пользователе
echo json_encode([
    'ip' => getUserIP(),
    'timestamp' => date('Y-m-d H:i:s')
]);
