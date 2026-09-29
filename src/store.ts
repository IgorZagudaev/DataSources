import { Report, Section, Note, NoteBlock, Indicator, DataSlice, DataSource, SourceType } from './types';
import * as api from './api';

const STORAGE_KEY = 'report_data_sources_reference_v3';
const MODE_KEY = 'data_source_mode';

// Режим работы: 'local' (localStorage) или 'api' (PostgreSQL)
export type DataSourceMode = 'local' | 'api';

function getMode(): DataSourceMode {
  return (localStorage.getItem(MODE_KEY) as DataSourceMode) || 'local';
}

export function setMode(mode: DataSourceMode): void {
  localStorage.setItem(MODE_KEY, mode);
  currentMode = mode;
  // Перезагружаем данные при смене режима
  reports = loadData();
  notify();
}

export function getDataSourceMode(): DataSourceMode {
  return currentMode;
}

let currentMode: DataSourceMode = getMode();
let isLoadingFromAPI = false; // Флаг для предотвращения обратной синхронизации при загрузке
let syncTimeout: ReturnType<typeof setTimeout> | null = null; // Таймер для debounce синхронизации

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadData(): Report[] {
  currentMode = getMode();
  
  // Если режим API, данные будут загружены асинхронно через syncFromAPI
  if (currentMode === 'api') {
    return []; // Временно возвращаем пустой массив, данные загрузятся через syncFromAPI
  }
  
  // Локальный режим - загружаем из localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old  add 'sources' and 'noteBlocks' arrays to notes if missing
      if (Array.isArray(parsed)) {
        let needsMigration = false;
        parsed.forEach((report: any) => {
          if (report.sections) {
            report.sections.forEach((section: any) => {
              if (section.notes) {
                section.notes.forEach((note: any) => {
                  if (note.sources === undefined) {
                    note.sources = [];
                    needsMigration = true;
                  }
                  if (note.noteBlocks === undefined) {
                    note.noteBlocks = [];
                    needsMigration = true;
                  }
                  // Remove sources from noteBlocks if present (old structure)
                  if (note.noteBlocks) {
                    note.noteBlocks.forEach((noteBlock: any) => {
                      if (noteBlock.sources !== undefined) {
                        delete noteBlock.sources;
                        needsMigration = true;
                      }
                    });
                  }
                  // shortName is optional, no migration needed
                });
              }
            });
          }
        });
        
        if (needsMigration) {
          console.log('Migrated old data structure');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading ', e);
  }
  return getDefaultData();
}

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

function getDefaultData(): Report[] {
  return [
    {
      id: 'report-1',
      name: 'Социально-экономическое развитие региона 2024',
      description: 'Ежегодный доклад о социально-экономическом развитии',
      sections: [
        {
          id: 'section-1',
          name: 'Демография',
          description: 'Раздел о демографических показателях',
          reportId: 'report-1',
          notes: [
            {
              id: 'note-1',
              name: 'Численность и состав населения',
              shortName: 'Численность',
              description: 'Справка о текущей численности и составе населения региона',
              sectionId: 'section-1',
              noteBlocks: [],
              indicators: [
                {
                  id: 'indicator-1',
                  name: 'Численность населения',
                  description: 'Общая численность постоянного населения',
                  noteId: 'note-1',
                  slices: [
                    {
                      id: 'slice-1',
                      name: 'По полу',
                      description: 'Разбивка по мужскому и женскому населению',
                      indicatorId: 'indicator-1',
                      sources: [
                        {
                          id: 'source-1',
                          name: 'Росстат (форма 1-Т)',
                          description: 'Ежегодные данные Федеральной службы государственной статистики',
                          sliceId: 'slice-1',
                          sourceTypes: ['Робот', 'ЕАСД']
                        }
                      ]
                    }
                  ]
                }
              ],
              sources: []
            }
          ]
        }
      ]
    }
  ];
}

let reports: Report[] = loadData();
let listeners: Array<() => void> = [];

function notify() {
  saveData(reports);
  listeners.forEach(l => l());
  // Синхронизируем с сервером в API режиме, но только если это не загрузка данных
  // Используем debounce - задержка 5 секунд перед синхронизацией
  if (currentMode === 'api' && !isLoadingFromAPI) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      syncToAPI();
      syncTimeout = null;
    }, 5000); // Синхронизация через 5 секунд после последнего изменения
  }
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function getReports(): Report[] {
  return reports;
}

