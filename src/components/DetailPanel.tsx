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
    indicator: { label: 'Показатель (Уровень 4)', icon: '📊', color: 'bg-purple-100 text-purple-800' },
    slice: { label: 'Разрез данных (Уровень 5)', icon: '🔀', color: 'bg-orange-100 text-orange-800' },
    source: { label: 'Источник данных (Уровень 6)', icon: '📚', color: 'bg-pink-100 text-pink-800' },
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
    indicator: 4,
    slice: 5,
    source: 6,
  };
  return levels[type] || 0;
}

interface EntityInfo {
  id: string;
  name: string;
  description?: string;
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
          return { id: note.id, name: note.name, description: note.description };
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
                return { id: source.id, name: source.name, description: source.description };
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function BreadcrumbPath({ reports, selectedId, selectedType }: { reports: Report[]; selectedId: string; selectedType: string }) {
  const path: Array<{ name: string; type: string }> = [];

  for (const report of reports) {
    if (report.id === selectedId) {
      path.push({ name: report.name, type: 'report' });
      break;
    }
    for (const section of report.sections) {
      if (section.id === selectedId) {
        path.push({ name: report.name, type: 'report' });
        path.push({ name: section.name, type: 'section' });
        break;
      }
      for (const note of section.notes) {
        if (note.id === selectedId) {
          path.push({ name: report.name, type: 'report' });
          path.push({ name: section.name, type: 'section' });
          path.push({ name: note.name, type: 'note' });
          break;
        }
        for (const indicator of note.indicators) {
          if (indicator.id === selectedId) {
            path.push({ name: report.name, type: 'report' });
            path.push({ name: section.name, type: 'section' });
            path.push({ name: note.name, type: 'note' });
            path.push({ name: indicator.name, type: 'indicator' });
            break;
          }
          for (const slice of indicator.slices) {
            if (slice.id === selectedId) {
              path.push({ name: report.name, type: 'report' });
              path.push({ name: section.name, type: 'section' });
              path.push({ name: note.name, type: 'note' });
              path.push({ name: indicator.name, type: 'indicator' });
              path.push({ name: slice.name, type: 'slice' });
              break;
            }
            for (const source of slice.sources) {
              if (source.id === selectedId) {
                path.push({ name: report.name, type: 'report' });
                path.push({ name: section.name, type: 'section' });
                path.push({ name: note.name, type: 'note' });
                path.push({ name: indicator.name, type: 'indicator' });
                path.push({ name: slice.name, type: 'slice' });
                path.push({ name: source.name, type: 'source' });
                break;
              }
            }
          }
        }
      }
    }
  }

  if (path.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      {path.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-gray-400 mx-1">›</span>}
          <span className={`px-2 py-0.5 rounded ${item.type === selectedType ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
            {item.name}
          </span>
        </span>
      ))}
    </div>
  );
}

function ChildrenSummary({ reports, selectedId, selectedType }: { reports: Report[]; selectedId: string; selectedType: string }) {
  const counts: Array<{ label: string; count: number; icon: string }> = [];

  for (const report of reports) {
    if (selectedType === 'report' && report.id === selectedId) {
      counts.push({ label: 'Разделов', count: report.sections.length, icon: '📁' });
      const totalNotes = report.sections.reduce((sum, s) => sum + s.notes.length, 0);
      counts.push({ label: 'Справок', count: totalNotes, icon: '📝' });
      break;
    }
    for (const section of report.sections) {
      if (selectedType === 'section' && section.id === selectedId) {
        counts.push({ label: 'Справок', count: section.notes.length, icon: '📝' });
        const totalIndicators = section.notes.reduce((sum, n) => sum + n.indicators.length, 0);
        counts.push({ label: 'Показателей', count: totalIndicators, icon: '📊' });
        break;
      }
      for (const note of section.notes) {
        if (selectedType === 'note' && note.id === selectedId) {
          counts.push({ label: 'Показателей', count: note.indicators.length, icon: '📊' });
          const totalSlices = note.indicators.reduce((sum, i) => sum + i.slices.length, 0);
          counts.push({ label: 'Разрезов', count: totalSlices, icon: '🔀' });
          break;
        }
        for (const indicator of note.indicators) {
          if (selectedType === 'indicator' && indicator.id === selectedId) {
            counts.push({ label: 'Разрезов', count: indicator.slices.length, icon: '🔀' });
            const totalSources = indicator.slices.reduce((sum: number, sl: any) => sum + sl.sources.length, 0);
            counts.push({ label: 'Источников', count: totalSources, icon: '📚' });
            break;
          }
          for (const slice of indicator.slices) {
            if (selectedType === 'slice' && slice.id === selectedId) {
              counts.push({ label: 'Источников', count: slice.sources.length, icon: '📚' });
              break;
            }
          }
        }
      }
    }
  }

  if (counts.length === 0) {
    return <p className="text-sm text-gray-400 italic">Нет вложенных элементов</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {counts.map((item, index) => (
        <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
          <span className="text-lg">{item.icon}</span>
          <div>
            <div className="text-lg font-bold text-gray-800">{item.count}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
