import { useState, useRef, useEffect } from 'react';
import { useReports } from './hooks';
import { TreeView } from './components/TreeView';
import { DetailPanel } from './components/DetailPanel';
import { FormPanel, DeleteConfirmPanel } from './components/FormPanel';
import {
  resetData, exportData, importData, loadReports,
  deleteReport, deleteSection, deleteNote, deleteNoteBlock,
  deleteIndicator, deleteNoteBlockIndicator,
  deleteSlice, deleteNoteBlockSlice,
  deleteSource, deleteNoteSource, deleteNoteBlockSource,
  moveReportUp, moveReportDown,
  moveSectionUp, moveSectionDown,
  moveNoteUp, moveNoteDown,
  moveNoteBlockUp, moveNoteBlockDown,
  moveIndicatorUp, moveIndicatorDown,
  moveNoteBlockIndicatorUp, moveNoteBlockIndicatorDown,
  moveSliceUp, moveSliceDown,
  moveNoteBlockSliceUp, moveNoteBlockSliceDown,
  moveSourceUp, moveSourceDown,
  moveNoteSourceUp, moveNoteSourceDown,
  moveNoteBlockSourceUp, moveNoteBlockSourceDown
} from './store';

interface FormState {
  type: string;
  parentIds: string[];
  editData?: any;
}