// Преобразование camelCase в snake_case для API
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Преобразуем все camelCase ключи в snake_case
      const snakeKey = camelToSnake(key);
      result[snakeKey] = convertToSnakeCase(obj[key]);
    }
    return result;
  }
  return obj;
}

// Преобразование snake_case в camelCase для фронтенда
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function convertToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCase);
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Преобразуем все snake_case ключи в camelCase
      const camelKey = snakeToCamel(key);
      result[camelKey] = convertToCamelCase(obj[key]);
    }
    return result;
  }
  return obj;
}

async function loadFromAPI(): Promise<Report[]> {
  try {
    console.log('Loading data from API...');
    const data = await api.fetchReports();
    console.log('Data received from API:', data);
    console.log('Number of reports:', data.length);
    
    // Проверяем структуру данных
    if (!Array.isArray(data)) {
      console.error('API returned non-array ', data);
      return [];
    }
    
    // Преобразуем snake_case в camelCase
    const convertedData = convertToCamelCase(data);
    
    // Проверяем, что каждый элемент имеет нужную структуру
    const validReports = convertedData.filter((report: any) => {
      const isValid = report && report.id && report.name;
      if (!isValid) {
        console.warn('Invalid report structure:', report);
      }
      return isValid;
    });
    
    console.log('Valid reports:', validReports.length);
    return validReports;
  } catch (e) {
    console.error('Error loading from API:', e);
    return [];
  }
}

// Асинхронная загрузка данных из API
export async function syncFromAPI(): Promise<void> {
  console.log('syncFromAPI called, current mode:', currentMode);
  if (currentMode === 'api') {
    console.log('Mode is API, loading data...');
    isLoadingFromAPI = true; // Устанавливаем флаг перед загрузкой
    try {
      const data = await loadFromAPI();
      console.log('Loaded ', data);
      if (data.length > 0) {
        console.log('Updating reports with', data.length, 'items');
        reports = data;
        notify();
      } else {
        console.warn('No data loaded from API');
      }
    } finally {
      isLoadingFromAPI = false; // Сбрасываем флаг после загрузки
    }
  } else {
    console.log('Mode is not API, skipping sync');
  }
}

// Псевдоним для syncFromAPI для совместимости
export const loadReports = syncFromAPI;

// Синхронизация всех данных на сервер (для API режима)
async function syncToAPI(): Promise<void> {
  if (currentMode === 'api') {
    try {
      console.log('Syncing data to API...');
      
      // Преобразуем данные в snake_case перед отправкой
      const reportsToSend = convertToSnakeCase(reports);
      
      await api.importAllReports(reportsToSend);
      console.log('Sync to API completed');
    } catch (e) {
      console.error('Error syncing to API:', e);
    }
  }
}

// Report CRUD (Уровень 1)
export function addReport(name: string, description?: string): Report {
  const report: Report = { id: generateId(), name, description, sections: [] };
  reports = [...reports, report];
  notify();
  return report;
}

export function updateReport(id: string, name: string, description?: string) {
  reports = reports.map(r => r.id === id ? { ...r, name, description } : r);
  notify();
}

export function deleteReport(id: string) {
  reports = reports.filter(r => r.id !== id);
  notify();
}

// Section CRUD (Уровень 2)
export function addSection(reportId: string, name: string, description?: string): Section {
  const section: Section = { id: generateId(), name, description, reportId, notes: [] };
  reports = reports.map(r => r.id === reportId ? { ...r, sections: [...r.sections, section] } : r);
  notify();
  return section;
}

export function updateSection(reportId: string, sectionId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? { ...s, name, description } : s)
  } : r);
  notify();
}

export function deleteSection(reportId: string, sectionId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.filter(s => s.id !== sectionId)
  } : r);
  notify();
}

