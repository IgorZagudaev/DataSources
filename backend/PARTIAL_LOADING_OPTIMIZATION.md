# Оптимизация загрузки данных: частичная загрузка вместо полной

## Проблема текущей архитектуры

**Текущий подход:**
```
Любое изменение → loadReports() → GET /api/reports → загрузка ВСЕХ данных
```

**Недостатки:**
- При изменении одного показателя загружаются все доклады, разделы, справки
- Избыточная нагрузка на сеть и БД
- Медленная работа при большом объёме данных
- Неэффективное использование полосы пропускания

**Пример:**
```
Пользователь изменил название источника
→ Загружаются все данные из БД (100+ докладов, 500+ разделов, 1000+ справок)
→ Передаются по сети (~5 МБ данных)
→ Обновляется весь UI
→ Время: 2-5 секунд
```

---

## Предлагаемое решение: частичная загрузка

**Оптимальный подход:**
```
Изменение на уровне N → загрузка только уровня N и его предков
```

**Пример:**
```
Пользователь изменил название источника (уровень 6)
→ Загружается только:
  - Этот источник (уровень 6)
  - Его разрез (уровень 5)
  - Его показатель (уровень 4)
  - Его справка/блок (уровень 3)
  - Его раздел (уровень 2)
  - Его доклад (уровень 1)
→ Передаётся ~1 КБ данных
→ Обновляется только изменённая ветка
→ Время: 50-200 мс
```

---

## Архитектура решения

### 1. Новые API endpoints

```php
// Загрузка отдельного элемента с предками
GET /api/sources/{id}/hierarchy
→ Возвращает: source + slice + indicator + note + section + report

// Загрузка элемента без предков
GET /api/sources/{id}
→ Возвращает только source

// Загрузка дочерних элементов
GET /api/indicators/{id}/children
→ Возвращает: slices + sources
```

### 2. Изменения в store.ts

```typescript
// Было:
export async function updateSource(...) {
  await api.updateSource(...);
  await loadReports(); // ← Загрузка ВСЕХ данных
}

// Стало:
export async function updateSource(...) {
  await api.updateSource(...);
  await loadHierarchy('source', sourceId); // ← Загрузка только ветки
}

// Новая функция:
export async function loadHierarchy(level: string, id: string): Promise<void> {
  const hierarchy = await api.fetchHierarchy(level, id);
  // Локальное обновление состояния
  updateLocalState(hierarchy);
  notify();
}
```

### 3. Локальное обновление состояния

```typescript
function updateLocalState(hierarchy: HierarchyData): void {
  // Находим и обновляем только изменённый элемент
  reports = reports.map(report => {
    if (report.id === hierarchy.report.id) {
      return updateReportHierarchy(report, hierarchy);
    }
    return report;
  });
}
```

---

## Реализация

### Шаг 1: Создание API endpoints

**Файл:** `backend/api/index.php`

```php
// Новый endpoint: GET /api/{level}/{id}/hierarchy
case 'reports':
case 'sections':
case 'notes':
case 'indicators':
case 'slices':
case 'sources':
    if ($action === 'hierarchy' && $method === 'GET') {
        handleGetHierarchy($db, $resource, $id);
    } else {
        // Существующая логика
    }
    break;

function handleGetHierarchy(PDO $db, string $level, string $id): void {
    $hierarchy = [];
    
    switch ($level) {
        case 'source':
            $hierarchy['source'] = getSource($db, $id);
            $hierarchy['slice'] = getSlice($db, $hierarchy['source']['slice_id']);
            $hierarchy['indicator'] = getIndicator($db, $hierarchy['slice']['indicator_id']);
            $hierarchy['note'] = getNote($db, $hierarchy['indicator']['note_id']);
            $hierarchy['section'] = getSection($db, $hierarchy['note']['section_id']);
            $hierarchy['report'] = getReport($db, $hierarchy['section']['report_id']);
            break;
        // ... другие уровни
    }
    
    echo json_encode($hierarchy);
}
```

### Шаг 2: Обновление store.ts

**Файл:** `src/store.ts`

```typescript
// Новая функция для частичной загрузки
export async function loadHierarchy(level: string, id: string): Promise<void> {
  try {
    const hierarchy = await api.fetchHierarchy(level, id);
    
    // Локальное обновление состояния
    reports = updateLocalState(reports, hierarchy);
    notify();
  } catch (e) {
    console.error('Error loading hierarchy:', e);
    // Fallback: загрузка всех данных
    await loadReports();
  }
}

// Функция локального обновления
function updateLocalState(reports: Report[], hierarchy: any): Report[] {
  return reports.map(report => {
    if (report.id === hierarchy.report.id) {
      return mergeHierarchy(report, hierarchy);
    }
    return report;
  });
}

// Обновлённые функции CRUD
export async function updateSource(...) {
  await api.updateSource(...);
  await loadHierarchy('source', sourceId); // ← Частичная загрузка
}
```

### Шаг 3: Обновление api.ts

**Файл:** `src/api.ts`

```typescript
// Новый endpoint
export async function fetchHierarchy(level: string, id: string) {
  return apiRequest(`/${level}/${id}/hierarchy`);
}
```

---

## Преимущества

### Производительность

