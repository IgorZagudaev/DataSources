// Иерархическая структура данных справочника
// 7 уровней: Доклад → Раздел → Справка → [Блок справки] → Показатель → Разрез → Источник
// Блок справки - необязательный уровень

export const SOURCE_TYPES = [
  'Робот',
  'Ручная выгрузка',
  'ПО',
  'Дискор НП',
  'ЭПС',
  'ЕАСД',
  'Хранимые процедуры',
  'Другое'
] as const;

export type SourceType = typeof SOURCE_TYPES[number];

export interface DataSource {
  id: string;
  name: string; // Источник данных (Уровень 6)
  description?: string;
  sourceTypes?: SourceType[]; // Типы источника (множественный выбор)
  sliceId: string;
  sortOrder?: number;
}

export interface DataSlice {
  id: string;
  name: string; // Разрез данных (Уровень 5)
  description?: string;
  indicatorId: string;
  sortOrder?: number;
  sources: DataSource[];
}

export interface Indicator {
  id: string;
  name: string; // Название показателя (Уровень 4)
  description?: string;
  noteId: string;
  sortOrder?: number;
  slices: DataSlice[];
}

export interface NoteBlock {
  id: string;
  name: string; // Название блока справки (Уровень 4 - необязательный)
  description?: string;
  noteId: string;
  sortOrder?: number;
  indicators: Indicator[];
}

export interface Note {
  id: string;
  name: string; // Название справки (Уровень 3)
  shortName?: string; // Краткое название для отображения в списке
  description?: string;
  sectionId: string;
  sortOrder?: number;
  noteBlocks: NoteBlock[]; // Блоки справки (необязательный уровень)
  indicators: Indicator[];
  sources: DataSource[]; // Прямые источники (альтернативная ветка)
}

export interface Section {
  id: string;
  name: string; // Название раздела доклада (Уровень 2)
  description?: string;
  reportId: string;
  sortOrder?: number;
  notes: Note[];
}

export interface Report {
  id: string;
  name: string; // Название доклада (Уровень 1)
  description?: string;
  sortOrder?: number;
  sections: Section[];
}

export type EntityType = 'report' | 'section' | 'note' | 'indicator' | 'slice' | 'source';