// Note CRUD (Уровень 3)
export function addNote(reportId: string, sectionId: string, name: string, description?: string, shortName?: string): Note {
  const note: Note = { id: generateId(), name, shortName, description, sectionId, noteBlocks: [], indicators: [], sources: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? { ...s, notes: [...s.notes, note] } : s)
  } : r);
  notify();
  return note;
}

export function updateNote(reportId: string, sectionId: string, noteId: string, name: string, description?: string, shortName?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, name, description, shortName } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNote(reportId: string, sectionId: string, noteId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.filter(n => n.id !== noteId)
    } : s)
  } : r);
  notify();
}

// NoteBlock CRUD (Уровень 4 - необязательный)
export function addNoteBlock(reportId: string, sectionId: string, noteId: string, name: string, description?: string): NoteBlock {
  const noteBlock: NoteBlock = { id: generateId(), name, description, noteId, indicators: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, noteBlocks: [...n.noteBlocks, noteBlock] } : n)
    } : s)
  } : r);
  notify();
  return noteBlock;
}

export function updateNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? { ...nb, name, description } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.filter(nb => nb.id !== noteBlockId)
      } : n)
    } : s)
  } : r);
  notify();
}

// Indicator CRUD (Уровень 4/5)
export function addIndicator(reportId: string, sectionId: string, noteId: string, name: string, description?: string): Indicator {
  const indicator: Indicator = { id: generateId(), name, description, noteId, slices: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, indicators: [...n.indicators, indicator] } : n)
    } : s)
  } : r);
  notify();
  return indicator;
}

export function updateIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? { ...i, name, description } : i)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.filter(i => i.id !== indicatorId)
      } : n)
    } : s)
  } : r);
  notify();
}

// Slice CRUD (Уровень 5/6)
export function addSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string): DataSlice {
  const slice: DataSlice = { id: generateId(), name, description, indicatorId, sources: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? { ...i, slices: [...i.slices, slice] } : i)
      } : n)
    } : s)
  } : r);
  notify();
  return slice;
}

export function updateSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? {
          ...i,
          slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, name, description } : sl)
        } : i)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? {
          ...i,
          slices: i.slices.filter(sl => sl.id !== sliceId)
        } : i)
      } : n)
    } : s)
  } : r);
  notify();
}

// Source CRUD (Уровень 6/7)
export function addSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): DataSource {
  const source: DataSource = { id: generateId(), name, description, sourceTypes, sliceId };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? {
          ...i,
          slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, sources: [...sl.sources, source] } : sl)
        } : i)
      } : n)
    } : s)
  } : r);
  notify();
  return source;
}

export function updateSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? {
          ...i,
          slices: i.slices.map(sl => sl.id === sliceId ? {
            ...sl,
            sources: sl.sources.map(src => src.id === sourceId ? { ...src, name, description, sourceTypes } : src)
          } : sl)
        } : i)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        indicators: n.indicators.map(i => i.id === indicatorId ? {
          ...i,
          slices: i.slices.map(sl => sl.id === sliceId ? {
            ...sl,
            sources: sl.sources.filter(src => src.id !== sourceId)
          } : sl)
        } : i)
      } : n)
    } : s)
  } : r);
  notify();
}

// Note Source CRUD (прямые источники в справке)
export function addNoteSource(reportId: string, sectionId: string, noteId: string, name: string, description?: string, sourceTypes?: SourceType[]): DataSource {
  const source: DataSource = { id: generateId(), name, description, sourceTypes, sliceId: noteId };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, sources: [...n.sources, source] } : n)
    } : s)
  } : r);
  notify();
  return source;
}

export function updateNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        sources: n.sources.map(src => src.id === sourceId ? { ...src, name, description, sourceTypes } : src)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        sources: n.sources.filter(src => src.id !== sourceId)
      } : n)
    } : s)
  } : r);
  notify();
}

// Move functions
export function moveReportUp(id: string) {
  const index = reports.findIndex(r => r.id === id);
  if (index > 0) {
    const newReports = [...reports];
    [newReports[index - 1], newReports[index]] = [newReports[index], newReports[index - 1]];
    // Обновляем sortOrder для всех докладов
    reports = newReports.map((report, idx) => ({ ...report, sortOrder: idx }));
    notify();
  }
}

