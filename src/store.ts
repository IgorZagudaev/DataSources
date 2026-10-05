import { Report, Section, Note, NoteBlock, Indicator, DataSlice, DataSource, SourceType } from './types';
import * as api from './api';

const STORAGE_KEY = 'report_data_sources_reference_v3';
const MODE_KEY = 'data_source_mode';
// Ключ для черновика несохранённых изменений в режиме API
const DRAFT_KEY = 'report_data_sources_draft_v1';

// Режим работы: 'local' (localStorage) или 'api' (PostgreSQL)
export type DataSourceMode = 'local' | 'api';

function getMode(): DataSourceMode {
  // Сначала проверяем localStorage (значение перезапишется конфигом сервера в loadConfig)
  const savedMode = localStorage.getItem(MODE_KEY) as DataSourceMode;
  if (savedMode) {
    return savedMode;
  }

  // Если в localStorage нет — временно локальный режим,
  // окончательно режим определяется настройкой сервера
  return 'local';
}

// Загрузка конфигурации с сервера
export async function loadConfig(): Promise<void> {
  try {
    const response = await fetch('/DataSources/api/config-endpoint.php');
    if (response.ok) {
      const config = await response.json();
      console.log('Config loaded from server:', config);

      // Режим работы задаётся настройкой сервера (config.php / config.local.php).
      // Значение из localStorage только запоминается следом, иначе после смены
      // default_mode в конфиге браузер оставался в старом режиме.
      if (config.default_mode === 'api' || config.default_mode === 'local') {
        currentMode = config.default_mode;
        localStorage.setItem(MODE_KEY, config.default_mode);
        console.log('Mode set from server config:', config.default_mode);
      }
    }
  } catch (error) {
    // Сервер недоступен (например, запущен только Vite) — работаем в режиме из localStorage
    console.error('Error loading config:', error);
  }
}

export async function setMode(mode: DataSourceMode): Promise<void> {
  console.log('setMode called with mode:', mode);
  localStorage.setItem(MODE_KEY, mode);
  currentMode = mode;
  
  if (mode === 'api') {
    console.log('Switching to API mode, syncing from API...');
    // Для API режима загружаем данные асинхронно
    await syncFromAPI();
  } else {
    console.log('Switching to local mode, loading from localStorage...');
    // Для локального режима загружаем из localStorage
    reports = loadData();
    updateSaveState({ hasUnsavedChanges: false, isSaving: false, error: null });
    notify();
  }
}

export function getDataSourceMode(): DataSourceMode {
  return currentMode;
}

let currentMode: DataSourceMode = getMode();
let isLoadingFromAPI = false; // Флаг для предотвращения обратной синхронизации при загрузке

// Состояние записи в БД: изменения копятся локально и уходят на сервер
// только по кнопке «Сохранить в БД»
export interface SaveState {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  error: string | null;
  // Когда был сохранён черновик несохранённых изменений (для предупреждения об устаревших правках)
  draftSavedAt: number | null;
}

let saveState: SaveState = { hasUnsavedChanges: false, isSaving: false, error: null, draftSavedAt: null };

function updateSaveState(patch: Partial<SaveState>): void {
  const next: SaveState = { ...saveState, ...patch };
  if (
    next.hasUnsavedChanges === saveState.hasUnsavedChanges &&
    next.isSaving === saveState.isSaving &&
    next.error === saveState.error &&
    next.draftSavedAt === saveState.draftSavedAt
  ) {
    return;
  }
  saveState = next;
  listeners.forEach(l => l());
}

