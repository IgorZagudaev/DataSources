import { Report, Section, Note, NoteBlock, Indicator, DataSlice, DataSource, SourceType } from './types';
import * as api from './api';

let reports: Report[] = [];
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(l => l());
}

// Экспортируем notify для использования в других модулях
export { notify };

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function getReports(): Report[] {
  return reports;
}

// Загрузка всех данных из API
export async function loadReports(): Promise<void> {
  try {
    console.log('Loading reports from API...');
    const startTime = performance.now();
    reports = await api.fetchReports();
    const endTime = performance.now();
    console.log(`Reports loaded in ${(endTime - startTime).toFixed(2)}ms`);
    notify();
  } catch (e) {
    console.error('Error loading reports:', e);
    throw e;
  }
}

// Загрузка ветки иерархии для конкретного элемента
export async function loadHierarchy(level: string, id: string): Promise<void> {
  try {
    console.log(`Loading hierarchy for ${level}/${id}...`);
    const startTime = performance.now();
    
    const hierarchy = await api.fetchHierarchy(level, id);
    
    // Локальное обновление состояния
    reports = updateLocalState(reports, hierarchy);
    
    const endTime = performance.now();
    console.log(`Hierarchy loaded in ${(endTime - startTime).toFixed(2)}ms`);
    notify();
  } catch (e) {
    console.error(`Error loading hierarchy for ${level}/${id}:`, e);
    // Fallback: загрузка всех данных
    console.log('Falling back to full data load...');
    await loadReports();
  }
}

// Локальное обновление состояния на основе полученной иерархии
function updateLocalState(currentReports: any[], hierarchy: any): any[] {
  if (!hierarchy || !hierarchy.id) {
    return currentReports;
  }
  
  // Находим и обновляем только изменённый доклад
  return currentReports.map(report => {
    if (report.id === hierarchy.id) {
      return mergeHierarchy(report, hierarchy);
    }
    return report;
  });
}

// Слияние иерархии с существующим докладом
function mergeHierarchy(existingReport: any, newReport: any): any {
  if (!newReport) return existingReport;
  
  return {
    ...existingReport,
    ...newReport,
    sections: (newReport.sections || []).map((newSection: any) => {
      const existingSection = existingReport.sections?.find((s: any) => s.id === newSection.id);
      return mergeSection(existingSection || {}, newSection);
    })
  };
}

function mergeSection(existingSection: any, newSection: any): any {
  return {
    ...existingSection,
    ...newSection,
    notes: (newSection.notes || []).map((newNote: any) => {
      const existingNote = existingSection.notes?.find((n: any) => n.id === newNote.id);
      return mergeNote(existingNote || {}, newNote);
    })
  };
}

function mergeNote(existingNote: any, newNote: any): any {
  return {
    ...existingNote,
    ...newNote,
    note_blocks: newNote.note_blocks || existingNote.note_blocks || [],
    indicators: (newNote.indicators || []).map((newIndicator: any) => {
      const existingIndicator = existingNote.indicators?.find((i: any) => i.id === newIndicator.id);
      return mergeIndicator(existingIndicator || {}, newIndicator);
    }),
    sources: newNote.sources || existingNote.sources || []
  };
}

function mergeIndicator(existingIndicator: any, newIndicator: any): any {
  return {
    ...existingIndicator,
    ...newIndicator,
    slices: (newIndicator.slices || []).map((newSlice: any) => {
      const existingSlice = existingIndicator.slices?.find((s: any) => s.id === newSlice.id);
      return mergeSlice(existingSlice || {}, newSlice);
    })
  };
}

function mergeSlice(existingSlice: any, newSlice: any): any {
  return {
    ...existingSlice,
    ...newSlice,
    sources: newSlice.sources || existingSlice.sources || []
  };
}

// Reports
export async function addReport(name: string, description?: string): Promise<Report> {
  const result = await api.createReport({ name, description });
  await loadReports(); // Для добавления нужна полная загрузка
  return result;
}

export async function updateReport(id: string, name: string, description?: string): Promise<void> {
  await api.updateReport(id, { name, description });
  await loadHierarchy('reports', id); // Частичная загрузка
}

export async function deleteReport(id: string): Promise<void> {
  await api.deleteReport(id);
  await loadReports(); // Для удаления нужна полная загрузка
}

// Sections
export async function addSection(reportId: string, name: string, description?: string): Promise<Section> {
  const result = await api.createSection({ report_id: reportId, name, description });
  await loadHierarchy('reports', reportId); // Загружаем весь доклад с новыми данными
  return result;
}

export async function updateSection(reportId: string, sectionId: string, name: string, description?: string): Promise<void> {
  await api.updateSection(sectionId, { name, description });
  await loadHierarchy('sections', sectionId); // Частичная загрузка
}

export async function deleteSection(reportId: string, sectionId: string): Promise<void> {
  await api.deleteSection(sectionId);
  await loadHierarchy('reports', reportId); // Загружаем доклад без удалённого раздела
}

