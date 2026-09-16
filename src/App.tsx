import { useState, useRef } from 'react';
import { useReports } from './hooks';
import { TreeView } from './components/TreeView';
import { DetailPanel } from './components/DetailPanel';
import { FormPanel, DeleteConfirmPanel } from './components/FormPanel';
import {
  resetData, exportData, importData,
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
  const [panelKey, setPanelKey] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (id: string, type: string) => {
    setFormState(null);
    setDeleteConfirm(null);
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
  };

  const handleAdd = (type: string, parentIds: string[]) => {
    setSelectedId(null);
    setSelectedType(null);
    setDeleteConfirm(null);
    setFormState(null);
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
    setTimeout(() => {
      setDeleteConfirm({ id, type, parentIds });
      setPanelKey(prev => prev + 1);
    }, 10);
  };

  const handleMoveUp = (type: string, id: string, parentIds: string[]) => {
    switch (type) {
      case 'report':
        moveReportUp(id);
        break;
      case 'section':
        moveSectionUp(parentIds[0], id);
        break;
      case 'note':
        moveNoteUp(parentIds[0], parentIds[1], id);
        break;
      case 'noteBlock':
        moveNoteBlockUp(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'indicator':
        moveIndicatorUp(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'noteBlockIndicator':
        moveNoteBlockIndicatorUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
        break;
      case 'slice':
        moveSliceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
        break;
      case 'noteBlockSlice':
        moveNoteBlockSliceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
        break;
      case 'source':
        moveSourceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
        break;
      case 'noteSource':
        moveNoteSourceUp(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'noteBlockSource':
        moveNoteBlockSourceUp(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
        break;
    }
  };

  const handleMoveDown = (type: string, id: string, parentIds: string[]) => {
    switch (type) {
      case 'report':
        moveReportDown(id);
        break;
      case 'section':
        moveSectionDown(parentIds[0], id);
        break;
      case 'note':
        moveNoteDown(parentIds[0], parentIds[1], id);
        break;
      case 'noteBlock':
        moveNoteBlockDown(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'indicator':
        moveIndicatorDown(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'noteBlockIndicator':
        moveNoteBlockIndicatorDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
        break;
      case 'slice':
        moveSliceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
        break;
      case 'noteBlockSlice':
        moveNoteBlockSliceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
        break;
      case 'source':
        moveSourceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
        break;
      case 'noteSource':
        moveNoteSourceDown(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'noteBlockSource':
        moveNoteBlockSourceDown(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
        break;
    }
  };

  const handleFormClose = () => {
    setFormState(null);
  };

  const handleFormSave = () => {
    setFormState(null);
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportText, setExportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleExport = () => {
    const data = exportData();
    
    // Пытаемся скачать файл
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
      // Если скачивание не работает (например, в iframe), показываем модальное окно
      console.log('Download failed, showing modal instead');
    }
    
    // Показываем данные в модальном окне в любом случае
    setExportText(data);
    setShowExportModal(true);
    setCopySuccess(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = exportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleImport = () => {
    console.log('=== НАЧАЛО handleImport ===');
    console.log('importText:', importText);
    console.log('importText.trim():', importText.trim());
    console.log('importText.trim() truthy?:', !!importText.trim());
    
    if (importText.trim()) {
      console.log('Вызов importData...');
      try {
        const success = importData(importText);
        console.log('Результат importData:', success);
        if (success) {
          console.log('Импорт успешен, закрываем модальное окно');
          setShowImportModal(false);
          setImportText('');
          setSelectedId(null);
          setSelectedType(null);
          // Используем setTimeout чтобы alert не блокировал обновление UI
          setTimeout(() => {
            alert('Импорт выполнен успешно! Данные загружены.');
          }, 100);
        } else {
          console.error('Импорт не удался');
          setTimeout(() => {
            alert('Ошибка: неверный формат данных. Проверьте консоль браузера для деталей.');
          }, 100);
        }
      } catch (error) {
        console.error('Исключение при импорте:', error);
        setTimeout(() => {
          alert('Ошибка при импорте: ' + error);
        }, 100);
      }
    } else {
      console.log('importText пустой');
      setTimeout(() => {
        alert('Пожалуйста, вставьте JSON данные для импорта');
      }, 100);
    }
    console.log('=== КОНЕЦ handleImport ===');
  };

  // Функция для тестирования импорта
  const testImport = () => {
    const testJson = JSON.stringify({
      reports: [
        {
          name: "Тестовый доклад",
          description: "Описание",
          sections: [
            {
              name: "Тестовый раздел",
              description: "Описание раздела",
              notes: [
                {
                  name: "Тестовая справка",
                  shortName: "Тест",
                  description: "Описание справки",
                  noteBlocks: [],
                  indicators: [],
                  sources: []
                }
              ]
            }
          ]
        }
      ]
    });
    
    console.log('Тестовый JSON:', testJson);
    setImportText(testJson);
    console.log('Тестовый JSON установлен в importText');
  };

  // Функция для прямой загрузки тестовых данных
  const directTestImport = () => {
    console.log('=== ПРЯМАЯ ЗАГРУЗКА ТЕСТОВЫХ ДАННЫХ ===');
    const testJson = JSON.stringify({
      reports: [
        {
          name: "Тестовый доклад",
          description: "Описание",
          sections: [
            {
              name: "Тестовый раздел",
              description: "Описание раздела",
              notes: [
                {
                  name: "Тестовая справка",
                  shortName: "Тест",
                  description: "Описание справки",
                  noteBlocks: [],
                  indicators: [],
                  sources: []
                }
              ]
            }
          ]
        }
      ]
    });
    
    console.log('Вызов importData напрямую...');
    const success = importData(testJson);
    console.log('Результат:', success);
    
    if (success) {
      console.log('Успех! Закрываем модальное окно и очищаем поля');
      setShowImportModal(false);
      setImportText('');
      setSelectedId(null);
      setSelectedType(null);
      alert('Тестовые данные загружены напрямую!');
    } else {
      alert('Ошибка при прямой загрузке тестовых данных');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importData(content);
        if (success) {
          setSelectedId(null);
          setSelectedType(null);
        } else {
          alert('Ошибка: неверный формат файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (confirm('Сбросить все данные к начальному состоянию?')) {
      resetData();
      setSelectedId(null);
      setSelectedType(null);
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
        <section className="bg-white border-b border-gray-200 overflow-hidden" style={{ flex: '1 1 50%' }}>
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
            key={`panel-${panelKey}`}
            className="bg-white overflow-hidden flex-shrink-0 border-t border-gray-200 animate-slide-up"
            style={{ flex: '1 1 50%' }}
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
                onConfirm={() => {
                  // Выполнить удаление
                  const { id, type, parentIds } = deleteConfirm;
                  switch (type) {
                    case 'report':
                      deleteReport(id);
                      break;
                    case 'section':
                      deleteSection(parentIds[0], id);
                      break;
                    case 'note':
                      deleteNote(parentIds[0], parentIds[1], id);
                      break;
                    case 'noteBlock':
                      deleteNoteBlock(parentIds[0], parentIds[1], parentIds[2], id);
                      break;
                    case 'indicator':
                      deleteIndicator(parentIds[0], parentIds[1], parentIds[2], id);
                      break;
                    case 'noteBlockIndicator':
                      deleteNoteBlockIndicator(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
                      break;
                    case 'slice':
                      deleteSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
                      break;
                    case 'noteBlockSlice':
                      deleteNoteBlockSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
                      break;
                    case 'source':
                      deleteSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
                      break;
                    case 'noteSource':
                      deleteNoteSource(parentIds[0], parentIds[1], parentIds[2], id);
                      break;
                    case 'noteBlockSource':
                      deleteNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
                      break;
                    case 'noteBlockSliceSource':
                      deleteNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], id);
                      break;
                  }
                  setDeleteConfirm(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowImportModal(false)} />
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
                onChange={(e) => {
                  console.log('Textarea изменен, новая длина:', e.target.value.length);
                  setImportText(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-xs"
                rows={6}
                placeholder='[{"id":"...","name":"...","sections":[...]}]'
              />
              <button
                onClick={() => {
                  console.log('Кнопка тестовых данных нажата');
                  testImport();
                }}
                className="w-full px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mb-2"
              >
                Загрузить тестовые данные в поле
              </button>
              <button
                onClick={() => {
                  console.log('Кнопка прямой загрузки нажата');
                  directTestImport();
                }}
                className="w-full px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mb-2"
              >
                Прямая загрузка тестовых данных
              </button>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                <p><strong>Инструкция по отладке:</strong></p>
                <p>1. Откройте консоль браузера (F12)</p>
                <p>2. Нажмите "Прямая загрузка тестовых данных"</p>
                <p>3. Проверьте логи в консоли</p>
                <p>4. Если видите "=== ПРЯМАЯ ЗАГРУЗКА ТЕСТОВЫХ ДАННЫХ ===" и "Результат: true", но данные не появились - проблема в обновлении UI</p>
                <p>5. Попробуйте обновить страницу (F5) после импорта</p>
                <p>6. Если после обновления данные появились - проблема в реактивности</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    console.log('=== КНОПКА ИМПОРТИРОВАТЬ НАЖАТА ===');
                    console.log('Содержимое importText:', importText);
                    console.log('Длина importText:', importText.length);
                    console.log('Первые 100 символов:', importText.substring(0, 100));
                    handleImport();
                  }}
                  disabled={!importText.trim()}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                >
                  Импортировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExportModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Экспорт данных</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <span className="mr-2">ℹ</span>
                Скопируйте данные ниже и сохраните в файл с расширением .json
              </div>
              <textarea
                value={exportText}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs resize-none"
                rows={10}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    copySuccess 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <span className="mr-2">✓</span>
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <span className="mr-2">⎘</span>
                      Копировать
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Apache + PHP 8 + PostgreSQL | Справочник источников данных показателей</span>
          <span>Докладов: {reports.length} | Разделов: {reports.reduce((sum, r) => sum + r.sections.length, 0)}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
