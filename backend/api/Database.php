<?php
/**
 * Database connection class
 * PostgreSQL PDO wrapper
 */

class Database {
    private static ?PDO $instance = null;
    
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $config = require __DIR__ . '/config.php';
            $db = $config['database'];
            
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s',
                $db['host'],
                $db['port'],
                $db['dbname']
            );
            
            try {
                self::$instance = new PDO($dsn, $db['user'], $db['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                // Устанавливаем заголовок если ещё не установлен
                if (!headers_sent()) {
                    header('Content-Type: application/json; charset=utf-8');
                }
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        
        return self::$instance;
    }
}
