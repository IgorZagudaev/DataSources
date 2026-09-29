# Краткая инструкция: Исправление трёх проблем

## Исправленные проблемы

✅ **1. Задержка при операциях** - добавлено логирование времени выполнения  
✅ **2. Ошибка 500 при перемещении** - добавлены обработчики move операций в PHP API  
✅ **3. Пропало выделение при редактировании** - добавлена передача `editingId` в TreeView  

---

## Что изменилось

### 1. store.ts
Добавлено логирование времени загрузки:
```typescript
const startTime = performance.now();
reports = await api.fetchReports();
const endTime = performance.now();
console.log(`Reports loaded in ${(endTime - startTime).toFixed(2)}ms`);
```

### 2. backend/api/index.php
Добавлены:
- Функция `handleMove()` - универсальный обработчик перемещения
- Обработчики `handleNoteBlockIndicators()`, `handleNoteBlockSlices()`, `handleNoteBlockSources()`
- Маршрутизация для `/move` endpoint'ов

### 3. App.tsx
Добавлена передача props в TreeView:
```tsx
<TreeView
  editingId={formState?.editData?.id || null}
  actionId={actionId}
  // ... остальные props
/>
```

---

## Установка

### 1. Загрузите файлы на сервер

```powershell
# Фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\

# Бэкенд
copy backend\api\index.php C:\web\sites\DataSources\api\
```

### 2. Перезапустите Apache

```bash
httpd -k restart
```

---

## Проверка

### 1. Задержка при операциях

Откройте консоль браузера (F12) и выполните операцию:
```
Loading reports from API...
Reports loaded in 123.45ms
```

Время должно быть < 500 мс.

### 2. Перемещение элементов

1. Выберите элемент
2. Нажмите кнопку ↑ или ↓
3. Элемент должен переместиться
4. Проверьте логи:
   ```powershell
   Get-Content "C:\web\sites\DataSources\api\actions.log" -Tail 10
   ```

### 3. Выделение при редактировании

1. Выберите элемент
2. Нажмите кнопку редактирования (✎)
3. Должна появиться чёрная рамка
4. Закройте форму - рамка исчезнет

---

## Решение проблем

### Перемещение не работает

1. Проверьте загруженный `index.php`
2. Проверьте логи Apache:
   ```powershell
   Get-Content "C:\web\Apache24\logs\error.log" -Tail 50
   ```
3. Проверьте консоль браузера (F12)

### Рамка не появляется

1. Очистите кэш браузера (Ctrl+F5)
2. Проверьте загруженный фронтенд
3. Проверьте консоль браузера на ошибки

### Задержка > 1 сек

1. Проверьте объём данных:
   ```sql
   SELECT COUNT(*) FROM reports;
   ```
2. Проверьте индексы в БД
3. Проверьте сетевую задержку

---

## Файлы для загрузки

```
dist/* → C:/web/sites/DataSources/
backend/api/index.php → C:/web/sites/DataSources/api/
```

---

## Документация

Полная документация: `backend/FIX_THREE_ISSUES.md`

---

Проект пересобран и готов к развёртыванию.
