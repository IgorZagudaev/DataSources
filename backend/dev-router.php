<?php
/**
 * Маршрутизатор для встроенного сервера PHP (локальная разработка без Apache).
 *
 * Запуск:  .\start-api.ps1        (или php -S 127.0.0.1:8080 -t backend backend/dev-router.php)
 *
 * Повторяет правила .htaccess: любые запросы к /api/... (в том числе с префиксом
 * /DataSources, как в проде) уходят в api/index.php.
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Отдельные php-файлы в api/ (config-endpoint.php, permissions.php, user-info.php)
// отдаём напрямую — так же, как это делает backend/.htaccess для user-info и permissions
if (preg_match('#^(?:/DataSources)?/api/([A-Za-z0-9_\-]+\.php)$#', $path, $m)) {
    $file = __DIR__ . '/api/' . $m[1];
    if (is_file($file)) {
        require $file;
        return true;
    }
}

// Остальные запросы к API: /DataSources/api/... и /api/...
if (preg_match('#^(?:/DataSources)?/api(?:/|$)#', $path)) {
    require __DIR__ . '/api/index.php';
    return true;
}

// Существующие файлы (например, config-endpoint.php по прямому пути) отдаём как есть
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'error' => 'Not found (dev router)',
    'path' => $path,
    'hint' => 'Статику в режиме разработки отдаёт Vite: http://localhost:3000/DataSources/',
], JSON_UNESCAPED_UNICODE);
return true;
