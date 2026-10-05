<?php
/**
 * Система контроля доступа по IP-адресам
 */

/**
 * Источники IP клиента в порядке приоритета.
 * Пустые значения пропускаются: за обратным прокси REMOTE_ADDR может прийти
 * пустым, тогда адрес ищем в заголовках прокси, и наоборот.
 */
const IP_SOURCES = [
    'HTTP_X_FORWARDED_FOR',
    'HTTP_X_REAL_IP',
    'HTTP_CLIENT_IP',
    'HTTP_X_CLIENT_IP',
    'HTTP_X_CLUSTER_CLIENT_IP',
    'REMOTE_ADDR',
];

/**
 * Приведение адреса к сравнимому виду:
 *  - ::ffff:10.64.8.68  → 10.64.8.68
 *  - 10.64.8.68:51234   → 10.64.8.68
 */
function normalizeIP(string $ip): string {
    $ip = trim($ip);

    if (stripos($ip, '::ffff:') === 0) {
        $v4 = substr($ip, 7);
        if (filter_var($v4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $v4;
        }
    }

    if (preg_match('/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/', $ip, $m)) {
        return $m[1];
    }

    return $ip;
}

// Получаем IP-адрес пользователя
function getUserIP(): string {
    foreach (IP_SOURCES as $key) {
        $value = $_SERVER[$key] ?? null;
        if (!is_string($value) || $value === '') {
            continue;
        }

        // X-Forwarded-For может содержать список: клиент, прокси1, прокси2
        foreach (explode(',', $value) as $candidate) {
            $ip = normalizeIP($candidate);
            if ($ip !== '' && strcasecmp($ip, 'unknown') !== 0) {
                return $ip;
            }
        }
    }

    return 'unknown';
}

// Проверка, является ли пользователь администратором
function isAdmin(): bool {
    $config = require __DIR__ . '/config.php';
    $adminIps = $config['app']['admin_ips'] ?? [];

    // Аварийный вариант: '*' разрешает редактирование всем
    // (см. предупреждение в config.php — только для доверенной сети)
    if (in_array('*', $adminIps, true)) {
        return true;
    }

    $userIp = getUserIP();

    foreach ($adminIps as $adminIp) {
        if (!is_string($adminIp)) {
            continue;
        }
        if (normalizeIP($adminIp) === $userIp) {
            return true;
        }
    }

    return false;
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
