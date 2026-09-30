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
        'sql_logging' => true, // Включить/выключить логирование SQL запросов
        'default_mode' => 'local', // Режим по умолчанию: 'local' (localStorage) или 'api' (PostgreSQL)
        
        // Список IP-адресов с правами администратора (импорт, экспорт, сброс, редактирование)
        'admin_ips' => [
            '127.0.0.1',           // localhost
            '::1',                 // localhost IPv6
            '10.64.8.68',          // Пример: IP администратора
            // Добавьте сюда IP-адреса администраторов
        ],
    ]
];
