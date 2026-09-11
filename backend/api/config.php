<?php
/**
 * Конфигурация подключения к базе данных PostgreSQL
 * Apache + PHP 8 + Windows Server 2008
 */

return [
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
    ]
];
