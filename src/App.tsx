import { useState, useRef } from 'react';
import { useReports } from './hooks';
import { TreeView } from './components/TreeView';
import { DetailPanel } from './components/DetailPanel';
import { resetData, exportData, importData } from './store';

function App() {
  const reports = useReports();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 96 * 4 = 384px
  const [isDragging, setIsDragging] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string, type: string) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.classList.add('resizing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Ограничения: мин 200px, макс 60% ширины контейнера
    const minWidth = 200;
    const maxWidth = containerRect.width * 0.6;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('resizing');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report_data_sources.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importText.trim()) {
      const success = importData(importText);
      if (success) {
        setShowImportModal(false);
        setImportText('');
        setSelectedId(null);
        setSelectedType(null);
      } else {
        alert('Ошибка: неверный формат данных');
      }
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
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? 'Скрыть панель' : 'Показать панель'}
            >
              <i className="fas fa-bars"></i>
            </button>
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
              <i className="fas fa-download"></i>
              <span className="hidden sm:inline">Экспорт</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Импорт данных"
            >
              <i className="fas fa-upload"></i>
              <span className="hidden sm:inline">Импорт</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Сбросить данные"
            >
              <i className="fas fa-sync-alt"></i>
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="flex flex-1 overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Sidebar - Tree */}
        <aside
          className={`bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden transition-[width] ${isDragging ? '' : 'duration-300'}`}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
        >
          <TreeView
            reports={reports}
            selectedId={selectedId}
            onSelect={handleSelect}
            width={sidebarWidth}
          />
        </aside>

        {/* Resizer */}
        {sidebarOpen && (
          <div
            className={`w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors ${isDragging ? 'bg-blue-500' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-1 h-full relative">
              <div className="absolute inset-0 w-3 -ml-1 cursor-col-resize"></div>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        <main className="flex-1 bg-white overflow-hidden">
          <DetailPanel
            reports={reports}
            selectedId={selectedId}
            selectedType={selectedType}
          />
        </main>
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
                onChange={(e) => setImportText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-xs"
                rows={6}
                placeholder='[{"id":"...","name":"...","sections":[...]}]'
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleImport}
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
