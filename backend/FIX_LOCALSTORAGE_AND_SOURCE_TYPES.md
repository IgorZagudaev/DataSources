# Исправление проблем с localStorage и source_types

## Проблемы

### 1. QuotaExceededError - localStorage переполнен
**Ошибка:**
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': 
Setting the value of 'report_data_sources_reference_v3' exceeded the quota.
```

**Причина:**
В режиме API данные дублируются: сохраняются и в localStorage, и в PostgreSQL. При большом объеме данных localStorage переполняется (лимит ~5-10 MB).

### 2. source_types сохраняется неправильно
**Симптом:**
После сохранения типов источников при обновлении страницы поле пустое. В логах видно, что sourceTypes сохраняется как массив символов вместо массива строк.

**Причина:**
Функция `getSourcesForNote()` в PHP не декодировала JSON поле `source_types` в массив.

## Решения

### Исправление 1: Отключение сохранения в localStorage в режиме API

**Файл:** `src/store.ts`

```typescript
function saveData(reports: Report[]): void {
  try {
    // В режиме API не сохраняем в localStorage, чтобы избежать переполнения
    if (currentMode === 'api') {
      console.log('API mode: skipping localStorage save');
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving ', e);
  }
}
```

**Результат:**
- В режиме API данные хранятся только в PostgreSQL
- В локальном режиме данные хранятся в localStorage
- Нет дублирования данных
- Нет переполнения localStorage

### Исправление 2: Декодирование source_types в PHP

**Файл:** `backend/api/index.php`

```php
function getSourcesForNote(PDO $db, string $noteId): array {
    try {
        $stmt = $db->prepare("SELECT * FROM note_sources WHERE note_id = ? ORDER BY sort_order");
        $stmt->execute([$noteId]);
        $sources = $stmt->fetchAll();
        
        // Decode source_types JSON
        foreach ($sources as &$source) {
            if (isset($source['source_types']) && $source['source_types']) {
                $decoded = json_decode($source['source_types'], true);
                $source['source_types'] = $decoded !== null ? $decoded : [];
            } else {
                $source['source_types'] = [];
            }
        }
        
        return $sources;
    } catch (Exception $e) {
        error_log("Error in getSourcesForNote: " . $e->getMessage());
        return [];
    }
}
```

**Результат:**
- source_types корректно декодируется из JSON в массив
- Фронтенд получает массив строк, а не строку
- Типы источников сохраняются и загружаются правильно

### Исправление 3: Логирование для отладки

**Файл:** `src/store.ts`

Добавлено логирование первого источника при синхронизации:

```typescript
async function syncToAPI(): Promise<void> {
  if (currentMode === 'api') {
    try {
      console.log('Syncing data to API...');
      
      const reportsToSend = convertToSnakeCase(reports);
      
      // Логируем первый источник для проверки source_types
      if (reportsToSend.length > 0 && reportsToSend[0].sections?.length > 0) {
        const firstSection = reportsToSend[0].sections[0];
        if (firstSection.notes?.length > 0) {
          const firstNote = firstSection.notes[0];
          if (firstNote.indicators?.length > 0) {
            const firstIndicator = firstNote.indicators[0];
            if (firstIndicator.slices?.length > 0) {
              const firstSlice = firstIndicator.slices[0];
              if (firstSlice.sources?.length > 0) {
                const firstSource = firstSlice.sources[0];
                console.log('First source to send:', firstSource);
                console.log('source_types:', firstSource.source_types);
              }
            }
          }
        }
      }
      
      await api.importAllReports(reportsToSend);
      console.log('Sync to API completed');
    } catch (e) {
      console.error('Error syncing to API:', e);
    }
  }
}
```

## Инструкция по применению

### Шаг 1: Очистка localStorage

Создан HTML-файл для очистки localStorage: `backend/clear_localstorage.html`

**Вариант 1: Через браузер**
1. Откройте файл `backend/clear_localstorage.html` в браузере
2. Нажмите "Очистить только данные приложения"
3. Проверьте размер localStorage

**Вариант 2: Через консоль браузера**
1. Откройте сайт в браузере
2. Нажмите F12 для открытия консоли
3. Перейдите на вкладку "Console"
4. Выполните команду:
```javascript
localStorage.removeItem('report_data_sources_reference_v3');
```

**Вариант 3: Очистить весь localStorage**
```javascript
localStorage.clear();
```

### Шаг 2: Загрузка обновленных файлов

Загрузите на сервер:

1. **Фронтенд:**
   ```
   dist/* → C:/web/sites/DataSources/
   ```

2. **Бэкенд:**
   ```
   backend/api/index.php → C:/web/sites/DataSources/api/index.php
   ```

### Шаг 3: Перезапуск Apache

```bash
httpd -k restart
```

### Шаг 4: Проверка работы

1. Откройте сайт: `http://10.64.8.68/DataSources/`
2. Откройте консоль браузера (F12)
3. Переключитесь в режим **PostgreSQL**
4. Проверьте логи:
   ```
   API mode: skipping localStorage save
   ```
5. Создайте источник с типами
6. Проверьте логи:
   ```
   First source to send: {...}
   source_types: ["Робот", "ПО"]
   Sync to API completed
   ```
7. Обновите страницу (F5)
8. Проверьте, что типы источников сохранились

## Проверка исправлений

### Проверка 1: localStorage не переполняется

**В консоли браузера:**
```javascript
// Проверить размер localStorage
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length + key.length;
  }
}
console.log('Размер localStorage:', (totalSize / 1024).toFixed(2), 'KB');
```

**Ожидаемый результат:**
- В режиме API размер localStorage не увеличивается при изменениях
- В локальном режиме размер увеличивается, но не превышает лимит

### Проверка 2: source_types сохраняется корректно

**В консоли браузера:**
1. Создайте источник с типами ["Робот", "ПО"]
2. Проверьте логи:
   ```
   First source to send: {..., source_types: ["Робот", "ПО"]}
   ```
3. Обновите страницу
4. Проверьте, что типы загрузились

**В PostgreSQL:**
```sql
SELECT id, name, source_types 
FROM data_sources 
WHERE source_types IS NOT NULL 
LIMIT 5;
```

**Ожидаемый результат:**
```
id  | name        | source_types
----|-------------|------------------
abc | Источник 1  | ["Робот","ПО"]
```

### Проверка 3: Логи PHP

**Файл:** `C:/web/Apache24/logs/error.log`

Ищите записи:
```
Importing source: Источник 1, source_types: ["Робот","ПО"]
```

## Решение проблем

### Проблема: localStorage всё еще переполнен

**Решение:**
1. Убедитесь, что загружен обновленный `dist/`
2. Очистите localStorage вручную через консоль:
   ```javascript
   localStorage.clear();
   ```
3. Перезагрузите страницу

### Проблема: source_types не сохраняется

**Решение:**
1. Проверьте логи PHP:
   ```
   C:/web/Apache24/logs/error.log
   ```
2. Убедитесь, что загружен обновленный `api/index.php`
3. Проверьте структуру таблицы:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'data_sources' AND column_name = 'source_types';
   ```
   Должно быть: `source_types | text`

### Проблема: Ошибка при загрузке данных

**Решение:**
1. Проверьте логи PHP на наличие ошибок
2. Проверьте, что все таблицы созданы:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. Проверьте, что в таблицах есть данные:
   ```sql
   SELECT COUNT(*) FROM reports;
   SELECT COUNT(*) FROM data_sources;
   ```

## Архитектурные изменения

### До исправления:
```
Frontend (React)
    ↓
localStorage (дублирование)
    ↓
API → PostgreSQL
```

### После исправления:
```
Frontend (React)
    ↓
┌───────────────────┐
│  Режим API        │ → PostgreSQL (только БД)
│  Режим Local      │ → localStorage (только localStorage)
└───────────────────┘
```

## Преимущества исправлений

1. **Нет переполнения localStorage**
   - В режиме API данные хранятся только в PostgreSQL
   - Нет дублирования данных
   - Нет ошибок QuotaExceededError

2. **Корректная работа с source_types**
   - Типы источников сохраняются как JSON массив
   - Корректно декодируются при загрузке
   - Отображаются правильно в интерфейсе

3. **Улучшенная отладка**
   - Логирование первого источника при синхронизации
   - Легко отследить проблемы с конвертацией данных
   - Видно, какие данные отправляются на сервер

## Тестирование

### Тест 1: Создание источника с типами

1. Переключитесь в режим PostgreSQL
2. Создайте новый источник
3. Выберите типы: "Робот", "ПО"
4. Нажмите "Сохранить"
5. Проверьте логи в консоли:
   ```
   First source to send: {..., source_types: ["Робот", "ПО"]}
   ```
6. Обновите страницу
7. Проверьте, что типы сохранились

### Тест 2: Редактирование типов

1. Выберите существующий источник
2. Нажмите "Редактировать"
3. Измените типы источников
4. Нажмите "Сохранить"
5. Обновите страницу
6. Проверьте, что изменения сохранились

### Тест 3: Проверка localStorage

1. Откройте консоль браузера (F12)
2. Выполните:
   ```javascript
   console.log('Размер localStorage:', localStorage.length, 'ключей');
   ```
3. Внесите изменения в данные
4. Проверьте размер снова
5. В режиме API размер не должен увеличиваться

## Дополнительные рекомендации

### 1. Мониторинг размера localStorage

Добавьте в код периодическую проверку:
```typescript
function checkLocalStorageSize() {
  if (currentMode === 'local') {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    if (totalSize > 4 * 1024 * 1024) { // 4 MB
      console.warn('localStorage приближается к лимиту:', totalSize, 'байт');
    }
  }
}
```

### 2. Автоматическая очистка старых данных

Добавьте функцию очистки устаревших данных:
```typescript
function cleanupOldData() {
  if (currentMode === 'api') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
```

### 3. Индикатор режима хранения

Добавьте в UI индикатор текущего режима:
```typescript
<div className="text-xs text-gray-500">
  Режим хранения: {currentMode === 'api' ? 'PostgreSQL' : 'localStorage'}
</div>
```

## Заключение

Обе проблемы успешно исправлены:

✅ **localStorage не переполняется** - в режиме API данные хранятся только в PostgreSQL  
✅ **source_types сохраняется корректно** - JSON декодируется в массив при загрузке  
✅ **Добавлено логирование** - легко отследить проблемы с данными  
✅ **Создан инструмент очистки** - HTML-файл для управления localStorage

Проект собран и готов к развертыванию.
