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
    reports = await api.fetchReports();
    notify();
  } catch (e) {
    console.error('Error loading reports:', e);
    throw e;
  }
}

// Reports
export async function addReport(name: string, description?: string): Promise<Report> {
  const result = await api.createReport({ name, description });
  await loadReports();
  return result;
}

export async function updateReport(id: string, name: string, description?: string): Promise<void> {
  await api.updateReport(id, { name, description });
  await loadReports();
}

export async function deleteReport(id: string): Promise<void> {
  await api.deleteReport(id);
  await loadReports();
}

// Sections
export async function addSection(reportId: string, name: string, description?: string): Promise<Section> {
  const result = await api.createSection({ report_id: reportId, name, description });
  await loadReports();
  return result;
}

export async function updateSection(reportId: string, sectionId: string, name: string, description?: string): Promise<void> {
  await api.updateSection(sectionId, { name, description });
  await loadReports();
}

export async function deleteSection(reportId: string, sectionId: string): Promise<void> {
  await api.deleteSection(sectionId);
  await loadReports();
}

// Notes
export async function addNote(reportId: string, sectionId: string, name: string, description?: string, shortName?: string): Promise<Note> {
  const result = await api.createNote({ section_id: sectionId, name, short_name: shortName, description });
  await loadReports();
  return result;
}

export async function updateNote(reportId: string, sectionId: string, noteId: string, name: string, description?: string, shortName?: string): Promise<void> {
  await api.updateNote(noteId, { name, short_name: shortName, description });
  await loadReports();
}

export async function deleteNote(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.deleteNote(noteId);
  await loadReports();
}

// Note Blocks
export async function addNoteBlock(reportId: string, sectionId: string, noteId: string, name: string, description?: string): Promise<NoteBlock> {
  const result = await api.createNoteBlock({ note_id: noteId, name, description });
  await loadReports();
  return result;
}

export async function updateNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlock(noteBlockId, { name, description });
  await loadReports();
}

export async function deleteNoteBlock(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.deleteNoteBlock(noteBlockId);
  await loadReports();
}

// Indicators
export async function addIndicator(reportId: string, sectionId: string, noteId: string, name: string, description?: string): Promise<Indicator> {
  const result = await api.createIndicator({ note_id: noteId, name, description });
  await loadReports();
  return result;
}

export async function updateIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string): Promise<void> {
  await api.updateIndicator(indicatorId, { name, description });
  await loadReports();
}

export async function deleteIndicator(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.deleteIndicator(indicatorId);
  await loadReports();
}

// Note Block Indicators
export async function addNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, name: string, description?: string): Promise<Indicator> {
  const result = await api.createNoteBlockIndicator({ note_block_id: noteBlockId, name, description });
  await loadReports();
  return result;
}

export async function updateNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlockIndicator(indicatorId, { name, description });
  await loadReports();
}

export async function deleteNoteBlockIndicator(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.deleteNoteBlockIndicator(indicatorId);
  await loadReports();
}

// Slices
export async function addSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, name: string, description?: string): Promise<DataSlice> {
  const result = await api.createSlice({ indicator_id: indicatorId, name, description });
  await loadReports();
  return result;
}

export async function updateSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string): Promise<void> {
  await api.updateSlice(sliceId, { name, description });
  await loadReports();
}

export async function deleteSlice(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.deleteSlice(sliceId);
  await loadReports();
}

// Note Block Slices
export async function addNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, name: string, description?: string): Promise<DataSlice> {
  const result = await api.createNoteBlockSlice({ indicator_id: indicatorId, name, description });
  await loadReports();
  return result;
}

export async function updateNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string): Promise<void> {
  await api.updateNoteBlockSlice(sliceId, { name, description });
  await loadReports();
}

export async function deleteNoteBlockSlice(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.deleteNoteBlockSlice(sliceId);
  await loadReports();
}

// Sources
export async function addSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createSource({ slice_id: sliceId, name, description, source_types: sourceTypes });
  await loadReports();
  return result;
}

export async function updateSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateSource(sourceId, { name, description, source_types: sourceTypes });
  await loadReports();
}

export async function deleteSource(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.deleteSource(sourceId);
  await loadReports();
}

