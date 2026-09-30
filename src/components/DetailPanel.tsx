import { Report } from '../types';

interface DetailPanelProps {
  reports: Report[];
  selectedId: string;
  selectedType: string;
  onClose: () => void;
}

export function DetailPanel({ reports, selectedId, selectedType, onClose }: DetailPanelProps) {
  const entity = findEntity(reports, selectedId, selectedType);
  
  if (!entity) {
    return null;
  }

  const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
    report: { label: 'Доклад (Уровень 1)', icon: '📋', color: 'bg-blue-100 text-blue-800' },
    section: { label: 'Раздел доклада (Уровень 2)', icon: '📁', color: 'bg-green-100 text-green-800' },
    note: { label: 'Справка (Уровень 3)', icon: '📝', color: 'bg-yellow-100 text-yellow-800' },
    noteBlock: { label: 'Блок справки (Уровень 4)', icon: '📑', color: 'bg-amber-100 text-amber-800' },
    indicator: { label: 'Показатель (Уровень 5)', icon: '📊', color: 'bg-purple-100 text-purple-800' },
    slice: { label: 'Разрез данных (Уровень 6)', icon: '🔀', color: 'bg-orange-100 text-orange-800' },
    source: { label: 'Источник данных (Уровень 7)', icon: '📚', color: 'bg-pink-100 text-pink-800' },
    noteSource: { label: 'Источник данных (Уровень 4)', icon: '📚', color: 'bg-pink-100 text-pink-800' },
    noteBlockIndicator: { label: 'Показатель (Уровень 5)', icon: '📊', color: 'bg-purple-100 text-purple-800' },
    noteBlockSlice: { label: 'Разрез данных (Уровень 6)', icon: '🔀', color: 'bg-orange-100 text-orange-800' },
    noteBlockSliceSource: { label: 'Источник данных (Уровень 7)', icon: '📚', color: 'bg-pink-100 text-pink-800' },
  };

  const typeInfo = typeLabels[selectedType] || typeLabels.report;

  return (
    <div className="h-full flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeInfo.icon}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-lg"
          title="Закрыть панель"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{entity.name}</h2>
          {entity.description && (
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">{entity.description}</p>
          )}
        </div>

        {/* Source Types */}
        {entity.sourceTypes && Array.isArray(entity.sourceTypes) && entity.sourceTypes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Типы источника</h3>
            <p className="text-sm text-gray-700">
              {entity.sourceTypes.join(' + ')}
            </p>
          </div>
        )}

        {/* Hierarchy path */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Путь в иерархии</h3>
          <BreadcrumbPath reports={reports} selectedId={selectedId} selectedType={selectedType} />
        </div>

        {/* Children summary */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Содержание</h3>
          <ChildrenSummary reports={reports} selectedId={selectedId} selectedType={selectedType} />
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Информация</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="text-gray-700 font-mono text-xs">{entity.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Тип:</span>
              <span className="text-gray-700">{typeInfo.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Уровень:</span>
              <span className="text-gray-700">{getLevel(selectedType)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLevel(type: string): number {
  const levels: Record<string, number> = {
    report: 1,
    section: 2,
    note: 3,
    noteBlock: 4,
    noteSource: 4, // Источник напрямую в справке
    indicator: 5,
    noteBlockIndicator: 5,
    slice: 6,
    noteBlockSlice: 6,
    source: 7,
    noteBlockSliceSource: 7,
  };
  return levels[type] || 0;
}

interface EntityInfo {
  id: string;
  name: string;
  description?: string;
  sourceTypes?: string[];
}

function findEntity(reports: Report[], id: string, type: string): EntityInfo | null {
  for (const report of reports) {
    if (report.id === id && type === 'report') {
      return { id: report.id, name: report.name, description: report.description };
    }
    for (const section of report.sections) {
      if (section.id === id && type === 'section') {
        return { id: section.id, name: section.name, description: section.description };
      }
      for (const note of section.notes) {
        if (note.id === id && type === 'note') {
          return { {
          return { id: note.id, name: note.name, description: note.description };
        }
        // Прямые источники справки
        for (const source of note.sources) {
          if (source.id === id && type === 'noteSource') {
            const sourceTypes = Array.isArray(source.sourceTypes) ? source.sourceTypes : [];
            return { id: source.id, name: source.name, description: source.description, sourceTypes };
          }
        }
        // Блоки справки
        for (const noteBlock of note.noteBlocks || []) {
          if (noteBlock.id === id && type === 'noteBlock') {
            return { id: noteBlock.id, name: noteBlock.name, description: noteBlock.description };
          }

          // Показатели в блоке справки
          for (const indicator of noteBlock.indicators || []) {
            if (indicator.id === id && type === 'noteBlockIndicator') {
              return { id: indicator.id, name: indicator.name, description: indicator.description };
            }
            // Разрезы в показателях блока справки
            for (const slice of indicator.slices || []) {
              if (slice.id === id && type === 'noteBlockSlice') {
                return { id: slice.id, name: slice.name, description: slice.description };
              }
              // Источники в разрезах блока справки
              for (const source of slice.sources || []) {
                if (source.id === id && type === 'noteBlockSliceSource') {
                  const sourceTypes = Array.isArray(source.sourceTypes) ? source.sourceTypes : [];
                  return { id: source.id, name: source.name, description: source.description, sourceTypes };
                }
              }
            }
          }
        }
        for (const indicator of note.indicators) {
          if (indicator.id === id && type === 'indicator') {
            return { id: indicator.id, name: indicator.name, description: indicator.description };
          }
          for (const slice of indicator.slices) {
            if (slice.id === id && type === 'slice') {
              return { id: slice.id, name: slice.name, description: slice.description };
            }
            for (const source of slice.sources) {
              if (source.id === id && type === 'source') {
