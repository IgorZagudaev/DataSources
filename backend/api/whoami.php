<?php
/**
 * Диагностика определения IP: почему интерфейс показывает «Только просмотр».
 *
 * Открыть в браузере: /DataSources/api/whoami.php
 * Пароли и прочие секреты не выводятся. После настройки файл можно удалить.
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/access_control.php';

$config = require __DIR__ . '/config.php';
$adminIps = $config['app']['admin_ips'] ?? [];

// Значения заголовков, влияющих на определение адреса
$sources = [];
foreach (array_merge(IP_SOURCES, ['HTTP_VIA', 'HTTP_X_FORWARDED_HOST', 'HTTP_X_FORWARDED_PROTO']) as $key) {
    if (array_key_exists($key, $_SERVER)) {
        $sources[$key] = $_SERVER[$key];
    }
}

$userIp = getUserIP();

echo json_encode([
    'ip' => $userIp,
    'is_admin' => isAdmin(),
    'ip_detected' => $userIp !== 'unknown',
    'remote_addr_present' => array_key_exists('REMOTE_ADDR', $_SERVER),
    'admin_ips' => $adminIps,
    'ip_sources' => $sources,
    'server' => [
        'SAPI' => php_sapi_name(),
        'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? null,
        'SERVER_ADDR' => $_SERVER['SERVER_ADDR'] ?? null,
        'SERVER_PORT' => $_SERVER['SERVER_PORT'] ?? null,
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? null,
        'HTTPS' => $_SERVER['HTTPS'] ?? null,
        'PHP_VERSION' => PHP_VERSION,
        'default_mode' => $config['app']['default_mode'] ?? null,
        'config_local_php_loaded' => is_file(__DIR__ . '/config.local.php'),
    ],
    'hint' => 'ip=unknown — сервер не передал адрес клиента (тогда смотрите ip_sources). ip вне admin_ips — добавьте его в config.php или config.local.php',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