| Операция | Текущий подход | Оптимизированный подход |
|----------|----------------|-------------------------|
| Изменение источника | 2-5 сек | 50-200 мс |
| Объём данных | 5 МБ | 1 КБ |
| SQL запросов | 10+ | 6 |
| Нагрузка на БД | Высокая | Минимальная |

### Масштабируемость

**Текущий подход:**
- 100 докладов × 5 разделов × 10 справок = 5000 записей
- Каждое изменение загружает все 5000 записей
- Время растёт линейно с объёмом данных

**Оптимизированный подход:**
- Каждое изменение загружает только 6 записей (одна ветка)
- Время постоянно независимо от объёма данных
- Подходит для любых объёмов

### UX

**Текущий подход:**
- Задержка 2-5 секунд при каждом изменении
- Индикатор загрузки на весь экран
- Блокировка UI

**Оптимизированный подход:**
- Мгновенное обновление (50-200 мс)
- Плавная работа без индикаторов
- Неблокирующий UI

---

## Сложности реализации

### 1. Синхронизация состояния

**Проблема:** Локальное состояние может рассинхронизироваться с БД.

**Решение:**
- Периодическая полная синхронизация (раз в минуту)
- Проверка целостности при загрузке
- Fallback на полную загрузку при ошибках

### 2. Оптимистичные обновления

**Проблема:** UI обновляется до получения ответа от сервера.

**Решение:**
```typescript
export async function updateSource(...) {
  // Оптимистичное обновление
  const oldState = { ...reports };
  reports = updateLocalOptimistic(reports, sourceId, newData);
  notify();
  
  try {
    await api.updateSource(...);
    await loadHierarchy('source', sourceId); // Подтверждение
  } catch (error) {
    // Откат при ошибке
    reports = oldState;
    notify();
    throw error;
  }
}
```

### 3. Кэширование

**Проблема:** Повторные запросы одних и тех же данных.

**Решение:**
```typescript
const cache = new Map<string, {  any; timestamp: number }>();

export async function fetchHierarchy(level: string, id: string) {
  const cacheKey = `${level}:${id}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data; // Вернуть из кэша
  }
  
  const data = await apiRequest(`/${level}/${id}/hierarchy`);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

---

## План реализации

### Фаза 1: API endpoints (1-2 дня)
- [ ] Создать endpoint `/api/{level}/{id}/hierarchy`
- [ ] Создать endpoint `/api/{level}/{id}/children`
- [ ] Тестирование API

### Фаза 2: Частичная загрузка (2-3 дня)
- [ ] Реализовать `loadHierarchy()` в store.ts
- [ ] Реализовать `updateLocalState()`
- [ ] Обновить все CRUD функции

### Фаза 3: Оптимизации (1-2 дня)
- [ ] Добавить кэширование
- [ ] Добавить оптимистичные обновления
- [ ] Добавить периодическую синхронизацию

### Фаза 4: Тестирование (1 день)
- [ ] Нагрузочное тестирование
- [ ] Тестирование синхронизации
- [ ] Тестирование откатов

**Общее время:** 5-8 дней

---

## Альтернативные решения

### Вариант 1: WebSocket для real-time обновлений

```typescript
const ws = new WebSocket('ws://server/ws');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  applyUpdate(update); // Локальное обновление
};
```

**Преимущества:**
- Мгновенные обновления для всех пользователей
- Нет polling

**Недостатки:**
- Сложная архитектура
- Требует WebSocket сервер
- Проблемы с масштабированием

### Вариант 2: GraphQL вместо REST

```graphql
query {
  source(id: "123") {
    id
    name
    slice {
      id
      name
      indicator {
        id
        name
      }
    }
  }
}
```

**Преимущества:**
- Гибкие запросы
- Нет over-fetching
- Типизация

**Недостатки:**
- Требует GraphQL сервер
- Сложнее в реализации
- Дополнительная зависимость

### Вариант 3: Оставить текущую архитектуру с оптимизациями

```typescript
// Debounce для частых изменений
let syncTimeout: NodeJS.Timeout;
function notify() {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncToAPI();
  }, 1000); // Задержка 1 секунда
}
```

**Преимущества:**
- Простота
- Не требует изменений API
- Быстрая реализация

**Недостатки:**
- Всё ещё загружает все данные
- Задержка при сохранении

---

## Рекомендации

### Краткосрочно (сейчас)
✅ Использовать текущую архитектуру с debounce (уже реализовано)  
✅ Добавить индикатор загрузки для улучшения UX  
✅ Оптимизировать SQL запросы (индексы, кэширование)

### Среднесрочно (1-2 месяца)
🔄 Реализовать частичную загрузку (Фаза 1-2)  
🔄 Добавить кэширование на стороне клиента  
🔄 Оптимизировать API responses

### Долгосрочно (3-6 месяцев)
🚀 Рассмотреть WebSocket для real-time обновлений  
🚀 Рассмотреть GraphQL для гибких запросов  
🚀 Добавить CDN для статических данных

---

## Заключение

Текущая архитектура с полной загрузкой данных работает, но не оптимальна. Частичная загрузка может улучшить производительность в 10-50 раз, но требует значительной переработки.

**Рекомендация:** Начать с краткосрочных оптимизаций (debounce, индикаторы), затем постепенно переходить к частичной загрузке.