function App() {
  const reports = useReports();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string; parentIds: string[] } | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [mergeDuplicates, setMergeDuplicates] = useState(false);
  const [userIP, setUserIP] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем данные из API при старте
  useEffect(() => {
    loadReports().catch(err => {
      console.error('Failed to load reports:', err);
      alert('Ошибка загрузки данных. Проверьте подключение к серверу.');
    });
    
    // Получаем IP пользователя
    fetch('/DataSources/api/user-info.php')
      .then(response => response.json())
      .then(data => {
        setUserIP(data.ip || 'unknown');
      })
      .catch(error => {
        console.error('Error fetching user IP:', error);
        setUserIP('error');
      });
  }, []);

  const handleSelect = (id: string, type: string) => {
    setFormState(null);
    setDeleteConfirm(null);
    setActionId(null);
    setSelectedId(null);
    setSelectedType(null);
    setTimeout(() => {
      setSelectedId(id);
      setSelectedType(type);
      setPanelKey(prev => prev + 1);
    }, 10);
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setSelectedType(null);
    setFormState(null);
    setDeleteConfirm(null);
    setActionId(null);
  };

  const handleAdd = (type: string, parentIds: string[]) => {
    setSelectedId(null);
    setSelectedType(null);
    setDeleteConfirm(null);
    setFormState(null);
    const parentId = parentIds.length > 0 ? parentIds[parentIds.length - 1] : null;
    setActionId(parentId);
    setTimeout(() => {
      setFormState({ type, parentIds });
      setPanelKey(prev => prev + 1);
    }, 10);
  };

  const handleEdit = (type: string, parentIds: string[], data: any) => {
    setSelectedId(null);
    setSelectedType(null);
    setDeleteConfirm(null);
    setFormState(null);
    setActionId(null);
    setTimeout(() => {
      setFormState({ type, parentIds, editData: data });
      setPanelKey(prev => prev + 1);
    }, 10);
  };

  const handleDelete = (id: string, type: string, parentIds: string[]) => {
    setSelectedId(null);
    setSelectedType(null);
    setFormState(null);
    setDeleteConfirm(null);
    setActionId(id);
    setTimeout(() => {
      setDeleteConfirm({ id, type, parentIds });
      setPanelKey(prev => prev + 1);
    }, 10);
  };

  const handleMoveUp = async (type: string, id: string, parentIds: string[]) => {
    setLoading(true);
    try {
      switch (type) {
        case 'report':
          await moveReportUp(id);
          break;
        case 'section':
          await moveSectionUp(parentIds[0], id);
          break;
        case 'note':
          await moveNoteUp(parentIds[0], parentIds[1], id);
          break;
        case 'noteBlock':
          await moveNoteBlockUp(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'indicator':
          await moveIndicatorUp(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'noteBlockIndicator':
          await moveNoteBlockIndicatorUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
          break;
        case 'slice':
          await moveSliceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
          break;
        case 'noteBlockSlice':
          await moveNoteBlockSliceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
          break;
        case 'source':
          await moveSourceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
          break;
        case 'noteSource':
          await moveNoteSourceUp(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'noteBlockSource':
          await moveNoteBlockSourceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
          break;
      }
    } catch (error) {
      console.error('Error moving up:', error);
      alert('Ошибка перемещения элемента');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (type: string, id: string, parentIds: string[]) => {
    setLoading(true);
    try {
      switch (type) {
        case 'report':
          await moveReportDown(id);
          break;
        case 'section':
          await moveSectionDown(parentIds[0], id);
          break;
        case 'note':
          await moveNoteDown(parentIds[0], parentIds[1], id);
          break;
        case 'noteBlock':
          await moveNoteBlockDown(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'indicator':
          await moveIndicatorDown(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'noteBlockIndicator':
          await moveNoteBlockIndicatorDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
          break;
        case 'slice':
          await moveSliceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
          break;
        case 'noteBlockSlice':
          await moveNoteBlockSliceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
          break;
        case 'source':
          await moveSourceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
          break;
        case 'noteSource':
          await moveNoteSourceDown(parentIds[0], parentIds[1], parentIds[2], id);
          break;
        case 'noteBlockSource':
          await moveNoteBlockSourceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
          break;
      }
    } catch (error) {
      console.error('Error moving down:', error);
      alert('Ошибка перемещения элемента');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setFormState(null);
  };

  const handleFormSave = () => {
    setFormState(null);
  };

  const handleExport = () => {
    const data = exportData();
    
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report_data_sources.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.log('Download failed, showing modal instead');
    }
  };

  const handleImport = async () => {
    if (importText.trim()) {
      setLoading(true);
      try {
        const success = await importData(importText);
        if (success) {
          setShowImportModal(false);
          setImportText('');
          setSelectedId(null);
          setSelectedType(null);
          alert('Импорт выполнен успешно!');
        } else {
          alert('Ошибка: неверный формат данных');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Ошибка при импорте: ' + error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          const success = await importData(content);
          if (success) {
            setSelectedId(null);
            setSelectedType(null);
            alert('Импорт выполнен успешно!');
          } else {
            alert('Ошибка: неверный формат файла');
          }
          setLoading(false);
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('File import error:', error);
        alert('Ошибка при импорте файла');
        setLoading(false);
      }
    }
  };

  const handleReset = async () => {
    if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
      setLoading(true);
      try {
        await resetData();
        setSelectedId(null);
        setSelectedType(null);
        alert('Данные сброшены');
      } catch (error) {
        console.error('Reset error:', error);
        alert('Ошибка при сбросе данных');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">
                Справочник источников данных
              </h1>
              <h1 className="text-lg font-bold text-gray-800 sm:hidden">
                Источники данных
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Экспорт данных"
            >
              <span>⬇</span>
              <span className="hidden sm:inline">Экспорт</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Импорт данных"
            >
              <span>⬆</span>
              <span className="hidden sm:inline">Импорт</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Сбросить данные"
            >
              <span>↻</span>
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tree Panel */}
        <section className="bg-white border-b border-gray-200 flex-1 overflow-hidden transition-all duration-300 ease-in-out">
          <TreeView
            reports={reports}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </section>

        {/* Bottom Panel - shows Detail, Form, or Delete Confirmation */}
        {(selectedId && selectedType) || formState || deleteConfirm ? (
          <section 
            key={formState ? `form-${formState.type}` : deleteConfirm ? 'delete' : `detail-${selectedId}`}
            className="flex-1 bg-white overflow-hidden flex-shrink-0 border-t border-gray-200"
            style={{
              animation: 'slide-up 0.3s ease-out'
            }}
          >
            {formState ? (
              <FormPanel
                formState={formState}
                onClose={handleFormClose}
                onSave={handleFormSave}
              />
            ) : deleteConfirm ? (
              <DeleteConfirmPanel
                deleteConfirm={deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={async () => {
                  setLoading(true);
                  try {
                    const { id, type, parentIds } = deleteConfirm;
                    switch (type) {
                      case 'report':
                        await deleteReport(id);
                        break;
                      case 'section':
                        await deleteSection(parentIds[0], id);
                        break;
                      case 'note':
                        await deleteNote(parentIds[0], parentIds[1], id);
                        break;
                      case 'noteBlock':
                        await deleteNoteBlock(parentIds[0], parentIds[1], parentIds[2], id);
                        break;
                      case 'indicator':
                        await deleteIndicator(parentIds[0], parentIds[1], parentIds[2], id);
                        break;
                      case 'noteBlockIndicator':
                        await deleteNoteBlockIndicator(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
                        break;
                      case 'slice':
                        await deleteSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
                        break;
                      case 'noteBlockSlice':
                        await deleteNoteBlockSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
                        break;
                      case 'source':
                        await deleteSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
                        break;
                      case 'noteSource':
                        await deleteNoteSource(parentIds[0], parentIds[1], parentIds[2], id);
                        break;
                      case 'noteBlockSource':
                        await deleteNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
                        break;
                    }
                    setDeleteConfirm(null);
                  } catch (error) {
                    console.error('Delete error:', error);
                    alert('Ошибка при удалении');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            ) : (
              <DetailPanel
                reports={reports}
                selectedId={selectedId!}
                selectedType={selectedType!}
                onClose={handleCloseDetail}
              />
            )}
          </section>
        ) : null}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Импорт данных</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Загрузить из файла:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">или вставьте JSON</span>
                </div>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-xs"
                rows={6}
                placeholder='[{"id":"...","name":"...","sections":[...]}]'
              />
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="mergeDuplicates"
                  checked={mergeDuplicates}
                  onChange={(e) => setMergeDuplicates(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="mergeDuplicates" className="text-sm text-gray-700 cursor-pointer">
                  Объединять доклады с одинаковыми названиями
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importText.trim() || loading}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                >
                  {loading ? 'Импорт...' : 'Импортировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            {/* Export modal content - disabled for now */}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Загрузка...</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Apache + PHP 8 + PostgreSQL | Справочник источников данных показателей</span>
          <div className="flex items-center gap-4">
            {userIP && (
              <span className="text-gray-600">
                IP: <span className="font-mono font-semibold">{userIP}</span>
              </span>
            )}
            <span>Докладов: {reports.length} | Разделов: {reports.reduce((sum: number, r: any) => sum + r.sections.length, 0)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
