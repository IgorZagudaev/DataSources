<?php
/**
 * Конфигурация подключения к базе данных PostgreSQL
 * Apache + PHP 8 + Windows Server 2008
 *
 * Значения по умолчанию. Локальные переопределения (пароль БД, режим работы,
 * список администраторов) держите в config.local.php — этот файл не попадает в git.
 */

$config = [
    'database' => [
        'host' => 'localhost',
        'port' => '5432',
        'dbname' => 'report_data_sources',
        'user' => 'postgres',
        'password' => 'your_password_here',
        'charset' => 'utf8',
    ],
    'app' => [
        'debug' => false,
        'cors_origins' => ['*'],
        'sql_logging' => true, // Включить/выключить логирование SQL запросов
        'default_mode' => 'local', // Режим по умолчанию: 'local' (localStorage) или 'api' (PostgreSQL)

        // Список IP-адресов с правами администратора (импорт, экспорт, сброс, редактирование)
        // ВНИМАНИЕ: значение '*' разрешает редактирование всем подряд — только как временная
        // мера в доверенной сети, пока не решён вопрос с определением IP (см. api/whoami.php)
        'admin_ips' => [
            '127.0.0.1',           // localhost
            '::1',                 // localhost IPv6
            '10.64.8.68',          // Пример: IP администратора
            // Добавьте сюда IP-адреса администраторов
        ],
    ]
];

// Локальные переопределения из config.local.php
$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
    $local = require $localFile;
    if (is_array($local)) {
        foreach ($local as $section => $values) {
            if (is_array($values) && isset($config[$section]) && is_array($config[$section])) {
                $config[$section] = array_merge($config[$section], $values);
            } else {
                $config[$section] = $values;
            }
        }
    }
}

return $config;