export function getSaveState(): SaveState {
  return saveState;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Преобразование snake_case в camelCase для фронтенда
// Преобразование snake_case в camelCase
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

async function loadFromAPI(): Promise<Report[] | null> {
  try {
    console.log('Loading data from API...');
    const data = await api.fetchReports();
    console.log('Data received from API:', data);
    console.log('Number of reports:', data.length);
    
    // Проверяем структуру данных
    if (!Array.isArray(data)) {
      console.error('API returned non-array data:', data);
      return null;
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
    return null;
  }
}

// ============================================================
// Черновик несохранённых изменений (режим API)
// ============================================================

interface Draft {
  reports: Report[];
  savedAt: number | null;
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    // Текущий формат: { savedAt, reports }; простой массив поддержан на случай старых записей
    if (Array.isArray(parsed)) {
      return { reports: parsed, savedAt: null };
    }
    if (parsed && Array.isArray(parsed.reports)) {
      return { reports: parsed.reports, savedAt: parsed.savedAt ?? null };
    }
  } catch (e) {
    console.error('Error loading draft', e);
  }
  return null;
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error('Error clearing draft', e);
  }
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
      // Migrate old data: add 'sources' and 'noteBlocks' arrays to notes if missing
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

// Асинхронная загрузка данных из API
export async function syncFromAPI(): Promise<void> {
  console.log('syncFromAPI called, current mode:', currentMode);
  if (currentMode !== 'api') {
    console.log('Mode is not API, skipping sync');
    return;
  }

  isLoadingFromAPI = true; // Устанавливаем флаг перед загрузкой
  try {
    // Если остался черновик несохранённых изменений — восстанавливаем его,
    // а не данные из БД, чтобы правки не потерялись при обновлении страницы
    const draft = loadDraft();
    if (draft) {
      console.log('Restoring unsaved draft:', draft.reports.length, 'reports');
      reports = draft.reports;
      updateSaveState({
        hasUnsavedChanges: true,
        isSaving: false,
        error: null,
        draftSavedAt: draft.savedAt
      });
      return;
    }

    console.log('Mode is API, loading data...');
    const data = await loadFromAPI();
    if (data === null) {
      updateSaveState({ error: 'Не удалось загрузить данные из БД', isSaving: false });
      return;
    }
    console.log('Updating reports with', data.length, 'items');
    // Пустая БД — тоже валидный ответ, показываем пустой справочник,
    // а не данные, оставшиеся от локального режима
    reports = data;
    if (data.length === 0) {
      console.warn('В БД нет докладов');
    }
    updateSaveState({ hasUnsavedChanges: false, isSaving: false, error: null, draftSavedAt: null });
  } finally {
    isLoadingFromAPI = false; // Сбрасываем флаг после загрузки
    listeners.forEach(l => l());
  }
}

// Отмена несохранённых изменений: черновик удаляется, данные перечитываются из БД
export async function discardChangesAndReload(): Promise<boolean> {
  if (currentMode !== 'api') {
    return false;
  }

  console.log('Discarding unsaved changes, reloading from API...');
  isLoadingFromAPI = true;
  try {
    const data = await loadFromAPI();
    if (data === null) {
      updateSaveState({ error: 'Не удалось загрузить данные из БД', isSaving: false });
      return false;
    }
    clearDraft();
    reports = data;
    updateSaveState({ hasUnsavedChanges: false, isSaving: false, error: null, draftSavedAt: null });
    return true;
  } finally {
    isLoadingFromAPI = false;
    listeners.forEach(l => l());
  }
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

export interface SaveResult {
  success: boolean;
  error?: string;
}

// Запись всех данных в БД. Вызывается только по кнопке «Сохранить в БД»,
// автоматической записи при редактировании больше нет.
export async function saveToAPI(): Promise<SaveResult> {
  console.log('saveToAPI called, currentMode:', currentMode);

  if (currentMode !== 'api') {
    return { success: false, error: 'Запись в БД доступна только в режиме API' };
  }
  if (saveState.isSaving) {
    return { success: false, error: 'Запись уже выполняется' };
  }

  updateSaveState({ isSaving: true, error: null });

  try {
    // Преобразуем данные в snake_case перед отправкой
    const reportsToSend = convertToSnakeCase(reports);
    console.log('Reports to send:', reportsToSend.length);

    const result = await api.importAllReports(reportsToSend);

    if (!result || result.success === false) {
      throw new Error((result && result.error) || 'БД вернула ошибку при записи');
    }

    // Запись прошла успешно — черновик больше не нужен
    clearDraft();
    updateSaveState({ hasUnsavedChanges: false, isSaving: false, error: null, draftSavedAt: null });
    console.log('Data saved to API');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Error saving to API:', e);
    // Изменения остаются в черновике, их можно записать повторно
    updateSaveState({ isSaving: false, error: message });
    return { success: false, error: message };
  }
}

function saveData(reports: Report[]): void {
  try {
    // В режиме API данные не уходят в БД автоматически: изменения хранятся
    // в localStorage как черновик до нажатия кнопки «Сохранить в БД»
    if (currentMode === 'api') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), reports }));
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
              description: 'Справка о текущей численности и составе населения региона',
              sectionId: 'section-1',
              noteBlocks: [],
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
              noteBlocks: [],
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
              noteBlocks: [],
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
  // Во время загрузки из БД ничего не сохраняем и не помечаем как изменённое
  if (!isLoadingFromAPI) {
    saveData(reports);
    // В режиме API изменения только помечаются как несохранённые:
    // запись в БД выполняется по кнопке «Сохранить в БД» (saveToAPI)
    if (currentMode === 'api') {
      updateSaveState({ hasUnsavedChanges: true, error: null, draftSavedAt: Date.now() });
    }
  }
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
  const maxSortOrder = Math.max(-1, ...reports.map(r => r.sortOrder ?? -1));
  const report: Report = { id: generateId(), name, description, sortOrder: maxSortOrder + 1, sections: [] };
  reports = [...reports, report];
  notify();
  return report;
}

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
  const report = reports.find(r => r.id === reportId);
  const maxSortOrder = report ? Math.max(-1, ...report.sections.map(s => s.sortOrder ?? -1)) : -1;
  const section: Section = { id: generateId(), name, description, reportId, sortOrder: maxSortOrder + 1, notes: [] };
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

