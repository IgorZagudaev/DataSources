// Иерархическая структура данных справочника

export interface DataSource {
  id: string;
  name: string; // Источник данных
  description?: string;
  sliceId: string;
}

export interface DataSlice {
  id: string;
  name: string; // Разрез данных
  description?: string;
  indicatorId: string;
  sources: DataSource[];
}

export interface Indicator {
  id: string;
  name: string; // Название показателя
  description?: string;
  sectionId: string;
  slices: DataSlice[];
}

export interface Note {
  id: string;
  name: string; // Название справки
  description?: string;
  sectionId: string;
}

export interface Section {
  id: string;
  name: string; // Название раздела доклада
  description?: string;
  reportId: string;
  notes: Note[];
  indicators: Indicator[];
}

export interface Report {
  id: string;
  name: string; // Название доклада
  description?: string;
  sections: Section[];
}

export type EntityType = 'report' | 'section' | 'note' | 'indicator' | 'slice' | 'source';

export interface TreeNode {
  id: string;
  name: string;
  type: EntityType;
  level: number;
  children: TreeNode[];
  description?: string;
}
