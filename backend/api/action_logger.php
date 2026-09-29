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
    
    // Отладочное логирование
    error_log("logAction вызван: action=$action, type=$entityType, id=$entityId, name=$entityName");
    error_log("Путь к файлу лога: $logFile");
    error_log("Директория существует: " . (is_dir(__DIR__) ? 'да' : 'нет'));
    error_log("Директория доступна для записи: " . (is_writable(__DIR__) ? 'да' : 'нет'));
    
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
        
        error_log("Запись лога: $logEntry");
        
        // Проверяем, существует ли файл, если нет - создаём
        if (!file_exists($logFile)) {
            error_log("Файл лога не существует, пытаемся создать");
            // Пытаемся создать файл
            if (!touch($logFile)) {
                error_log("Не удалось создать файл лога: $logFile");
                error_log("Ошибка: " . error_get_last()['message']);
                return false;
            }
            error_log("Файл лога создан успешно");
        }
        
        // Проверяем права на запись
        if (!is_writable($logFile)) {
            error_log("Файл лога недоступен для записи: $logFile");
            return false;
        }
        
        // Записываем в файл
        $result = file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        if ($result === false) {
            error_log("Ошибка записи в файл лога: $logFile");
            error_log("Ошибка: " . error_get_last()['message']);
            return false;
        }
        
        error_log("Запись в лог успешна, размер записи: $result байт");
        return true;
    } catch (Exception $e) {
        error_log("Исключение в logAction: " . $e->getMessage());
        return false;
    }
}
