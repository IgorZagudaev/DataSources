// API клиент для работы с PHP бэкендом
const API_BASE_URL = '/DataSources/api';

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
  return apiRequest('/reports');
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