// Notes
export async function addNote(reportId: string, sectionId: string, name: string, description?: string, shortName?: string): Promise<Note> {
  const result = await api.createNote({ section_id: sectionId, name, short_name: shortName, description });
  await loadHierarchy('sections', sectionId); // Загружаем раздел с новой справкой
  return result;
}

export async function updateNote(reportId: string, sectionId: string, noteId: string, name: string, description?: string, shortName?: string): Promise<void> {
  await api.updateNote(noteId, { name, short_name: shortName, description });
  await loadHierarchy('notes', noteId); // Частичная загрузка
}

export async function deleteNote(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.deleteNote(noteId);
  await loadHierarchy('sections', sectionId); // Загружаем раздел без удалённой справки
}

// Note Blocks
export async function addNoteBlock(reportId: string, sectionId: string, noteId: string, name: string, description?: string): Promise<NoteBlock> {
  const result = await api.createNoteBlock({ note_id: noteId, name, description });
  await loadHierarchy('notes', noteId); // Загружаем справку с новым блоком
  return result;
}

export async function updateNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlock(noteBlockId, { name, description });
  await loadHierarchy('noteBlocks', noteBlockId); // Частичная загрузка
}

export async function deleteNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.deleteNoteBlock(noteBlockId);
  await loadHierarchy('notes', noteId); // Загружаем справку без удалённого блока
}

// Indicators
export async function addIndicator(reportId: string, sectionId: string, noteId: string, name: string, description?: string): Promise<Indicator> {
  const result = await api.createIndicator({ note_id: noteId, name, description });
  await loadHierarchy('notes', noteId); // Загружаем справку с новым показателем
  return result;
}

export async function updateIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string): Promise<void> {
  await api.updateIndicator(indicatorId, { name, description });
  await loadHierarchy('indicators', indicatorId); // Частичная загрузка
}

export async function deleteIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.deleteIndicator(indicatorId);
  await loadHierarchy('notes', noteId); // Загружаем справку без удалённого показателя
}

// Note Block Indicators
export async function addNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Promise<Indicator> {
  const result = await api.createNoteBlockIndicator({ note_block_id: noteBlockId, name, description });
  await loadHierarchy('noteBlocks', noteBlockId); // Загружаем блок с новым показателем
  return result;
}

export async function updateNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlockIndicator(indicatorId, { name, description });
  await loadHierarchy('noteBlockIndicators', indicatorId); // Частичная загрузка
}

export async function deleteNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.deleteNoteBlockIndicator(indicatorId);
  await loadHierarchy('noteBlocks', noteBlockId); // Загружаем блок без удалённого показателя
}

// Slices
export async function addSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string): Promise<DataSlice> {
  const result = await api.createSlice({ indicator_id: indicatorId, name, description });
  await loadHierarchy('indicators', indicatorId); // Загружаем показатель с новым разрезом
  return result;
}

export async function updateSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string): Promise<void> {
  await api.updateSlice(sliceId, { name, description });
  await loadHierarchy('slices', sliceId); // Частичная загрузка
}

export async function deleteSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.deleteSlice(sliceId);
  await loadHierarchy('indicators', indicatorId); // Загружаем показатель без удалённого разреза
}

// Note Block Slices
export async function addNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): Promise<DataSlice> {
  const result = await api.createNoteBlockSlice({ indicator_id: indicatorId, name, description });
  await loadHierarchy('noteBlockIndicators', indicatorId); // Загружаем показатель блока с новым разрезом
  return result;
}

export async function updateNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlockSlice(sliceId, { name, description });
  await loadHierarchy('noteBlockSlices', sliceId); // Частичная загрузка
}

export async function deleteNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.deleteNoteBlockSlice(sliceId);
  await loadHierarchy('noteBlockIndicators', indicatorId); // Загружаем показатель блока без удалённого разреза
}

// Sources
export async function addSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createSource({ slice_id: sliceId, name, description, source_types: sourceTypes });
  await loadHierarchy('slices', sliceId); // Загружаем разрез с новым источником
  return result;
}

export async function updateSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateSource(sourceId, { name, description, source_types: sourceTypes });
  await loadHierarchy('sources', sourceId); // Частичная загрузка
}

export async function deleteSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.deleteSource(sourceId);
  await loadHierarchy('slices', sliceId); // Загружаем разрез без удалённого источника
}

// Note Sources
export async function addNoteSource(reportId: string, sectionId: string, noteId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createNoteSource({ note_id: noteId, name, description, source_types: sourceTypes });
  await loadHierarchy('notes', noteId); // Загружаем справку с новым источником
  return result;
}

export async function updateNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateNoteSource(sourceId, { name, description, source_types: sourceTypes });
  await loadHierarchy('noteSources', sourceId); // Частичная загрузка
}

