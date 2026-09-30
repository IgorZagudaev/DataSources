<?php
/**
 * Endpoint для получения информации о правах пользователя
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/access_control.php';

echo json_encode(getUserPermissions());
