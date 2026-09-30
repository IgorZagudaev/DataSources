# Исправление модального окна загрузки

## Проблема

Модальное окно загрузки появлялось в левом верхнем углу вместо центра экрана, и имело белый фон с темным текстом.

## Решение

### 1. Центрирование окна

**Было:**
```tsx
<div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999 }}>
```

**Стало:**
```tsx
<div className="fixed top-0 left-0 w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999 }}>
```

**Изменения:**
- Заменено `inset-0` на `top-0 left-0 w-full h-full` для более надежного центрирования
- Увеличена непрозрачность оверлея с 75% до 85%

### 2. Изменение цветов

**Было:**
```tsx
<div className="bg-white rounded-xl p-10 shadow-2xl flex flex-col items-center max-w-md mx-4">
  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mb-6"></div>
  <p className="text-2xl font-bold text-gray-800 mb-3">Загрузка данных</p>
  <p className="text-base text-gray-600 text-center">Пожалуйста, подождите пока данные загружаются из базы данных...</p>
</div>
```

**Стало:**
```tsx
<div className="bg-gray-800 rounded-xl p-10 shadow-2xl flex flex-col items-center max-w-md mx-4 border border-gray-700">
  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-400 mb-6"></div>
  <p className="text-2xl font-bold text-white mb-3">Загрузка данных</p>
  <p className="text-base text-gray-300 text-center">Пожалуйста, подождите пока данные загружаются из базы данных...</p>
</div>
```

**Изменения:**
- Фон окна: `bg-white` → `bg-gray-800` (темный)
- Заголовок: `text-gray-800` → `text-white` (белый)
- Подзаголовок: `text-gray-600` → `text-gray-300` (светло-серый для контраста)
- Спиннер: `border-blue-600` → `border-blue-400` (более светлый синий для контраста на темном фоне)
- Добавлена граница: `border border-gray-700` для визуального разделения

## Результат

Теперь модальное окно загрузки:
- ✅ Центрировано по экрану
- ✅ Имеет темный фон (`bg-gray-800`)
- ✅ Имеет белый текст (`text-white`)
- ✅ Более темный оверлей (85% непрозрачности)
- ✅ Светло-синий спиннер для контраста
- ✅ Граница для визуального разделения

## Установка

```powershell
# Загрузите обновлённый фронтенд
xcopy /E /Y dist\* C:\web\sites\DataSources\

# Очистите кэш браузера
# Ctrl+Shift+Delete

# Перезагрузите страницу
# Ctrl+F5
```

## Проверка

1. Откройте приложение
2. Переключитесь в режим PostgreSQL
3. Перезагрузите страницу (Ctrl+F5)
4. Должно появиться модальное окно:
   - По центру экрана
   - С темным фоном
   - С белым текстом
   - С анимированным спиннером

## Изменённые файлы

- `src/App.tsx` - модальное окно загрузки

---

**Дата:** 2026-09-17  
**Статус:** ✅ Завершено  
**Готово к развёртыванию:** ✅ Да
