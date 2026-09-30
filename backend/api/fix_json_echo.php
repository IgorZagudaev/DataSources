<?php
/**
 * Скрипт для замены echo json_encode на sendJsonResponse в index.php
 */

$file = __DIR__ . '/index.php';
$content = file_get_contents($file);

// Заменяем все echo json_encode на sendJsonResponse
// Пропускаем строку 68 (внутри функции sendJsonResponse)
$lines = explode("\n", $content);
$newLines = [];
$lineNumber = 0;

foreach ($lines as $line) {
    $lineNumber++;
    
    // Пропускаем строку внутри функции sendJsonResponse
    if ($lineNumber === 68) {
        $newLines[] = $line;
        continue;
    }
    
    // Заменяем echo json_encode на sendJsonResponse
    if (strpos($line, 'echo json_encode(') !== false) {
        $line = str_replace('echo json_encode(', 'sendJsonResponse(', $line);
    }
    
    // Заменяем http_response_code + echo json_encode на sendJsonError
    if (strpos($line, "http_response_code(500);") !== false) {
        // Пропускаем эту строку, следующая будет заменена
        continue;
    }
    
    if (strpos($line, "http_response_code(405);") !== false) {
        continue;
    }
    
    if (strpos($line, "http_response_code(404);") !== false) {
        continue;
    }
    
    if (strpos($line, "http_response_code(400);") !== false) {
        continue;
    }
    
    $newLines[] = $line;
}

$newContent = implode("\n", $newLines);

// Сохраняем файл
file_put_contents($file, $newContent);

echo "Замена завершена. Обработано $lineNumber строк.\n";