export function moveReportDown(id: string) {
  const index = reports.findIndex(r => r.id === id);
  if (index < reports.length - 1) {
    const newReports = [...reports];
    [newReports[index], newReports[index + 1]] = [newReports[index + 1], newReports[index]];
    // Обновляем sortOrder для всех докладов
    reports = newReports.map((report, idx) => ({ ...report, sortOrder: idx }));
    notify();
  }
}

export function moveSectionUp(reportId: string, sectionId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      const index = r.sections.findIndex(s => s.id === sectionId);
      if (index > 0) {
        const newSections = [...r.sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        // Обновляем sortOrder для всех разделов
        const sectionsWithOrder = newSections.map((section, idx) => ({
          ...section,
          sortOrder: idx
        }));
        return { ...r, sections: sectionsWithOrder };
      }
    }
    return r;
  });
  notify();
}

export function moveSectionDown(reportId: string, sectionId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      const index = r.sections.findIndex(s => s.id === sectionId);
      if (index < r.sections.length - 1) {
        const newSections = [...r.sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        // Обновляем sortOrder для всех разделов
        const sectionsWithOrder = newSections.map((section, idx) => ({
          ...section,
          sortOrder: idx
        }));
        return { ...r, sections: sectionsWithOrder };
      }
    }
    return r;
  });
  notify();
}

