<?php
/**
 * Система логирования действий пользователей
 */

// Получаем IP-адрес пользователя
function getUserIP() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Запись действия в лог
 * 
 * @param string $action Тип действия (add, edit, delete)
 * @param string $entityType Тип сущности (report, section, note, etc.)
 * @param string $entityId ID сущности
 * @param string $entityName Название сущности
 * @param string $details Дополнительные детали (что было изменено)
 */
function logAction($action, $entityType, $entityId, $entityName, $details = '') {
    $logFile = __DIR__ . '/actions.log';
    
    try {
        $ip = getUserIP();
        $timestamp = date('Y-m-d H:i:s');
        
        // Формируем строку лога
        $actionText = [
            'add' => 'Добавление',
            'edit' => 'Редактирование',
            'delete' => 'Удаление'
        ];
        
        $actionLabel = $actionText[$action] ?? $action;
        
        $logEntry = "[$timestamp] IP: $ip | Действие: $actionLabel | Тип: $entityType | ID: $entityId | Имя: $entityName";
        
        if (!empty($details)) {
            $logEntry .= " | Детали: $details";
        }
        
        $logEntry .= "\n";
        
        // Записываем в файл (создаст файл автоматически, если его нет)
        // Убираем @ чтобы видеть ошибки
        $result = file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        if ($result === false) {
            $error = error_get_last();
            error_log("Не удалось записать в actions.log: " . ($error['message'] ?? 'неизвестная ошибка'));
            error_log("Путь к файлу: $logFile");
            error_log("Директория существует: " . (is_dir(__DIR__) ? 'да' : 'нет'));
            error_log("Директория доступна для записи: " . (is_writable(__DIR__) ? 'да' : 'нет'));
            return false;
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Исключение в logAction: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        return false;
    }
}