export function moveSectionUp(reportId: string, sectionId: string) {
  reports = reports.map(r => {
    if (r.id === reportId) {
      const index = r.sections.findIndex(s => s.id === sectionId);
      if (index > 0) {
        const newSections = [...r.sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        // Обновляем sort_order для всех разделов
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
        // Обновляем sort_order для всех разделов
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

// Note CRUD (Уровень 3)
export function addNote(reportId: string, sectionId: string, name: string, description?: string, shortName?: string): Note {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const maxSortOrder = section ? Math.max(-1, ...section.notes.map(n => n.sortOrder ?? -1)) : -1;
  const note: Note = { id: generateId(), name, shortName, description, sectionId, sortOrder: maxSortOrder + 1, noteBlocks: [], indicators: [], sources: [] };
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

// NoteBlock CRUD (Уровень 4 - необязательный)
export function addNoteBlock(reportId: string, sectionId: string, noteId: string, name: string, description?: string): NoteBlock {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const note = section?.notes.find(n => n.id === noteId);
  const maxSortOrder = note ? Math.max(-1, ...note.noteBlocks.map(nb => nb.sortOrder ?? -1)) : -1;
  const noteBlock: NoteBlock = { id: generateId(), name, description, noteId, sortOrder: maxSortOrder + 1, indicators: [] };
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

// NoteBlock Indicator CRUD (Показатели в блоке справки)
export function addNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Indicator {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const note = section?.notes.find(n => n.id === noteId);
  const noteBlock = note?.noteBlocks.find(nb => nb.id === noteBlockId);
  const maxSortOrder = noteBlock ? Math.max(-1, ...noteBlock.indicators.map(i => i.sortOrder ?? -1)) : -1;
  const indicator: Indicator = { id: generateId(), name, description, noteId, sortOrder: maxSortOrder + 1, slices: [] };
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
                          return { ...nb, indicators: newIndicators };
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
                          return { ...nb, indicators: newIndicators };
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

// NoteBlock Slice CRUD (Разрезы в показателях блока справки)
export function addNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): DataSlice {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const note = section?.notes.find(n => n.id === noteId);
  const noteBlock = note?.noteBlocks.find(nb => nb.id === noteBlockId);
  const indicator = noteBlock?.indicators.find(i => i.id === indicatorId);
  const maxSortOrder = indicator ? Math.max(-1, ...indicator.slices.map(s => s.sortOrder ?? -1)) : -1;
  const slice: DataSlice = { id: generateId(), name, description, indicatorId, sortOrder: maxSortOrder + 1, sources: [] };
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
                                return { ...i, slices: newSlices };
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
                                return { ...i, slices: newSlices };
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

// NoteBlock Source CRUD (Источники в разрезах блока справки)
export function addNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): DataSource {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const note = section?.notes.find(n => n.id === noteId);
  const noteBlock = note?.noteBlocks.find(nb => nb.id === noteBlockId);
  const indicator = noteBlock?.indicators.find(i => i.id === indicatorId);
  const slice = indicator?.slices.find(sl => sl.id === sliceId);
  const maxSortOrder = slice ? Math.max(-1, ...slice.sources.map(src => src.sortOrder ?? -1)) : -1;
  const source: DataSource = { id: generateId(), name, description, sourceTypes, sliceId, sortOrder: maxSortOrder + 1 };
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
                                      return { ...sl, sources: newSources };
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
                                      return { ...sl, sources: newSources };
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



// Note Source CRUD (Уровень 6 - напрямую в справке)
export function addNoteSource(reportId: string, sectionId: string, noteId: string, name: string, description?: string, sourceTypes?: SourceType[]): DataSource {
  const report = reports.find(r => r.id === reportId);
  const section = report?.sections.find(s => s.id === sectionId);
  const note = section?.notes.find(n => n.id === noteId);
  const maxSortOrder = note ? Math.max(-1, ...note.sources.map(src => src.sortOrder ?? -1)) : -1;
  const source: DataSource = { id: generateId(), name, description, sourceTypes, sliceId: noteId, sortOrder: maxSortOrder + 1 };
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
                    return { ...n, sources: newSources };
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
                    return { ...n, sources: newSources };
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
                    return { ...n, indicators: newIndicators };
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
                    return { ...n, indicators: newIndicators };
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
                          return { ...i, slices: newSlices };
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
                          return { ...i, slices: newSlices };
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

// Source CRUD (Уровень 6)
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
                                return { ...sl, sources: newSources };
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
                                return { ...sl, sources: newSources };
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

export function resetData() {
  reports = getDefaultData();
  notify();
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

export function importData(json: string, mergeDuplicates: boolean = false): boolean {
  try {
    console.log('=== НАЧАЛО importData ===');
    console.log('Начало импорта, JSON длина:', json.length);
    console.log('mergeDuplicates:', mergeDuplicates);
    const data = JSON.parse(json);
    console.log('JSON распарсен:', data);
    let reportsToImport: any[];
    
    // Поддержка обоих форматов: массив или объект с ключом "reports"
    if (Array.isArray(data)) {
      console.log('Формат: массив');
      reportsToImport = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.reports)) {
      console.log('Формат: объект с reports');
      reportsToImport = data.reports;
    } else {
      console.error('Неверный формат данных: ожидается массив или объект с ключом "reports"');
      return false;
    }
    
    console.log('Импортируется отчетов:', reportsToImport.length);
    
    // Если включено объединение дубликатов
    if (mergeDuplicates) {
      console.log('Режим объединения дубликатов включен');
      
      reportsToImport.forEach(importedReport => {
        // Ищем существующий доклад с таким же названием
        const existingReport = reports.find(r => r.name === importedReport.name);
        
        if (existingReport) {
          console.log(`Найден существующий доклад "${importedReport.name}", добавляем разделы`);
          
          // Добавляем новые разделы в существующий доклад
          const newSections = (importedReport.sections || []).map((section: any) => {
            const newSectionId = generateId();
            
            return {
              ...section,
              id: newSectionId,
              reportId: existingReport.id,
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
          });
          
          // Добавляем новые разделы к существующему докладу
          existingReport.sections = [...existingReport.sections, ...newSections];
        } else {
          console.log(`Доклад "${importedReport.name}" не найден, создаем новый`);
          
          // Создаем новый доклад как обычно
          const newReportId = generateId();
          const newReport = {
            ...importedReport,
            id: newReportId,
            sections: (importedReport.sections || []).map((section: any) => {
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
          
          reports.push(newReport);
        }
      });
      
      console.log('Объединение дубликатов завершено');
      notify();
      return true;
    }
    
    // Обычный режим - создаем новые доклады
    console.log('Обычный режим импорта');
    
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
    
    console.log('Импортированные отчеты:', importedReports);
    // Добавляем новые данные к существующим, а не заменяем
    reports = [...reports, ...importedReports];
    console.log('Новые данные добавлены к существующим');
    notify();
    console.log('notify() вызван');
    console.log('=== КОНЕЦ importData (успех) ===');
    return true;
  } catch (error) {
    console.error('=== ОШИБКА importData ===');
    console.error('Ошибка импорта:', error);
    console.error('=== КОНЕЦ importData (ошибка) ===');
    return false;
  }
}
