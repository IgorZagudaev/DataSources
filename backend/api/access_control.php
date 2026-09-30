<?php
/**
 * Система контроля доступа по IP-адресам
 */

// Получаем IP-адрес пользователя
function getUserIP() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// Проверка, является ли пользователь администратором
function isAdmin() {
    $config = require __DIR__ . '/config.php';
    $adminIps = $config['app']['admin_ips'] ?? [];
    $userIp = getUserIP();
    
    return in_array($userIp, $adminIps);
}

// Проверка прав доступа для административных операций
function requireAdmin() {
    if (!isAdmin()) {
        // Устанавливаем заголовок если ещё не установлен
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        http_response_code(403);
        echo json_encode([
            'error' => 'Доступ запрещён',
            'message' => 'У вашего IP-адреса нет прав для выполнения этой операции',
            'your_ip' => getUserIP()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Получение информации о правах пользователя
function getUserPermissions() {
    return [
        'is_admin' => isAdmin(),
        'ip' => getUserIP(),
        'can_edit' => isAdmin(),
        'can_import' => isAdmin(),
        'can_export' => isAdmin(),
        'can_delete' => isAdmin()
    ];
}
