<?php
/**
 * Диагностический скрипт для проверки системы логирования
 */

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Диагностика системы логирования</h1>";

// 1. Проверка текущей директории
echo "<h2>1. Информация о директории</h2>";
echo "<p>Текущая директория: " . __DIR__ . "</p>";
echo "<p>Директория существует: " . (is_dir(__DIR__) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
echo "<p>Директория доступна для чтения: " . (is_readable(__DIR__) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
echo "<p>Директория доступна для записи: " . (is_writable(__DIR__) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";

// 2. Проверка файла action_logger.php
echo "<h2>2. Проверка action_logger.php</h2>";
$loggerFile = __DIR__ . '/action_logger.php';
echo "<p>Файл существует: " . (file_exists($loggerFile) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
echo "<p>Файл доступен для чтения: " . (is_readable($loggerFile) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";

// 3. Подключение action_logger.php
echo "<h2>3. Подключение action_logger.php</h2>";
try {
    require_once $loggerFile;
    echo "<p>Файл подключен успешно: <span style=\"color:green\">ДА</span></p>";
} catch (Exception $e) {
    echo "<p>Ошибка подключения: <span style=\"color:red\">" . $e->getMessage() . "</span></p>";
}

// 4. Проверка функции logAction
echo "<h2>4. Проверка функции logAction</h2>";
if (function_exists('logAction')) {
    echo "<p>Функция logAction существует: <span style=\"color:green\">ДА</span></p>";
    
    // 5. Тестовая запись в лог
    echo "<h2>5. Тестовая запись в лог</h2>";
    $testResult = logAction('test', 'diagnostic', 'test-id', 'Test Entry', 'Это тестовая запись');
    
    if ($testResult) {
        echo "<p>Тестовая запись успешна: <span style=\"color:green\">ДА</span></p>";
    } else {
        echo "<p>Тестовая запись успешна: <span style=\"color:red\">НЕТ</span></p>";
    }
    
    // 6. Проверка файла actions.log
    echo "<h2>6. Проверка файла actions.log</h2>";
    $logFile = __DIR__ . '/actions.log';
    echo "<p>Путь к файлу: $logFile</p>";
    echo "<p>Файл существует: " . (file_exists($logFile) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
    
    if (file_exists($logFile)) {
        echo "<p>Файл доступен для чтения: " . (is_readable($logFile) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
        echo "<p>Файл доступен для записи: " . (is_writable($logFile) ? '<span style="color:green">ДА</span>' : '<span style="color:red">НЕТ</span>') . "</p>";
        echo "<p>Размер файла: " . filesize($logFile) . " байт</p>";
        
        echo "<h3>Последние 10 записей:</h3>";
        echo "<pre style=\"background:#f0f0f0; padding:10px; border:1px solid #ccc;\">";
        $lines = file($logFile);
        $lastLines = array_slice($lines, -10);
        foreach ($lastLines as $line) {
            echo htmlspecialchars($line);
        }
        echo "</pre>";
    }
} else {
    echo "<p>Функция logAction существует: <span style=\"color:red\">НЕТ</span></p>";
}

// 7. Информация о PHP
echo "<h2>7. Информация о PHP</h2>";
echo "<p>Версия PHP: " . phpversion() . "</p>";
echo "<p>Пользователь PHP: " . get_current_user() . "</p>";
echo "<p>Временная папка: " . sys_get_temp_dir() . "</p>";

// 8. Информация о правах
echo "<h2>8. Информация о правах</h2>";
echo "<p>UID процесса: " . getmyuid() . "</p>";
echo "<p>GID процесса: " . getmygid() . "</p>";

// 9. Рекомендации
echo "<h2>9. Рекомендации</h2>";
echo "<ul>";
if (!is_writable(__DIR__)) {
    echo "<li style=\"color:red\"><strong>Проблема:</strong> Директория не доступна для записи</li>";
    echo "<li><strong>Решение:</strong> Выполните команду: icacls \"" . __DIR__ . "\" /grant \"Пользователь:(OI)(CI)F\"</li>";
}
if (file_exists($logFile) && !is_writable($logFile)) {
    echo "<li style=\"color:red\"><strong>Проблема:</strong> Файл actions.log не доступен для записи</li>";
    echo "<li><strong>Решение:</strong> Выполните команду: icacls \"$logFile\" /grant \"Пользователь:(OI)(CI)F\"</li>";
}
if (!file_exists($logFile)) {
    echo "<li style=\"color:orange\"><strong>Внимание:</strong> Файл actions.log еще не создан</li>";
    echo "<li><strong>Решение:</strong> Выполните любое действие в приложении для создания файла</li>";
}
echo "</ul>";

echo "<hr>";
echo "<p><em>Диагностика завершена. Проверьте логи Apache (C:/web/Apache24/logs/error.log) для получения дополнительной информации.</em></p>";
