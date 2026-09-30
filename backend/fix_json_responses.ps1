# Скрипт для замены echo json_encode на sendJsonResponse в index.php
$file = "C:\web\sites\DataSources\api\index.php"

# Читаем файл
$content = Get-Content $file -Raw -Encoding UTF8

# Заменяем все echo json_encode на sendJsonResponse
$content = $content -replace 'echo json_encode\(', 'sendJsonResponse('

# Заменяем http_response_code + sendJsonResponse на sendJsonError
$content = $content -replace "http_response_code\(500\);\s*\r?\n\s*sendJsonResponse\(\['error' => ", "sendJsonError('"
$content = $content -replace "http_response_code\(405\);\s*\r?\n\s*sendJsonResponse\(\['error' => ", "sendJsonError('"
$content = $content -replace "http_response_code\(404\);\s*\r?\n\s*sendJsonResponse\(\['error' => ", "sendJsonError('"
$content = $content -replace "http_response_code\(400\);\s*\r?\n\s*sendJsonResponse\(\['error' => ", "sendJsonError('"

# Сохраняем файл
Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "Замена завершена в файле $file"