export function moveNoteUp(reportId: string, sectionId: string, noteId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            const index = s.notes.findIndex(n => n.id === noteId);
            if (index > 0) {
              const newNotes = [...s.notes];
              [newNotes[index - 1], newNotes[index]] = [newNotes[index], newNotes[index - 1]];
              // Обновляем sortOrder для всех справок
              const notesWithOrder = newNotes.map((note, idx) => ({ ...note, sortOrder: idx }));
              return { ...s, notes: notesWithOrder };
            }
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteDown(reportId: string, sectionId: string, noteId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            const index = s.notes.findIndex(n => n.id === noteId);
            if (index < s.notes.length - 1) {
              const newNotes = [...s.notes];
              [newNotes[index], newNotes[index + 1]] = [newNotes[index + 1], newNotes[index]];
              // Обновляем sortOrder для всех справок
              const notesWithOrder = newNotes.map((note, idx) => ({ ...note, sortOrder: idx }));
              return { ...s, notes: notesWithOrder };
            }
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteBlock Move
export function moveNoteBlockUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.noteBlocks.findIndex(nb => nb.id === noteBlockId);
                  if (index > 0) {
                    const newBlocks = [...n.noteBlocks];
                    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
                    // Обновляем sortOrder для всех блоков
                    const blocksWithOrder = newBlocks.map((block, idx) => ({ ...block, sortOrder: idx }));
                    return { ...n, noteBlocks: blocksWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteBlockDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.noteBlocks.findIndex(nb => nb.id === noteBlockId);
                  if (index < n.noteBlocks.length - 1) {
                    const newBlocks = [...n.noteBlocks];
                    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
                    // Обновляем sortOrder для всех блоков
                    const blocksWithOrder = newBlocks.map((block, idx) => ({ ...block, sortOrder: idx }));
                    return { ...n, noteBlocks: blocksWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// Indicator Move
export function moveIndicatorUp(reportId: string, sectionId: string, noteId: string, indicatorId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.indicators.findIndex(i => i.id === indicatorId);
                  if (index > 0) {
                    const newIndicators = [...n.indicators];
                    [newIndicators[index - 1], newIndicators[index]] = [newIndicators[index], newIndicators[index - 1]];
                    const indicatorsWithOrder = newIndicators.map((ind, idx) => ({ ...ind, sortOrder: idx }));
                    return { ...n, indicators: indicatorsWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveIndicatorDown(reportId: string, sectionId: string, noteId: string, indicatorId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.indicators.findIndex(i => i.id === indicatorId);
                  if (index < n.indicators.length - 1) {
                    const newIndicators = [...n.indicators];
                    [newIndicators[index], newIndicators[index + 1]] = [newIndicators[index + 1], newIndicators[index]];
                    const indicatorsWithOrder = newIndicators.map((ind, idx) => ({ ...ind, sortOrder: idx }));
                    return { ...n, indicators: indicatorsWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteBlock Indicator Move
export function moveNoteBlockIndicatorUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        const index = nb.indicators.findIndex(i => i.id === indicatorId);
                        if (index > 0) {
                          const newIndicators = [...nb.indicators];
                          [newIndicators[index - 1], newIndicators[index]] = [newIndicators[index], newIndicators[index - 1]];
                          const indicatorsWithOrder = newIndicators.map((ind, idx) => ({ ...ind, sortOrder: idx }));
                          return { ...nb, indicators: indicatorsWithOrder };
                        }
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteBlockIndicatorDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        const index = nb.indicators.findIndex(i => i.id === indicatorId);
                        if (index < nb.indicators.length - 1) {
                          const newIndicators = [...nb.indicators];
                          [newIndicators[index], newIndicators[index + 1]] = [newIndicators[index + 1], newIndicators[index]];
                          const indicatorsWithOrder = newIndicators.map((ind, idx) => ({ ...ind, sortOrder: idx }));
                          return { ...nb, indicators: indicatorsWithOrder };
                        }
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// Slice Move
export function moveSliceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    indicators: n.indicators.map(i => {
                      if (i.id === indicatorId) {
                        const index = i.slices.findIndex(sl => sl.id === sliceId);
                        if (index > 0) {
                          const newSlices = [...i.slices];
                          [newSlices[index - 1], newSlices[index]] = [newSlices[index], newSlices[index - 1]];
                          const slicesWithOrder = newSlices.map((sl, idx) => ({ ...sl, sortOrder: idx }));
                          return { ...i, slices: slicesWithOrder };
                        }
                      }
                      return i;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveSliceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    indicators: n.indicators.map(i => {
                      if (i.id === indicatorId) {
                        const index = i.slices.findIndex(sl => sl.id === sliceId);
                        if (index < i.slices.length - 1) {
                          const newSlices = [...i.slices];
                          [newSlices[index], newSlices[index + 1]] = [newSlices[index + 1], newSlices[index]];
                          const slicesWithOrder = newSlices.map((sl, idx) => ({ ...sl, sortOrder: idx }));
                          return { ...i, slices: slicesWithOrder };
                        }
                      }
                      return i;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteBlock Slice Move
export function moveNoteBlockSliceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        return {
                          ...nb,
                          indicators: nb.indicators.map(i => {
                            if (i.id === indicatorId) {
                              const index = i.slices.findIndex(sl => sl.id === sliceId);
                              if (index > 0) {
                                const newSlices = [...i.slices];
                                [newSlices[index - 1], newSlices[index]] = [newSlices[index], newSlices[index - 1]];
                                const slicesWithOrder = newSlices.map((sl, idx) => ({ ...sl, sortOrder: idx }));
                                return { ...i, slices: slicesWithOrder };
                              }
                            }
                            return i;
                          })
                        };
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteBlockSliceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        return {
                          ...nb,
                          indicators: nb.indicators.map(i => {
                            if (i.id === indicatorId) {
                              const index = i.slices.findIndex(sl => sl.id === sliceId);
                              if (index < i.slices.length - 1) {
                                const newSlices = [...i.slices];
                                [newSlices[index], newSlices[index + 1]] = [newSlices[index + 1], newSlices[index]];
                                const slicesWithOrder = newSlices.map((sl, idx) => ({ ...sl, sortOrder: idx }));
                                return { ...i, slices: slicesWithOrder };
                              }
                            }
                            return i;
                          })
                        };
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// Source Move
export function moveSourceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    indicators: n.indicators.map(i => {
                      if (i.id === indicatorId) {
                        return {
                          ...i,
                          slices: i.slices.map(sl => {
                            if (sl.id === sliceId) {
                              const index = sl.sources.findIndex(src => src.id === sourceId);
                              if (index > 0) {
                                const newSources = [...sl.sources];
                                [newSources[index - 1], newSources[index]] = [newSources[index], newSources[index - 1]];
                                const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                                return { ...sl, sources: sourcesWithOrder };
                              }
                            }
                            return sl;
                          })
                        };
                      }
                      return i;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveSourceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    indicators: n.indicators.map(i => {
                      if (i.id === indicatorId) {
                        return {
                          ...i,
                          slices: i.slices.map(sl => {
                            if (sl.id === sliceId) {
                              const index = sl.sources.findIndex(src => src.id === sourceId);
                              if (index < sl.sources.length - 1) {
                                const newSources = [...sl.sources];
                                [newSources[index], newSources[index + 1]] = [newSources[index + 1], newSources[index]];
                                const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                                return { ...sl, sources: sourcesWithOrder };
                              }
                            }
                            return sl;
                          })
                        };
                      }
                      return i;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteSource Move
export function moveNoteSourceUp(reportId: string, sectionId: string, noteId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.sources.findIndex(src => src.id === sourceId);
                  if (index > 0) {
                    const newSources = [...n.sources];
                    [newSources[index - 1], newSources[index]] = [newSources[index], newSources[index - 1]];
                    const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                    return { ...n, sources: sourcesWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteSourceDown(reportId: string, sectionId: string, noteId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  const index = n.sources.findIndex(src => src.id === sourceId);
                  if (index < n.sources.length - 1) {
                    const newSources = [...n.sources];
                    [newSources[index], newSources[index + 1]] = [newSources[index + 1], newSources[index]];
                    const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                    return { ...n, sources: sourcesWithOrder };
                  }
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteBlock Source Move
export function moveNoteBlockSourceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        return {
                          ...nb,
                          indicators: nb.indicators.map(i => {
                            if (i.id === indicatorId) {
                              return {
                                ...i,
                                slices: i.slices.map(sl => {
                                  if (sl.id === sliceId) {
                                    const index = sl.sources.findIndex(src => src.id === sourceId);
                                    if (index > 0) {
                                      const newSources = [...sl.sources];
                                      [newSources[index - 1], newSources[index]] = [newSources[index], newSources[index - 1]];
                                      const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                                      return { ...sl, sources: sourcesWithOrder };
                                    }
                                  }
                                  return sl;
                                })
                              };
                            }
                            return i;
                          })
                        };
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

export function moveNoteBlockSourceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        sections: r.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              notes: s.notes.map(n => {
                if (n.id === noteId) {
                  return {
                    ...n,
                    noteBlocks: n.noteBlocks.map(nb => {
                      if (nb.id === noteBlockId) {
                        return {
                          ...nb,
                          indicators: nb.indicators.map(i => {
                            if (i.id === indicatorId) {
                              return {
                                ...i,
                                slices: i.slices.map(sl => {
                                  if (sl.id === sliceId) {
                                    const index = sl.sources.findIndex(src => src.id === sourceId);
                                    if (index < sl.sources.length - 1) {
                                      const newSources = [...sl.sources];
                                      [newSources[index], newSources[index + 1]] = [newSources[index + 1], newSources[index]];
                                      const sourcesWithOrder = newSources.map((src, idx) => ({ ...src, sortOrder: idx }));
                                      return { ...sl, sources: sourcesWithOrder };
                                    }
                                  }
                                  return sl;
                                })
                              };
                            }
                            return i;
                          })
                        };
                      }
                      return nb;
                    })
                  };
                }
                return n;
              })
            };
          }
          return s;
        })
      };
    }
    return r;
  });
  notify();
}

// NoteBlock Indicator CRUD
export function addNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Indicator {
  const indicator: Indicator = { id: generateId(), name, description, noteId, slices: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? { ...nb, indicators: [...nb.indicators, indicator] } : nb)
      } : n)
    } : s)
  } : r);
  notify();
  return indicator;
}

export function updateNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? { ...i, name, description } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.filter(i => i.id !== indicatorId)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

// NoteBlock Slice CRUD
export function addNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): DataSlice {
  const slice: DataSlice = { id: generateId(), name, description, indicatorId, sources: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? { ...i, slices: [...i.slices, slice] } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
  return slice;
}

export function updateNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? {
            ...i,
            slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, name, description } : sl)
          } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? {
            ...i,
            slices: i.slices.filter(sl => sl.id !== sliceId)
          } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

// NoteBlock Source CRUD
export function addNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): DataSource {
  const source: DataSource = { id: generateId(), name, description, sourceTypes, sliceId };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? {
            ...i,
            slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, sources: [...sl.sources, source] } : sl)
          } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
  return source;
}

export function updateNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? {
            ...i,
            slices: i.slices.map(sl => sl.id === sliceId ? {
              ...sl,
              sources: sl.sources.map(src => src.id === sourceId ? { ...src, name, description, sourceTypes } : src)
            } : sl)
          } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

export function deleteNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        noteBlocks: n.noteBlocks.map(nb => nb.id === noteBlockId ? {
          ...nb,
          indicators: nb.indicators.map(i => i.id === indicatorId ? {
            ...i,
            slices: i.slices.map(sl => sl.id === sliceId ? {
              ...sl,
              sources: sl.sources.filter(src => src.id !== sourceId)
            } : sl)
          } : i)
        } : nb)
      } : n)
    } : s)
  } : r);
  notify();
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    let reportsToImport: any[];
    
    // Поддержка обоих форматов: массив или объект с ключом "reports"
    if (Array.isArray(data)) {
      reportsToImport = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.reports)) {
      reportsToImport = data.reports;
    } else {
      console.error('Неверный формат данных: ожидается массив или объект с ключом "reports"');
      return false;
    }
    
    console.log('Импортируется отчетов:', reportsToImport.length);
    
    // Генерируем новые ID для всех элементов
    const importedReports = reportsToImport.map(report => {
      const newReportId = generateId();
      
      return {
        ...report,
        id: newReportId,
        sections: (report.sections || []).map((section: any) => {
          const newSectionId = generateId();
          
          return {
            ...section,
            id: newSectionId,
            reportId: newReportId,
            notes: (section.notes || []).map((note: any) => {
              const newNoteId = generateId();
              
              return {
                ...note,
                id: newNoteId,
                sectionId: newSectionId,
                noteBlocks: (note.noteBlocks || []).map((noteBlock: any) => {
                  const newNoteBlockId = generateId();
                  
                  return {
                    ...noteBlock,
                    id: newNoteBlockId,
                    noteId: newNoteId,
                    indicators: (noteBlock.indicators || []).map((indicator: any) => {
                      const newIndicatorId = generateId();
                      
                      return {
                        ...indicator,
                        id: newIndicatorId,
                        noteId: newNoteId,
                        slices: (indicator.slices || []).map((slice: any) => {
                          const newSliceId = generateId();
                          
                          return {
                            ...slice,
                            id: newSliceId,
                            indicatorId: newIndicatorId,
                            sources: (slice.sources || []).map((source: any) => ({
                              ...source,
                              id: generateId(),
                              sliceId: newSliceId
                            }))
                          };
                        })
                      };
                    })
                  };
                }),
                indicators: (note.indicators || []).map((indicator: any) => {
                  const newIndicatorId = generateId();
                  
                  return {
                    ...indicator,
                    id: newIndicatorId,
                    noteId: newNoteId,
                    slices: (indicator.slices || []).map((slice: any) => {
                      const newSliceId = generateId();
                      
                      return {
                        ...slice,
                        id: newSliceId,
                        indicatorId: newIndicatorId,
                        sources: (slice.sources || []).map((source: any) => ({
                          ...source,
                          id: generateId(),
                          sliceId: newSliceId
                        }))
                      };
                    })
                  };
                }),
                sources: (note.sources || []).map((source: any) => ({
                  ...source,
                  id: generateId(),
                  sliceId: newNoteId
                }))
              };
            })
          };
        })
      };
    });
    
    reports = [...reports, ...importedReports];
    notify();
    return true;
  } catch (error) {
    console.error('Ошибка импорта:', error);
    return false;
  }
}

export function exportData(): string {
  // Рекурсивно удаляем все ID и ссылки на ID для удобного импорта
  const removeIds = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeIds);
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        // Пропускаем поля id и все поля заканчивающиеся на Id
        if (key === 'id' || key.endsWith('Id')) {
          continue;
        }
        result[key] = removeIds(obj[key]);
      }
      return result;
    }
    return obj;
  };
  
  const exportableReports = removeIds(reports);
  return JSON.stringify(exportableReports, null, 2);
}

export function resetData() {
  reports = getDefaultData();
  notify();
}
