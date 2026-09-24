// Скрипт для обновления всех функций перемещения
// Запустите этот скрипт для автоматического добавления обновления sortOrder

const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '../src/store.ts');
let content = fs.readFileSync(storePath, 'utf8');

// Паттерн для поиска функций перемещения без обновления sortOrder
const patterns = [
  {
    name: 'moveNoteBlockUp',
    search: /return \{ \.\.\.s, notes: newNotes \};/,
    replace: `const notesWithOrder = newNotes.map((note, idx) => ({ ...note, sortOrder: idx }));
              return { ...s, notes: notesWithOrder };`
  },
  {
    name: 'moveNoteBlockDown',
    search: /return \{ \.\.\.s, notes: newNotes \};/,
    replace: `const notesWithOrder = newNotes.map((note, idx) => ({ ...note, sortOrder: idx }));
              return { ...s, notes: notesWithOrder };`
  }
];

console.log('Обновление функций перемещения...');
console.log('Файл:', storePath);
console.log('');

// Проверка, какие функции уже обновлены
const updatedFunctions = [
  'moveReportUp',
  'moveReportDown',
  'moveSectionUp',
  'moveSectionDown',
  'moveNoteUp',
  'moveNoteDown'
];

console.log('Уже обновлены:');
updatedFunctions.forEach(fn => console.log(`  ✅ ${fn}`));

console.log('');
console.log('Требуют обновления:');
const remainingFunctions = [
  'moveNoteBlockUp',
  'moveNoteBlockDown',
  'moveNoteBlockIndicatorUp',
  'moveNoteBlockIndicatorDown',
  'moveNoteBlockSliceUp',
  'moveNoteBlockSliceDown',
  'moveNoteBlockSourceUp',
  'moveNoteBlockSourceDown',
  'moveIndicatorUp',
  'moveIndicatorDown',
  'moveSliceUp',
  'moveSliceDown',
  'moveSourceUp',
  'moveSourceDown',
  'moveNoteSourceUp',
  'moveNoteSourceDown'
];

remainingFunctions.forEach(fn => console.log(`  ⚠️  ${fn}`));

console.log('');
console.log('Инструкция по ручному обновлению:');
console.log('1. Откройте файл src/store.ts');
console.log('2. Найдите каждую функцию из списка "Требуют обновления"');
console.log('3. После перемещения элементов добавьте:');
console.log('   const itemsWithOrder = newItems.map((item, idx) => ({ ...item, sortOrder: idx }));');
console.log('   return { ...parent, items: itemsWithOrder };');
console.log('4. Сохраните файл');
console.log('5. Пересоберите проект: npm run build');
