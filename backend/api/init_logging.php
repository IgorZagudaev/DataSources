<?php
/**
 * Инициализация файла логов действий
 */

header('Content-Type: text/html; charset=utf-8');

$logFile = __DIR__ . '/actions.log';

echo "<h1>Инициализация файла логов</h1>";

// 1. Проверка директории
echo "<h2>1. Проверка директории</h2>";
echo "<p>Директория: " . __DIR__ . "</p>";
echo "<p>Существует: " . (is_dir(__DIR__) ? '✅ Да' : '❌ Нет') . "</p>";
echo "<p>Доступна для записи: " . (is_writable(__DIR__) ? '✅ Да' : '❌ Нет') . "</p>";

// 2. Создание файла если его нет
echo "<h2>2. Создание файла actions.log</h2>";
if (!file_exists($logFile)) {
    echo "<p>Файл не существует, создаём...</p>";
    if (touch($logFile)) {
        echo "<p style=\"color:green\">✅ Файл создан успешно</p>";
    } else {
        echo "<p style=\"color:red\">❌ Не удалось создать файл</p>";
        echo "<p>Ошибка: " . error_get_last()['message'] . "</p>";
    }
} else {
    echo "<p style=\"color:green\">✅ Файл уже существует</p>";
}

// 3. Проверка прав
echo "<h2>3. Проверка прав доступа</h2>";
echo "<p>Файл доступен для чтения: " . (is_readable($logFile) ? '✅ Да' : '❌ Нет') . "</p>";
echo "<p>Файл доступен для записи: " . (is_writable($logFile) ? '✅ Да' : '❌ Нет') . "</p>";

// 4. Тестовая запись
echo "<h2>4. Тестовая запись</h2>";
require_once __DIR__ . '/action_logger.php';

$testResult = logAction('test', 'initialization', 'init-' . time(), 'Test Entry', 'Инициализация файла логов');

if ($testResult) {
    echo "<p style=\"color:green\">✅ Тестовая запись успешна!</p>";
} else {
    echo "<p style=\"color:red\">❌ Ошибка при записи!</p>";
}

// 5. Проверка содержимого
echo "<h2>5. Содержимое файла</h2>";
if (file_exists($logFile) && filesize($logFile) > 0) {
    echo "<p>Размер файла: " . filesize($logFile) . " байт</p>";
    echo "<pre style=\"background:#f0f0f0; padding:10px; border:1px solid #ccc;\">";
    $content = file_get_contents($logFile);
    echo htmlspecialchars($content);
    echo "</pre>";
} else {
    echo "<p style=\"color:orange\">⚠️ Файл пуст или не существует</p>";
}

// 6. Рекомендации
echo "<h2>6. Рекомендации</h2>";
echo "<ul>";

if (!is_writable($logFile)) {
    echo "<li style=\"color:red\"><strong>Проблема:</strong> Файл не доступен для записи</li>";
    echo "<li><strong>Решение для Windows:</strong></li>";
    echo "<li><code>icacls \"$logFile\" /grant \"Все:F\"</code></li>";
    echo "<li><strong>Решение для Linux:</strong></li>";
    echo "<li><code>chmod 664 $logFile</code></li>";
    echo "<li><code>chown www-data:www-data $logFile</code></li>";
}

if (!is_writable(__DIR__)) {
    echo "<li style=\"color:red\"><strong>Проблема:</strong> Директория не доступна для записи</li>";
    echo "<li><strong>Решение для Windows:</strong></li>";
    echo "<li><code>icacls \"" . __DIR__ . "\" /grant \"Все:(OI)(CI)F\"</code></li>";
    echo "<li><strong>Решение для Linux:</strong></li>";
    echo "<li><code>chmod 775 " . __DIR__ . "</code></li>";
    echo "<li><code>chown www-data:www-data " . __DIR__ . "</code></li>";
}

if (is_writable($logFile) && is_writable(__DIR__)) {
    echo "<li style=\"color:green\"><strong>Всё в порядке:</strong> Файл готов к использованию</li>";
}

echo "</ul>";

echo "<hr>";
echo "<p><em>Инициализация завершена. Теперь выполните любое действие в приложении и проверьте файл actions.log</em></p>";
