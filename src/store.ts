import { Report, Section, Note, Indicator, DataSlice, DataSource } from './types';

const STORAGE_KEY = 'report_data_sources_reference';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadData(): Report[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return getDefaultData();
}

function saveData(reports: Report[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving data:', e);
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
              name: 'Методические пояснения',
              description: 'Данные приведены по состоянию на 01.01.2024',
              sectionId: 'section-1'
            }
          ],
          indicators: [
            {
              id: 'indicator-1',
              name: 'Численность населения',
              description: 'Общая численность постоянного населения',
              sectionId: 'section-1',
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
                      sliceId: 'slice-1'
                    },
                    {
                      id: 'source-2',
                      name: 'ЗАГС',
                      description: 'Данные о регистрации актов гражданского состояния',
                      sliceId: 'slice-1'
                    }
                  ]
                },
                {
                  id: 'slice-2',
                  name: 'По возрастным группам',
                  description: 'Разбивка по возрастным группам',
                  indicatorId: 'indicator-1',
                  sources: [
                    {
                      id: 'source-3',
                      name: 'Перепись населения 2020',
                      description: 'Данные Всероссийской переписи населения',
                      sliceId: 'slice-2'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'section-2',
          name: 'Экономика',
          description: 'Раздел об экономических показателях',
          reportId: 'report-1',
          notes: [],
          indicators: [
            {
              id: 'indicator-2',
              name: 'ВРП',
              description: 'Валовой региональный продукт',
              sectionId: 'section-2',
              slices: [
                {
                  id: 'slice-3',
                  name: 'По видам экономической деятельности',
                  description: '',
                  indicatorId: 'indicator-2',
                  sources: [
                    {
                      id: 'source-4',
                      name: 'Росстат (форма 1-ВРП)',
                      description: 'Данные о валовом региональном продукте',
                      sliceId: 'slice-3'
                    }
                  ]
                }
              ]
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

export function getReport(id: string): Report | undefined {
  return reports.find(r => r.id === id);
}

// Report CRUD
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

// Section CRUD
export function addSection(reportId: string, name: string, description?: string): Section {
  const section: Section = { id: generateId(), name, description, reportId, notes: [], indicators: [] };
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

// Note CRUD
export function addNote(reportId: string, sectionId: string, name: string, description?: string): Note {
  const note: Note = { id: generateId(), name, description, sectionId };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? { ...s, notes: [...s.notes, note] } : s)
  } : r);
  notify();
  return note;
}

export function updateNote(reportId: string, sectionId: string, noteId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, name, description } : n)
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

// Indicator CRUD
export function addIndicator(reportId: string, sectionId: string, name: string, description?: string): Indicator {
  const indicator: Indicator = { id: generateId(), name, description, sectionId, slices: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? { ...s, indicators: [...s.indicators, indicator] } : s)
  } : r);
  notify();
  return indicator;
}

export function updateIndicator(reportId: string, sectionId: string, indicatorId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? { ...i, name, description } : i)
    } : s)
  } : r);
  notify();
}

export function deleteIndicator(reportId: string, sectionId: string, indicatorId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.filter(i => i.id !== indicatorId)
    } : s)
  } : r);
  notify();
}

// Slice CRUD
export function addSlice(reportId: string, sectionId: string, indicatorId: string, name: string, description?: string): DataSlice {
  const slice: DataSlice = { id: generateId(), name, description, indicatorId, sources: [] };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? { ...i, slices: [...i.slices, slice] } : i)
    } : s)
  } : r);
  notify();
  return slice;
}

export function updateSlice(reportId: string, sectionId: string, indicatorId: string, sliceId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? {
        ...i,
        slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, name, description } : sl)
      } : i)
    } : s)
  } : r);
  notify();
}

export function deleteSlice(reportId: string, sectionId: string, indicatorId: string, sliceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? {
        ...i,
        slices: i.slices.filter(sl => sl.id !== sliceId)
      } : i)
    } : s)
  } : r);
  notify();
}

// Source CRUD
export function addSource(reportId: string, sectionId: string, indicatorId: string, sliceId: string, name: string, description?: string): DataSource {
  const source: DataSource = { id: generateId(), name, description, sliceId };
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? {
        ...i,
        slices: i.slices.map(sl => sl.id === sliceId ? { ...sl, sources: [...sl.sources, source] } : sl)
      } : i)
    } : s)
  } : r);
  notify();
  return source;
}

export function updateSource(reportId: string, sectionId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? {
        ...i,
        slices: i.slices.map(sl => sl.id === sliceId ? {
          ...sl,
          sources: sl.sources.map(src => src.id === sourceId ? { ...src, name, description } : src)
        } : sl)
      } : i)
    } : s)
  } : r);
  notify();
}

export function deleteSource(reportId: string, sectionId: string, indicatorId: string, sliceId: string, sourceId: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      indicators: s.indicators.map(i => i.id === indicatorId ? {
        ...i,
        slices: i.slices.map(sl => sl.id === sliceId ? {
          ...sl,
          sources: sl.sources.filter(src => src.id !== sourceId)
        } : sl)
      } : i)
    } : s)
  } : r);
  notify();
}

export function resetData() {
  reports = getDefaultData();
  notify();
}

export function exportData(): string {
  return JSON.stringify(reports, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      reports = data;
      notify();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
