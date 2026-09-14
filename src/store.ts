import { Report, Section, Note, Indicator, DataSlice, DataSource } from './types';

const STORAGE_KEY = 'report_data_sources_reference_v3';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadData(): Report[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old data: add 'sources' array to notes if missing
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
              description: 'Справка о текущей численности и составе населения региона',
              sectionId: 'section-1',
              sources: [],
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
            }
          ]
        },
        {
          id: 'section-2',
          name: 'Экономика',
          description: 'Раздел об экономических показателях',
          reportId: 'report-1',
          notes: [
            {
              id: 'note-2',
              name: 'Валовой региональный продукт',
              description: 'Справка о ВРП и его динамике',
              sectionId: 'section-2',
              sources: [],
              indicators: [
                {
                  id: 'indicator-2',
                  name: 'ВРП',
                  description: 'Валовой региональный продукт',
                  noteId: 'note-2',
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
      ]
    },
    {
      id: 'report-2',
      name: 'Анализ инвестиционного климата 2024',
      description: 'Доклад об инвестиционной привлекательности региона',
      sections: [
        {
          id: 'section-3',
          name: 'Инвестиции в основной капитал',
          description: 'Раздел об инвестициях в основной капитал',
          reportId: 'report-2',
          notes: [
            {
              id: 'note-3',
              name: 'Объем инвестиций',
              description: 'Справка об объеме инвестиций в основной капитал',
              sectionId: 'section-3',
              sources: [],
              indicators: [
                {
                  id: 'indicator-3',
                  name: 'Инвестиции в основной капитал',
                  description: 'Объем инвестиций в основной капитал',
                  noteId: 'note-3',
                  slices: [
                    {
                      id: 'slice-4',
                      name: 'По источникам финансирования',
                      description: 'Разбивка по источникам финансирования',
                      indicatorId: 'indicator-3',
                      sources: [
                        {
                          id: 'source-5',
                          name: 'Росстат (форма 1-инвестиции)',
                          description: 'Данные Федеральной службы государственной статистики',
                          sliceId: 'slice-4'
                        }
                      ]
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
export function addNote(reportId: string, sectionId: string, name: string, description?: string): Note {
  const note: Note = { id: generateId(), name, description, sectionId, indicators: [], sources: [] };
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

// Note Source CRUD (Уровень 6 - напрямую в справке)
export function addNoteSource(reportId: string, sectionId: string, noteId: string, name: string, description?: string): DataSource {
  const source: DataSource = { id: generateId(), name, description, sliceId: noteId };
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

export function updateNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string, name: string, description?: string) {
  reports = reports.map(r => r.id === reportId ? {
    ...r,
    sections: r.sections.map(s => s.id === sectionId ? {
      ...s,
      notes: s.notes.map(n => n.id === noteId ? {
        ...n,
        sources: n.sources.map(src => src.id === sourceId ? { ...src, name, description } : src)
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

// Indicator CRUD (Уровень 4)
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

// Slice CRUD (Уровень 5)
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

// Source CRUD (Уровень 6)
export function addSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string): DataSource {
  const source: DataSource = { id: generateId(), name, description, sliceId };
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

export function updateSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string) {
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
            sources: sl.sources.map(src => src.id === sourceId ? { ...src, name, description } : src)
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
