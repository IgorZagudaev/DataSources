// Иерархическая структура данных справочника
// 7 уровней: Доклад → Раздел → Справка → [Блок справки] → Показатель → Разрез → Источник
// Блок справки - необязательный уровень

export interface DataSource {
  id: string;
  name: string; // Источник данных (Уровень 6)
  description?: string;
  sliceId: string;
}

export interface DataSlice {
  id: string;
  name: string; // Разрез данных (Уровень 5)
  description?: string;
  indicatorId: string;
  sources: DataSource[];
}

export interface Indicator {
  id: string;
  name: string; // Название показателя (Уровень 4)
  description?: string;
  noteId: string;
  slices: DataSlice[];
}

export interface NoteBlock {
  id: string;
  name: string; // Название блока справки (Уровень 4 - необязательный)
  description?: string;
  noteId: string;
  indicators: Indicator[];
}

export interface Note {
  id: string;
  name: string; // Название справки (Уровень 3)
  description?: string;
  sectionId: string;
  noteBlocks: NoteBlock[]; // Блоки справки (необязательный уровень)
  indicators: Indicator[];
  sources: DataSource[]; // Прямые источники (альтернативная ветка)
}

export interface Section {
  id: string;
  name: string; // Название раздела доклада (Уровень 2)
  description?: string;
  reportId: string;
  notes: Note[];
}

export interface Report {
  id: string;
  name: string; // Название доклада (Уровень 1)
  description?: string;
  sections: Section[];
}

export type EntityType = 'report' | 'section' | 'note' | 'indicator' | 'slice' | 'source';
