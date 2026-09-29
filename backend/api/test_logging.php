<?php
/**
 * Диагностика логирования действий
 */

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/action_logger.php';

echo "<h1>Диагностика логирования действий</h1>";

// 1. Проверка директории
echo "<h2>1. Проверка директории</h2>";
echo "<p>Директория: " . __DIR__ . "</p>";
echo "<p>Существует: " . (is_dir(__DIR__) ? '✅ Да' : '❌ Нет') . "</p>";
echo "<p>Доступна для записи: " . (is_writable(__DIR__) ? '✅ Да' : '❌ Нет') . "</p>";

// 2. Проверка файла actions.log
echo "<h2>2. Проверка файла actions.log</h2>";
$logFile = __DIR__ . '/actions.log';
echo "<p>Путь к файлу: $logFile</p>";
echo "<p>Файл существует: " . (file_exists($logFile) ? '✅ Да' : '❌ Нет') . "</p>";

if (file_exists($logFile)) {
    echo "<p>Доступен для чтения: " . (is_readable($logFile) ? '✅ Да' : '❌ Нет') . "</p>";
    echo "<p>Доступен для записи: " . (is_writable($logFile) ? '✅ Да' : '❌ Нет') . "</p>";
    echo "<p>Размер: " . filesize($logFile) . " байт</p>";
    
    echo "<h3>Последние 10 записей:</h3>";
    echo "<pre style=\"background:#f0f0f0; padding:10px; border:1px solid #ccc;\">";
    $lines = file($logFile);
    $lastLines = array_slice($lines, -10);
    foreach ($lastLines as $line) {
        echo htmlspecialchars($line);
    }
    echo "</pre>";
}

// 3. Тестовая запись
echo "<h2>3. Тестовая запись</h2>";
$testResult = logAction('test', 'diagnostic', 'test-id-' . time(), 'Test Entry', 'Это тестовая запись для проверки работы логирования');

if ($testResult) {
    echo "<p style=\"color:green\">✅ Тестовая запись успешна!</p>";
} else {
    echo "<p style=\"color:red\">❌ Ошибка при записи!</p>";
}

// 4. Проверка после записи
echo "<h2>4. Проверка после записи</h2>";
echo "<p>Файл существует: " . (file_exists($logFile) ? '✅ Да' : '❌ Нет') . "</p>";

if (file_exists($logFile)) {
    echo "<p>Размер: " . filesize($logFile) . " байт</p>";
    
    echo "<h3>Последняя запись:</h3>";
    echo "<pre style=\"background:#f0f0f0; padding:10px; border:1px solid #ccc;\">";
    $lines = file($logFile);
    if (!empty($lines)) {
        echo htmlspecialchars(end($lines));
    }
    echo "</pre>";
}

// 5. Рекомендации
echo "<h2>5. Рекомендации</h2>";
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

if (is_writable(__DIR__) && (!file_exists($logFile) || is_writable($logFile))) {
    echo "<li style=\"color:green\"><strong>Всё в порядке:</strong> Логирование должно работать корректно</li>";
}

echo "</ul>";

echo "<hr>";
echo "<p><em>Диагностика завершена. Проверьте логи Apache (C:/web/Apache24/logs/error.log) для получения дополнительной информации.</em></p>";
