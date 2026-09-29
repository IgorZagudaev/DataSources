# Краткая инструкция: Диагностика логирования и проблема DELETE/INSERT

## Часть 1: Диагностика проблемы с actions.log

### Быстрая проверка

1. **Загрузите диагностический скрипт:**
   ```powershell
   copy backend\api\diagnostic.php C:\web\sites\DataSources\api\
   copy backend\api\action_logger.php C:\web\sites\DataSources\api\
   ```

2. **Откройте в браузере:**
   ```
   http://ваш_сервер/DataSources/api/diagnostic.php
   ```

3. **Проверьте результаты:**
   - Все пункты должны быть зелёными
   - Если есть красные - следуйте рекомендациям

4. **Проверьте логи Apache:**
   ```
   C:/web/Apache24/logs/error.log
   ```
   Ищите записи: `logAction вызван: ...`

### Если файл не создаётся

**Решение 1: Дать права на запись**
```powershell
icacls "C:\web\sites\DataSources\api" /grant "Все:(OI)(CI)F"
```

**Решение 2: Создать файл вручную**
```powershell
New-Item -Path "C:\web\sites\DataSources\api\actions.log" -ItemType File
icacls "C:\web\sites\DataSources\api\actions.log" /grant "Все:F"
```

**Решение 3: Перезапустить Apache**
```bash
httpd -k restart
```

---

## Часть 2: Проблема DELETE/INSERT вместо UPDATE

### Суть проблемы

При изменении **одного поля** (например, названия доклада) система:
1. Отправляет **ВСЕ данные** на сервер
2. Удаляет **ВСЕ записи** из всех таблиц
3. Вставляет **ВСЕ данные** заново

**Пример:**
```
Изменили название доклада → DELETE из 10 таблиц → INSERT всех данных
Время: 2-5 секунд (вместо 50-200 мс)
```

### Причина

Архитектурная проблема: фронтенд использует localStorage как основной store и при любом изменении синхронизирует ВСЕ данные с сервером через `/api/import`.

### Временное решение (быстрое)

Добавить задержку перед синхронизацией (debounce):

**Файл:** `src/store.ts`

```typescript
let syncTimeout: NodeJS.Timeout;

function notify() {
  saveData(reports);
  listeners.forEach(l => l());
  
  if (currentMode === 'api' && !isLoadingFromAPI) {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncToAPI();
    }, 5000); // Синхронизация через 5 секунд после последнего изменения
  }
}
```

**Преимущества:**
- Уменьшает количество синхронизаций в 10-50 раз
- Простая реализация
- Не требует изменения архитектуры

**Недостатки:**
- Всё ещё DELETE/INSERT вместо UPDATE
- Задержка 5 секунд перед сохранением на сервер

### Долгосрочное решение (правильное)

Перейти на прямые вызовы REST API для каждой операции:

**Было:**
```typescript
export function updateReport(id: string, name: string) {
  reports = reports.map(r => r.id === id ? { ...r, name } : r);
  notify(); // → syncToAPI() → DELETE/INSERT всех данных
}
```

**Стало:**
```typescript
export async function updateReport(id: string, name: string) {
  reports = reports.map(r => r.id === id ? { ...r, name } : r);
  
  // Отправляем только изменение
  await api.updateReport(id, { name });
}
```

**Преимущества:**
- ✅ Только UPDATE вместо DELETE/INSERT
- ✅ Время: 50-200 мс вместо 2-5 секунд
- ✅ Минимальная нагрузка на БД
- ✅ Транзакционная безопасность

**Недостатки:**
- ❌ Требует переработки фронтенда
- ❌ Сложнее реализация

### Сравнение

| Метрика | Сейчас (DELETE/INSERT) | После оптимизации (UPDATE) |
|---------|------------------------|----------------------------|
| Время операции | 2-5 сек | 50-200 мс |
| Нагрузка на БД | Высокая | Минимальная |
| Сетевой трафик | Все данные | Только изменения |
| Риск потери данных | Есть | Нет |
| Блокировки таблиц | Да | Нет |

### Рекомендации

**Срочно (сегодня):**
1. Применить временное решение (debounce)
2. Это уменьшит нагрузку в 10-50 раз

**Краткосрочно (1-2 недели):**
1. Реализовать оптимизацию текущей архитектуры
2. Отслеживать только изменённые данные

**Долгосрочно (1-2 месяца):**
1. Перейти на REST API
2. Полностью отказаться от DELETE/INSERT

---

## Файлы для загрузки

```
backend/api/action_logger.php → C:/web/sites/DataSources/api/
backend/api/diagnostic.php → C:/web/sites/DataSources/api/
```

## Документация

- **Полная диагностика:** `backend/ACTIONS_LOG_DIAGNOSTIC.md`
- **Проблема DELETE/INSERT:** `backend/DELETE_INSERT_VS_UPDATE_ISSUE.md`

## Проверка

1. Откройте диагностику: `http://сервер/DataSources/api/diagnostic.php`
2. Выполните действие в приложении
3. Проверьте файл `actions.log`
4. Проверьте логи SQL - должны быть только UPDATE (после оптимизации)
