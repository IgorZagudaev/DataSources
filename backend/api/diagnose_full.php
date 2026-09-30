<?php
/**
 * Полная диагностика всех PHP файлов API
 */

// Включаем отображение ошибок
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Полная диагностика API</h1>";

// 1. Проверка синтаксиса всех файлов
echo "<h2>1. Проверка синтаксиса PHP файлов</h2>";
$files = [
    'index.php',
    'config.php',
    'Database.php',
    'access_control.php',
    'action_logger.php',
    'permissions.php',
    'user-info.php',
    'config-endpoint.php'
];

foreach ($files as $file) {
    $fullPath = __DIR__ . '/' . $file;
    if (file_exists($fullPath)) {
        $output = [];
        $return_var = 0;
        exec("php -l " . escapeshellarg($fullPath) . " 2>&1", $output, $return_var);
        
        if ($return_var === 0) {
            echo "<p style='color:green'>✅ $file - синтаксис OK</p>";
        } else {
            echo "<p style='color:red'>❌ $file - ОШИБКА СИНТАКСИСА</p>";
            echo "<pre>" . implode("\n", $output) . "</pre>";
        }
    } else {
        echo "<p style='color:orange'>⚠️ $file - файл не найден</p>";
    }
}

// 2. Проверка подключения файлов
echo "<h2>2. Проверка подключения файлов</h2>";

try {
    echo "<p>Подключаем config.php...</p>";
    $config = require __DIR__ . '/config.php';
    echo "<p style='color:green'>✅ config.php подключен</p>";
    echo "<p>default_mode: " . ($config['app']['default_mode'] ?? 'не установлен') . "</p>";
} catch (Error $e) {
    echo "<p style='color:red'>❌ Ошибка подключения config.php: " . $e->getMessage() . "</p>";
}

try {
    echo "<p>Подключаем Database.php...</p>";
    require_once __DIR__ . '/Database.php';
    echo "<p style='color:green'>✅ Database.php подключен</p>";
} catch (Error $e) {
    echo "<p style='color:red'>❌ Ошибка подключения Database.php: " . $e->getMessage() . "</p>";
}

try {
    echo "<p>Подключаем access_control.php...</p>";
    require_once __DIR__ . '/access_control.php';
    echo "<p style='color:green'>✅ access_control.php подключен</p>";
    echo "<p>Функция getUserIP() существует: " . (function_exists('getUserIP') ? 'да' : 'нет') . "</p>";
    echo "<p>Функция isAdmin() существует: " . (function_exists('isAdmin') ? 'да' : 'нет') . "</p>";
} catch (Error $e) {
    echo "<p style='color:red'>❌ Ошибка подключения access_control.php: " . $e->getMessage() . "</p>";
}

try {
    echo "<p>Подключаем action_logger.php...</p>";
    require_once __DIR__ . '/action_logger.php';
    echo "<p style='color:green'>✅ action_logger.php подключен</p>";
    echo "<p>Функция logAction() существует: " . (function_exists('logAction') ? 'да' : 'нет') . "</p>";
} catch (Error $e) {
    echo "<p style='color:red'>❌ Ошибка подключения action_logger.php: " . $e->getMessage() . "</p>";
}

// 3. Проверка подключения к БД
echo "<h2>3. Проверка подключения к базе данных</h2>";

try {
    $db = Database::getConnection();
    echo "<p style='color:green'>✅ Подключение к БД успешно</p>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM reports");
    $count = $stmt->fetchColumn();
    echo "<p>Количество докладов: $count</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Ошибка подключения к БД: " . $e->getMessage() . "</p>";
}

// 4. Проверка прав доступа
echo "<h2>4. Проверка прав доступа</h2>";

echo "<p>Ваш IP: " . getUserIP() . "</p>";
echo "<p>Вы администратор: " . (isAdmin() ? 'да' : 'нет') . "</p>";

// 5. Проверка записи в логи
echo "<h2>5. Проверка записи в логи</h2>";

$logFile = __DIR__ . '/actions.log';
if (is_writable(__DIR__)) {
    echo "<p style='color:green'>✅ Директория доступна для записи</p>";
    
    $result = logAction('test', 'diagnostic', 'test-id', 'Test Entry', 'Диагностика');
    if ($result) {
        echo "<p style='color:green'>✅ Запись в actions.log успешна</p>";
    } else {
        echo "<p style='color:red'>❌ Ошибка записи в actions.log</p>";
    }
} else {
    echo "<p style='color:red'>❌ Директория не доступна для записи</p>";
}

// 6. Проверка JSON вывода
echo "<h2>6. Проверка JSON вывода</h2>";

echo "<p>Тестовый JSON вывод:</p>";
header('Content-Type: application/json; charset=utf-8');
$testData = ['status' => 'ok', 'message' => 'Тест успешен'];
echo "<pre>" . json_encode($testData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "</pre>";

echo "<hr>";
echo "<h2>Результат</h2>";
echo "<p>Если все проверки прошли успешно, попробуйте открыть:</p>";
echo "<ul>";
echo "<li><a href='test_simple.php'>test_simple.php</a> - простой тест API</li>";
echo "<li><a href='permissions.php'>permissions.php</a> - проверка прав</li>";
echo "<li><a href='reports'>reports</a> - основной API (должен работать)</li>";
echo "</ul>";