// Note Sources
export async function addNoteSource(reportId: string, sectionId: string, noteId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createNoteSource({ note_id: noteId, name, description, source_types: sourceTypes });
  await loadReports();
  return result;
}

export async function updateNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateNoteSource(sourceId, { name, description, source_types: sourceTypes });
  await loadReports();
}

export async function deleteNoteSource(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.deleteNoteSource(sourceId);
  await loadReports();
}

// Note Block Sources
export async function addNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<DataSource> {
  const result = await api.createNoteBlockSource({ slice_id: sliceId, name, description, source_types: sourceTypes });
  await loadReports();
  return result;
}

export async function updateNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string, name: string, description?: string, sourceTypes?: SourceType[]): Promise<void> {
  await api.updateNoteBlockSource(sourceId, { name, description, source_types: sourceTypes });
  await loadReports();
}

export async function deleteNoteBlockSource(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.deleteNoteBlockSource(sourceId);
  await loadReports();
}

// Move operations
export async function moveReportUp(id: string): Promise<void> {
  await api.moveReport(id, 'up');
  await loadReports();
}

export async function moveReportDown(id: string): Promise<void> {
  await api.moveReport(id, 'down');
  await loadReports();
}

export async function moveSectionUp(reportId: string, sectionId: string): Promise<void> {
  await api.moveSection(sectionId, 'up');
  await loadReports();
}

export async function moveSectionDown(reportId: string, sectionId: string): Promise<void> {
  await api.moveSection(sectionId, 'down');
  await loadReports();
}

export async function moveNoteUp(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.moveNote(noteId, 'up');
  await loadReports();
}

export async function moveNoteDown(reportId: string, sectionId: string, noteId: string): Promise<void> {
  await api.moveNote(noteId, 'down');
  await loadReports();
}

export async function moveNoteBlockUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.moveNoteBlock(noteBlockId, 'up');
  await loadReports();
}

export async function moveNoteBlockDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string): Promise<void> {
  await api.moveNoteBlock(noteBlockId, 'down');
  await loadReports();
}

export async function moveIndicatorUp(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.moveIndicator(indicatorId, 'up');
  await loadReports();
}

export async function moveIndicatorDown(reportId: string, sectionId: string, noteId: string, indicatorId: string): Promise<void> {
  await api.moveIndicator(indicatorId, 'down');
  await loadReports();
}

// Note Block Indicator Move
export async function moveNoteBlockIndicatorUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.moveNoteBlockIndicator(indicatorId, 'up');
  await loadReports();
}

export async function moveNoteBlockIndicatorDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string): Promise<void> {
  await api.moveNoteBlockIndicator(indicatorId, 'down');
  await loadReports();
}

export async function moveSliceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveSlice(sliceId, 'up');
  await loadReports();
}

export async function moveSliceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveSlice(sliceId, 'down');
  await loadReports();
}

// Note Block Slice Move
export async function moveNoteBlockSliceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveNoteBlockSlice(sliceId, 'up');
  await loadReports();
}

export async function moveNoteBlockSliceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string): Promise<void> {
  await api.moveNoteBlockSlice(sliceId, 'down');
  await loadReports();
}

// Note Source Move
export async function moveNoteSourceUp(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.moveNoteSource(sourceId, 'up');
  await loadReports();
}

export async function moveNoteSourceDown(reportId: string, sectionId: string, noteId: string, sourceId: string): Promise<void> {
  await api.moveNoteSource(sourceId, 'down');
  await loadReports();
}

// Note Block Source Move
export async function moveNoteBlockSourceUp(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveNoteBlockSource(sourceId, 'up');
  await loadReports();
}

export async function moveNoteBlockSourceDown(reportId: string, sectionId: string, noteId: string, noteBlockId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveNoteBlockSource(sourceId, 'down');
  await loadReports();
}

export async function moveSourceUp(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveSource(sourceId, 'up');
  await loadReports();
}

export async function moveSourceDown(reportId: string, sectionId: string, noteId: string, indicatorId: string, sliceId: string, sourceId: string): Promise<void> {
  await api.moveSource(sourceId, 'down');
  await loadReports();
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