export async function deleteNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.deleteNoteSource(sourceId);
  await loadHierarchy('notes', noteId); // Загружаем справку без удалённого источника
}

// Note Block Sources
export async function addNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createNoteBlockSource({ slice_id: sliceId, name, description, source_types: sourceTypes });
  await loadHierarchy('noteBlockSlices', sliceId); // Загружаем разрез блока с новым источником
  return result;
}

export async function updateNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateNoteBlockSource(sourceId, { name, description, source_types: sourceTypes });
  await loadHierarchy('noteBlockSources', sourceId); // Частичная загрузка
}

export async function deleteNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.deleteNoteBlockSource(sourceId);
  await loadHierarchy('noteBlockSlices', sliceId); // Загружаем разрез блока без удалённого источника
}

// Move operations
export async function moveReportUp(id: string): Promise<void> {
  await api.moveReport(id, 'up');
  await loadReports(); // Для перемещения докладов нужна полная загрузка
}

export async function moveReportDown(id: string): Promise<void> {
  await api.moveReport(id, 'down');
  await loadReports();
}

export async function moveSectionUp(reportId: string, sectionId: string): Promise<void> {
  await api.moveSection(sectionId, 'up');
  await loadHierarchy('reports', reportId); // Загружаем весь доклад с новым порядком
}

export async function moveSectionDown(reportId: string, sectionId: string): Promise<void> {
  await api.moveSection(sectionId, 'down');
  await loadHierarchy('reports', reportId);
}

export async function moveNoteUp(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.moveNote(noteId, 'up');
  await loadHierarchy('sections', sectionId); // Загружаем раздел с новым порядком
}

export async function moveNoteDown(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.moveNote(noteId, 'down');
  await loadHierarchy('sections', sectionId);
}

export async function moveNoteBlockUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.moveNoteBlock(noteBlockId, 'up');
  await loadHierarchy('notes', noteId); // Загружаем справку с новым порядком
}

export async function moveNoteBlockDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.moveNoteBlock(noteBlockId, 'down');
  await loadHierarchy('notes', noteId);
}

export async function moveIndicatorUp(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.moveIndicator(indicatorId, 'up');
  await loadHierarchy('notes', noteId); // Загружаем справку с новым порядком
}

export async function moveIndicatorDown(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.moveIndicator(indicatorId, 'down');
  await loadHierarchy('notes', noteId);
}

// Note Block Indicator Move
export async function moveNoteBlockIndicatorUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.moveNoteBlockIndicator(indicatorId, 'up');
  await loadHierarchy('noteBlocks', noteBlockId); // Загружаем блок с новым порядком
}

export async function moveNoteBlockIndicatorDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.moveNoteBlockIndicator(indicatorId, 'down');
  await loadHierarchy('noteBlocks', noteBlockId);
}

export async function moveSliceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveSlice(sliceId, 'up');
  await loadHierarchy('indicators', indicatorId); // Загружаем показатель с новым порядком
}

export async function moveSliceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveSlice(sliceId, 'down');
  await loadHierarchy('indicators', indicatorId);
}

// Note Block Slice Move
export async function moveNoteBlockSliceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveNoteBlockSlice(sliceId, 'up');
  await loadHierarchy('noteBlockIndicators', indicatorId); // Загружаем показатель блока с новым порядком
}

export async function moveNoteBlockSliceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveNoteBlockSlice(sliceId, 'down');
  await loadHierarchy('noteBlockIndicators', indicatorId);
}

// Note Source Move
export async function moveNoteSourceUp(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.moveNoteSource(sourceId, 'up');
  await loadHierarchy('notes', noteId); // Загружаем справку с новым порядком
}

export async function moveNoteSourceDown(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.moveNoteSource(sourceId, 'down');
  await loadHierarchy('notes', noteId);
}

// Note Block Source Move
export async function moveNoteBlockSourceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveNoteBlockSource(sourceId, 'up');
  await loadHierarchy('noteBlockSlices', sliceId); // Загружаем разрез блока с новым порядком
}

export async function moveNoteBlockSourceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveNoteBlockSource(sourceId, 'down');
  await loadHierarchy('noteBlockSlices', sliceId);
}

export async function moveSourceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveSource(sourceId, 'up');
  await loadHierarchy('slices', sliceId); // Загружаем разрез с новым порядком
}

export async function moveSourceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveSource(sourceId, 'down');
  await loadHierarchy('slices', sliceId);
}

// Import/Export
export async function importData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    let reportsToImport: any[];
    
    if (Array.isArray(data)) {
      reportsToImport = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.reports)) {
      reportsToImport = data.reports;
    } else {
      return false;
    }
    
    await api.importAllReports(reportsToImport);
    await loadReports();
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

export function exportData(): string {
  return JSON.stringify(reports, null, 2);
}

export async function resetData(): Promise<void> {
  // Очищаем все данные через API
  await api.importAllReports([]);
  await loadReports();
}
