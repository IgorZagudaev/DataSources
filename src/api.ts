// API клиент для работы с PHP бэкендом
// Используем относительный путь от корня сайта
const API_BASE_URL = window.location.pathname.replace(/\/[^\/]*$/, '') + '/api';

async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Reports
export async function fetchReports() {
  console.log('Fetching reports from API...');
  const result = await apiRequest('/reports');
  console.log('API response:', result);
  return result;
}

export async function createReport(data: { name: string; description?: string }) {
  return apiRequest('/reports', 'POST', data);
}

export async function updateReport(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/reports/${id}`, 'PUT', data);
}

export async function deleteReport(id: string) {
  return apiRequest(`/reports/${id}`, 'DELETE');
}

export async function moveReport(id: string, direction: 'up' | 'down') {
  return apiRequest(`/reports/${id}/move`, 'PUT', { direction });
}

// Sections
export async function createSection(data: { report_id: string; name: string; description?: string }) {
  return apiRequest('/sections', 'POST', data);
}

export async function updateSection(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/sections/${id}`, 'PUT', data);
}

export async function deleteSection(id: string) {
  return apiRequest(`/sections/${id}`, 'DELETE');
}

export async function moveSection(id: string, direction: 'up' | 'down') {
  return apiRequest(`/sections/${id}/move`, 'PUT', { direction });
}

// Notes
export async function createNote(data: { section_id: string; name: string; short_name?: string; description?: string }) {
  return apiRequest('/notes', 'POST', data);
}

export async function updateNote(id: string, data: { name: string; short_name?: string; description?: string }) {
  return apiRequest(`/notes/${id}`, 'PUT', data);
}

export async function deleteNote(id: string) {
  return apiRequest(`/notes/${id}`, 'DELETE');
}

export async function moveNote(id: string, direction: 'up' | 'down') {
  return apiRequest(`/notes/${id}/move`, 'PUT', { direction });
}

// Note Sources
export async function createNoteSource(data: { note_id: string; name: string; description?: string; source_types?: string[] }) {
  return apiRequest('/noteSources', 'POST', data);
}

export async function updateNoteSource(id: string, data: { name: string; description?: string; source_types?: string[] }) {
  return apiRequest(`/noteSources/${id}`, 'PUT', data);
}

export async function deleteNoteSource(id: string) {
  return apiRequest(`/noteSources/${id}`, 'DELETE');
}

export async function moveNoteSource(id: string, direction: 'up' | 'down') {
  return apiRequest(`/noteSources/${id}/move`, 'PUT', { direction });
}

// Note Blocks
export async function createNoteBlock(data: { note_id: string; name: string; description?: string }) {
  return apiRequest('/noteBlocks', 'POST', data);
}

export async function updateNoteBlock(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/noteBlocks/${id}`, 'PUT', data);
}

export async function deleteNoteBlock(id: string) {
  return apiRequest(`/noteBlocks/${id}`, 'DELETE');
}

export async function moveNoteBlock(id: string, direction: 'up' | 'down') {
  return apiRequest(`/noteBlocks/${id}/move`, 'PUT', { direction });
}

// Indicators
export async function createIndicator(data: { note_id: string; name: string; description?: string }) {
  return apiRequest('/indicators', 'POST', data);
}

export async function updateIndicator(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/indicators/${id}`, 'PUT', data);
}

export async function deleteIndicator(id: string) {
  return apiRequest(`/indicators/${id}`, 'DELETE');
}

export async function moveIndicator(id: string, direction: 'up' | 'down') {
  return apiRequest(`/indicators/${id}/move`, 'PUT', { direction });
}

// Note Block Indicators
export async function createNoteBlockIndicator(data: { note_block_id: string; name: string; description?: string }) {
  return apiRequest('/noteBlockIndicators', 'POST', data);
}

export async function updateNoteBlockIndicator(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/noteBlockIndicators/${id}`, 'PUT', data);
}

export async function deleteNoteBlockIndicator(id: string) {
  return apiRequest(`/noteBlockIndicators/${id}`, 'DELETE');
}

export async function moveNoteBlockIndicator(id: string, direction: 'up' | 'down') {
  return apiRequest(`/noteBlockIndicators/${id}/move`, 'PUT', { direction });
}

// Slices
export async function createSlice(data: { indicator_id: string; name: string; description?: string }) {
  return apiRequest('/slices', 'POST', data);
}

export async function updateSlice(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/slices/${id}`, 'PUT', data);
}

export async function deleteSlice(id: string) {
  return apiRequest(`/slices/${id}`, 'DELETE');
}

export async function moveSlice(id: string, direction: 'up' | 'down') {
  return apiRequest(`/slices/${id}/move`, 'PUT', { direction });
}

// Note Block Slices
export async function createNoteBlockSlice(data: { indicator_id: string; name: string; description?: string }) {
  return apiRequest('/noteBlockSlices', 'POST', data);
}

export async function updateNoteBlockSlice(id: string, data: { name: string; description?: string }) {
  return apiRequest(`/noteBlockSlices/${id}`, 'PUT', data);
}

export async function deleteNoteBlockSlice(id: string) {
  return apiRequest(`/noteBlockSlices/${id}`, 'DELETE');
}

export async function moveNoteBlockSlice(id: string, direction: 'up' | 'down') {
  return apiRequest(`/noteBlockSlices/${id}/move`, 'PUT', { direction });
}

// Sources
export async function createSource(data: { slice_id: string; name: string; description?: string; source_types?: string[] }) {
  return apiRequest('/sources', 'POST', data);
}

export async function updateSource(id: string, data: { name: string; description?: string; source_types?: string[] }) {
  return apiRequest(`/sources/${id}`, 'PUT', data);
}

export async function deleteSource(id: string) {
  return apiRequest(`/sources/${id}`, 'DELETE');
}

export async function moveSource(id: string, direction: 'up' | 'down') {
  return apiRequest(`/sources/${id}/move`, 'PUT', { direction });
}

// Note Block Sources
export async function createNoteBlockSource(data: { slice_id: string; name: string; description?: string; source_types?: string[] }) {
  return apiRequest('/noteBlockSources', 'POST', data);
}

export async function updateNoteBlockSource(id: string, data: { name: string; description?: string; source_types?: string[] }) {
  return apiRequest(`/noteBlockSources/${id}`, 'PUT', data);
}

export async function deleteNoteBlockSource(id: string) {
  return apiRequest(`/noteBlockSources/${id}`, 'DELETE');
}

export async function moveNoteBlockSource(id: string, direction: 'up' | 'down') {
  return apiRequest(`/noteBlockSources/${id}/move`, 'PUT', { direction });
}

// Bulk import
export async function importAllReports(reports: any[]) {
  return apiRequest('/import', 'POST', { reports });
}
