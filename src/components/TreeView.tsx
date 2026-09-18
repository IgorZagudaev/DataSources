import React, { useState, useEffect, useRef } from 'react';
import { Report } from '../types';

interface TreeViewProps {
  reports: Report[];
  selectedId: string | null;
  editingId?: string | null;
  onSelect: (id: string, type: string) => void;
  onAdd: (type: string, parentIds: string[]) => void;
  onEdit: (type: string, parentIds: string[], data: any) => void;
  onDelete: (id: string, type: string, parentIds: string[]) => void;
  onMoveUp: (type: string, id: string, parentIds: string[]) => void;
  onMoveDown: (type: string, id: string, parentIds: string[]) => void;
}

export function TreeView({ reports, selectedId, editingId, onSelect, onAdd, onEdit, onDelete, onMoveUp, onMoveDown }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['report-1']));
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Автоматическое центрирование выбранной строки
  useEffect(() => {
    if (!selectedId || !treeContainerRef.current) return;

    // Небольшая задержка для завершения рендеринга
    setTimeout(() => {
      const selectedElement = treeContainerRef.current?.querySelector(`[data-node-id="${selectedId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  }, [selectedId]);

  // Автоматическое центрирование редактируемой строки
  useEffect(() => {
    if (!editingId || !treeContainerRef.current) return;

    // Небольшая задержка для завершения рендеринга
    setTimeout(() => {
      const editingElement = treeContainerRef.current?.querySelector(`[data-node-id="${editingId}"]`);
      if (editingElement) {
        editingElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  }, [editingId]);

  // Автоматическое раскрытие узлов при выборе типа источника
  useEffect(() => {
    if (!sourceTypeFilter) return;

    const nodesToExpand = new Set<string>();

    reports.forEach(report => {
      report.sections.forEach(section => {
        section.notes.forEach(note => {
          // Проверяем прямые источники в справке
          note.sources?.forEach(source => {
            if (source.sourceTypes?.includes(sourceTypeFilter as any)) {
              nodesToExpand.add(report.id);
              nodesToExpand.add(section.id);
              nodesToExpand.add(note.id);
            }
          });

          // Проверяем источники в блоках справки
          note.noteBlocks?.forEach(noteBlock => {
            noteBlock.indicators?.forEach(indicator => {
              indicator.slices?.forEach(slice => {
                slice.sources?.forEach(source => {
                  if (source.sourceTypes?.includes(sourceTypeFilter as any)) {
                    nodesToExpand.add(report.id);
                    nodesToExpand.add(section.id);
                    nodesToExpand.add(note.id);
                    nodesToExpand.add(noteBlock.id);
                    nodesToExpand.add(indicator.id);
                    nodesToExpand.add(slice.id);
                  }
                });
              });
            });
          });

          // Проверяем источники в показателях справки
          note.indicators?.forEach(indicator => {
            indicator.slices?.forEach(slice => {
              slice.sources?.forEach(source => {
                if (source.sourceTypes?.includes(sourceTypeFilter as any)) {
                  nodesToExpand.add(report.id);
                  nodesToExpand.add(section.id);
                  nodesToExpand.add(note.id);
                  nodesToExpand.add(indicator.id);
                  nodesToExpand.add(slice.id);
                }
              });
            });
          });
        });
      });
    });

    if (nodesToExpand.size > 0) {
      setExpandedNodes(prev => new Set([...prev, ...nodesToExpand]));
    }
  }, [sourceTypeFilter, reports]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    
    reports.forEach(report => {
      allIds.add(report.id);
      report.sections.forEach(section => {
        allIds.add(section.id);
        section.notes.forEach(note => {
          allIds.add(note.id);
          note.noteBlocks?.forEach(noteBlock => {
            allIds.add(noteBlock.id);
            noteBlock.indicators?.forEach(indicator => {
              allIds.add(indicator.id);
              indicator.slices?.forEach(slice => {
                allIds.add(slice.id);
              });
            });
          });
          note.indicators?.forEach(indicator => {
            allIds.add(indicator.id);
            indicator.slices?.forEach(slice => {
              allIds.add(slice.id);
            });
          });
        });
      });
    });
    
    setExpandedNodes(allIds);
    setIsAllExpanded(true);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
    setIsAllExpanded(false);
  };

  const expandTo = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const r of reports) {
        if (r.id === id) { next.add(r.id); break; }
        for (const s of r.sections) {
          if (s.id === id) { next.add(r.id); next.add(s.id); break; }
          for (const n of s.notes) {
            if (n.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); break; }
            for (const nb of n.noteBlocks || []) {
              if (nb.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); next.add(nb.id); break; }
              for (const i of nb.indicators || []) {
                if (i.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); next.add(nb.id); next.add(i.id); break; }
                for (const sl of i.slices || []) {
                  if (sl.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); next.add(nb.id); next.add(i.id); next.add(sl.id); break; }
                }
              }
            }
            for (const i of n.indicators) {
              if (i.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); next.add(i.id); break; }
              for (const sl of i.slices) {
                if (sl.id === id) { next.add(r.id); next.add(s.id); next.add(n.id); next.add(i.id); next.add(sl.id); break; }
              }
            }
          }
        }
      }
      return next;
    });
  };

  const handleSelect = (id: string, type: string) => {
    onSelect(id, type);
    expandTo(id);
  };

  const handleAdd = (type: string, parentIds: string[]) => {
    onAdd(type, parentIds);
    // Auto-expand parent
    setExpandedNodes(prev => {
      const next = new Set(prev);
      parentIds.forEach(id => next.add(id));
      return next;
    });
  };

  const handleEdit = (type: string, parentIds: string[], data: any) => {
    onEdit(type, parentIds, data);
  };

  const handleDelete = (id: string, type: string, parentIds: string[]) => {
    onDelete(id, type, parentIds);
  };

  // Проверка, содержит ли источник выбранный тип
  const hasSourceType = (source: any): boolean => {
    if (!sourceTypeFilter) return false;
    return source.sourceTypes && source.sourceTypes.includes(sourceTypeFilter);
  };

  return (
    <div ref={treeContainerRef} className="h-full overflow-y-auto">
      {/* Source Type Filter */}
      <div className="px-6 pt-6 pb-4 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Подсветить источники
        </label>
        <select
          value={sourceTypeFilter}
          onChange={(e) => setSourceTypeFilter(e.target.value)}
          className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Все типы</option>
          <option value="Робот">Робот</option>
          <option value="Ручная выгрузка">Ручная выгрузка</option>
          <option value="ПО">ПО</option>
          <option value="Дискор НП">Дискор НП</option>
          <option value="ЭПС">ЭПС</option>
          <option value="ЕАСД">ЕАСД</option>
          <option value="Хранимые процедуры">Хранимые процедуры</option>
          <option value="Другое">Другое</option>
        </select>
      </div>

      {/* Tree Control Button */}
      <div className="px-6 pb-4 bg-gray-50">
        <button
          onClick={isAllExpanded ? collapseAll : expandAll}
          className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
          title={isAllExpanded ? "Свернуть всю иерархию" : "Развернуть всю иерархию"}
        >
          {isAllExpanded ? '▶ Свернуть всё' : '▼ Развернуть всё'}
        </button>
      </div>

      {/* Add Report button */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => handleAdd('report', [])}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <span>+</span>
          Добавить доклад
        </button>
      </div>

      {/* Tree */}
      <div className="p-2">
        {reports.map((report, reportIndex) => (
          <TreeNodeItem
            key={report.id}
            id={report.id}
            name={report.name}
            type="report"
            level={0}
            icon="📋"
            index={reportIndex}
            isExpanded={expandedNodes.has(report.id)}
            isSelected={selectedId === report.id}
            onToggle={() => toggleExpand(report.id)}
            onSelect={() => handleSelect(report.id, 'report')}
            onAddChild={() => handleAdd('section', [report.id])}
            onEdit={() => handleEdit('report', [report.id], report)}
            onDelete={() => handleDelete(report.id, 'report', [])}
            onMoveUp={() => onMoveUp('report', report.id, [])}
            onMoveDown={() => onMoveDown('report', report.id, [])}
            childLabel="+ Раздел"
          >
            {report.sections.map((section, sectionIndex) => (
              <TreeNodeItem
                key={section.id}
                id={section.id}
                name={section.name}
                type="section"
                level={1}
                icon="📁"
                index={sectionIndex}
                isExpanded={expandedNodes.has(section.id)}
                isSelected={selectedId === section.id}
                onToggle={() => toggleExpand(section.id)}
                onSelect={() => handleSelect(section.id, 'section')}
                onAddChild={() => handleAdd('note', [report.id, section.id])}
                onEdit={() => handleEdit('section', [report.id], section)}
                onDelete={() => handleDelete(section.id, 'section', [report.id])}
                onMoveUp={() => onMoveUp('section', section.id, [report.id])}
                onMoveDown={() => onMoveDown('section', section.id, [report.id])}
                childLabel="+ Справка"
              >
                {section.notes.map((note, noteIndex) => (
                  <TreeNodeItem
                    key={note.id}
                    id={note.id}
                    name={note.shortName ? `${note.shortName} — ${note.name}` : note.name}
                    type="note"
                    level={2}
                    icon="📝"
                    index={noteIndex}
                    isExpanded={expandedNodes.has(note.id)}
                    isSelected={selectedId === note.id}
                    onToggle={() => toggleExpand(note.id)}
                    onSelect={() => handleSelect(note.id, 'note')}
                    onAddChild={() => {}}
                    onEdit={() => handleEdit('note', [report.id, section.id], note)}
                    onDelete={() => handleDelete(note.id, 'note', [report.id, section.id])}
                    onMoveUp={() => onMoveUp('note', note.id, [report.id, section.id])}
                    onMoveDown={() => onMoveDown('note', note.id, [report.id, section.id])}
                    childLabels={[
                      { label: 'Блок справки', action: () => handleAdd('noteBlock', [report.id, section.id, note.id]) },
                      { label: 'Показатель', action: () => handleAdd('indicator', [report.id, section.id, note.id]) },
                      { label: 'Источник', action: () => handleAdd('noteSource', [report.id, section.id, note.id]) }
                    ]}
                  >
                    {/* Блоки справки */}
                    {note.noteBlocks && note.noteBlocks.map((noteBlock, noteBlockIndex) => (
                      <TreeNodeItem
                        key={noteBlock.id}
                        id={noteBlock.id}
                        name={noteBlock.name}
                        type="noteBlock"
                        level={3}
                        icon="📑"
                        index={noteBlockIndex}
                        isExpanded={expandedNodes.has(noteBlock.id)}
                        isSelected={selectedId === noteBlock.id}
                        onToggle={() => toggleExpand(noteBlock.id)}
                        onSelect={() => handleSelect(noteBlock.id, 'noteBlock')}
                        onEdit={() => handleEdit('noteBlock', [report.id, section.id, note.id], noteBlock)}
                        onDelete={() => handleDelete(noteBlock.id, 'noteBlock', [report.id, section.id, note.id])}
                        onMoveUp={() => onMoveUp('noteBlock', noteBlock.id, [report.id, section.id, note.id])}
                        onMoveDown={() => onMoveDown('noteBlock', noteBlock.id, [report.id, section.id, note.id])}
                        childLabel="+ Показатель"
                        onAddChild={() => handleAdd('noteBlockIndicator', [report.id, section.id, note.id, noteBlock.id])}
                      >
                        {/* Показатели в блоке справки */}
                        {noteBlock.indicators.map((indicator, indicatorIndex) => (
                          <TreeNodeItem
                            key={indicator.id}
                            id={indicator.id}
                            name={indicator.name}
                            type="indicator"
                            level={4}
                            icon="📊"
                            index={indicatorIndex}
                            isExpanded={expandedNodes.has(indicator.id)}
                            isSelected={selectedId === indicator.id}
                            onToggle={() => toggleExpand(indicator.id)}
                            onSelect={() => handleSelect(indicator.id, 'noteBlockIndicator')}
                            onAddChild={() => handleAdd('noteBlockSlice', [report.id, section.id, note.id, noteBlock.id, indicator.id])}
                            onEdit={() => handleEdit('noteBlockIndicator', [report.id, section.id, note.id, noteBlock.id], indicator)}
                            onDelete={() => handleDelete(indicator.id, 'noteBlockIndicator', [report.id, section.id, note.id, noteBlock.id])}
                            onMoveUp={() => onMoveUp('noteBlockIndicator', indicator.id, [report.id, section.id, note.id, noteBlock.id])}
                            onMoveDown={() => onMoveDown('noteBlockIndicator', indicator.id, [report.id, section.id, note.id, noteBlock.id])}
                            childLabel="+ Разрез"
                          >
                            {indicator.slices.map((slice, sliceIndex) => (
                              <TreeNodeItem
                                key={slice.id}
                                id={slice.id}
                                name={slice.name}
                                type="slice"
                                level={5}
                                icon="🔀"
                                index={sliceIndex}
                                isExpanded={expandedNodes.has(slice.id)}
                                isSelected={selectedId === slice.id}
                                onToggle={() => toggleExpand(slice.id)}
                                onSelect={() => handleSelect(slice.id, 'noteBlockSlice')}
                                onAddChild={() => handleAdd('noteBlockSliceSource', [report.id, section.id, note.id, noteBlock.id, indicator.id, slice.id])}
                                onEdit={() => handleEdit('noteBlockSlice', [report.id, section.id, note.id, noteBlock.id, indicator.id], slice)}
                                onDelete={() => handleDelete(slice.id, 'noteBlockSlice', [report.id, section.id, note.id, noteBlock.id, indicator.id])}
                                onMoveUp={() => onMoveUp('noteBlockSlice', slice.id, [report.id, section.id, note.id, noteBlock.id, indicator.id])}
                                onMoveDown={() => onMoveDown('noteBlockSlice', slice.id, [report.id, section.id, note.id, noteBlock.id, indicator.id])}
                                childLabel="+ Источник"
                              >
                                {slice.sources.map((source, sourceIndex) => (
                                  <TreeNodeItem
                                    key={source.id}
                                    id={source.id}
                                    name={source.name}
                                    type="source"
                                    level={6}
                                    icon="📚"
                                    index={sourceIndex}
                                    isExpanded={false}
                                    isSelected={selectedId === source.id}
                                    isHighlighted={hasSourceType(source)}
                                    onToggle={() => {}}
                                    onSelect={() => handleSelect(source.id, 'noteBlockSliceSource')}
                                    onAddChild={() => {}}
                                    onEdit={() => handleEdit('noteBlockSliceSource', [report.id, section.id, note.id, noteBlock.id, indicator.id, slice.id], source)}
                                    onDelete={() => handleDelete(source.id, 'noteBlockSliceSource', [report.id, section.id, note.id, noteBlock.id, indicator.id, slice.id])}
                                    onMoveUp={() => onMoveUp('noteBlockSource', source.id, [report.id, section.id, note.id, noteBlock.id, indicator.id, slice.id])}
                                    onMoveDown={() => onMoveDown('noteBlockSource', source.id, [report.id, section.id, note.id, noteBlock.id, indicator.id, slice.id])}
                                  />
                                ))}
                              </TreeNodeItem>
                            ))}
                          </TreeNodeItem>
                        ))}
                      </TreeNodeItem>
                    ))}
                    {/* Показатели */}
                    {note.indicators.map((indicator, indicatorIndex) => (
                      <TreeNodeItem
                        key={indicator.id}
                        id={indicator.id}
                        name={indicator.name}
                        type="indicator"
                        level={3}
                        icon="📊"
                        index={indicatorIndex}
                        isExpanded={expandedNodes.has(indicator.id)}
                        isSelected={selectedId === indicator.id}
                        onToggle={() => toggleExpand(indicator.id)}
                        onSelect={() => handleSelect(indicator.id, 'indicator')}
                        onAddChild={() => handleAdd('slice', [report.id, section.id, note.id, indicator.id])}
                        onEdit={() => handleEdit('indicator', [report.id, section.id, note.id], indicator)}
                        onDelete={() => handleDelete(indicator.id, 'indicator', [report.id, section.id, note.id])}
                        onMoveUp={() => onMoveUp('indicator', indicator.id, [report.id, section.id, note.id])}
                        onMoveDown={() => onMoveDown('indicator', indicator.id, [report.id, section.id, note.id])}
                        childLabel="+ Разрез"
                      >
                        {indicator.slices.map((slice, sliceIndex) => (
                          <TreeNodeItem
                            key={slice.id}
                            id={slice.id}
                            name={slice.name}
                            type="slice"
                            level={4}
                            icon="🔀"
                            index={sliceIndex}
                            isExpanded={expandedNodes.has(slice.id)}
                            isSelected={selectedId === slice.id}
                            onToggle={() => toggleExpand(slice.id)}
                            onSelect={() => handleSelect(slice.id, 'slice')}
                            onAddChild={() => handleAdd('source', [report.id, section.id, note.id, indicator.id, slice.id])}
                            onEdit={() => handleEdit('slice', [report.id, section.id, note.id, indicator.id], slice)}
                            onDelete={() => handleDelete(slice.id, 'slice', [report.id, section.id, note.id, indicator.id])}
                            onMoveUp={() => onMoveUp('slice', slice.id, [report.id, section.id, note.id, indicator.id])}
                            onMoveDown={() => onMoveDown('slice', slice.id, [report.id, section.id, note.id, indicator.id])}
                            childLabel="+ Источник"
                          >
                            {slice.sources.map((source, sourceIndex) => (
                              <TreeNodeItem
                                key={source.id}
                                id={source.id}
                                name={source.name}
                                type="source"
                                level={5}
                                icon="📚"
                                index={sourceIndex}
                                isExpanded={false}
                                isSelected={selectedId === source.id}
                                isHighlighted={hasSourceType(source)}
                                onToggle={() => {}}
                                onSelect={() => handleSelect(source.id, 'source')}
                                onAddChild={() => {}}
                                onEdit={() => handleEdit('source', [report.id, section.id, note.id, indicator.id, slice.id], source)}
                                onDelete={() => handleDelete(source.id, 'source', [report.id, section.id, note.id, indicator.id, slice.id])}
                                onMoveUp={() => onMoveUp('source', source.id, [report.id, section.id, note.id, indicator.id, slice.id])}
                                onMoveDown={() => onMoveDown('source', source.id, [report.id, section.id, note.id, indicator.id, slice.id])}
                              />
                            ))}
                          </TreeNodeItem>
                        ))}
                      </TreeNodeItem>
                    ))}
                    {/* Прямые источники справки */}
                    {note.sources && note.sources.map((source, sourceIndex) => (
                      <TreeNodeItem
                        key={source.id}
                        id={source.id}
                        name={source.name}
                        type="source"
                        level={3}
                        icon="📚"
                        index={sourceIndex}
                        isExpanded={false}
                        isSelected={selectedId === source.id}
                        isHighlighted={hasSourceType(source)}
                        onToggle={() => {}}
                        onSelect={() => handleSelect(source.id, 'noteSource')}
                        onAddChild={() => {}}
                        onEdit={() => handleEdit('noteSource', [report.id, section.id, note.id], source)}
                        onDelete={() => handleDelete(source.id, 'noteSource', [report.id, section.id, note.id])}
                        onMoveUp={() => onMoveUp('noteSource', source.id, [report.id, section.id, note.id])}
                        onMoveDown={() => onMoveDown('noteSource', source.id, [report.id, section.id, note.id])}
                      />
                    ))}
                  </TreeNodeItem>
                ))}
              </TreeNodeItem>
            ))}
          </TreeNodeItem>
        ))}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  id: string;
  name: string;
  type: string;
  level: number;
  icon: string;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children?: React.ReactNode;
  childLabel?: string;
  childLabels?: Array<{ label: string; action: () => void }>;
  index?: number;
  isHighlighted?: boolean;
}

function TreeNodeItem({
  id, name, type, level, icon, isExpanded, isSelected, index = 0,
  onToggle, onSelect, onAddChild, onEdit, onDelete, onMoveUp, onMoveDown,
  children, childLabel, childLabels, isHighlighted = false
}: TreeNodeItemProps) {
  const hasChildren = children && React.Children.count(children) > 0;

  // Цвета для разных уровней иерархии с чередованием тональности
  const getBackgroundColor = (type: string, index: number, isSelected: boolean, isHighlighted: boolean): string => {
    if (isHighlighted) return '#fef08a'; // yellow-200 - жёлтый для подсветки
    
    const isEven = index % 2 === 0;
    
    const colorMap: Record<string, [string, string]> = {
      report:    isEven ? ['#fce7f3', '#fbcfe8'] : ['#fbcfe8', '#fce7f3'], // pink (розовый)
      section:   isEven ? ['#e0f2fe', '#bae6fd'] : ['#bae6fd', '#e0f2fe'], // sky blue (голубой)
      note:      isEven ? ['#ffedd5', '#fed7aa'] : ['#fed7aa', '#ffedd5'], // orange (оранжевый)
      noteBlock: isEven ? ['#fef3c7', '#fde68a'] : ['#fde68a', '#fef3c7'], // amber (янтарный)
      indicator: isEven ? ['#dcfce7', '#bbf7d0'] : ['#bbf7d0', '#dcfce7'], // green (зелёный)
      slice:     isEven ? ['#f3e8ff', '#e9d5ff'] : ['#e9d5ff', '#f3e8ff'], // purple (фиолетовый)
      source:    isEven ? ['#f3f4f6', '#e5e7eb'] : ['#e5e7eb', '#f3f4f6'], // gray (серый)
    };
    
    // Более яркие цвета для выбранных элементов
    const selectedColorMap: Record<string, string> = {
      report:    '#f9a8d4', // pink-300 (ярко-розовый)
      section:   '#7dd3fc', // sky-300 (ярко-голубой)
      note:      '#fdba74', // orange-300 (ярко-оранжевый)
      noteBlock: '#fcd34d', // amber-300 (ярко-янтарный)
      indicator: '#86efac', // green-300 (ярко-зелёный)
      slice:     '#d8b4fe', // purple-300 (ярко-фиолетовый)
      source:    '#d1d5db', // gray-300 (ярко-серый)
    };
    
    // Если элемент выбран, вернуть более яркий цвет
    if (isSelected) {
      return selectedColorMap[type] || '#bfdbfe';
    }
    
    const colors = colorMap[type] || ['#f9fafb', '#f3f4f6'];
    return colors[0];
  };

  const getBorderColor = (type: string): string => {
    const borderColors: Record<string, string> = {
      report: '#ec4899',    // pink-500 (розовый)
      section: '#0ea5e9',   // sky-500 (голубой)
      note: '#f97316',      // orange-500 (оранжевый)
      noteBlock: '#f59e0b', // amber-500 (янтарный)
      indicator: '#22c55e', // green-500 (зелёный)
      slice: '#a855f7',     // purple-500 (фиолетовый)
      source: '#6b7280',    // gray-500 (серый)
    };
    return borderColors[type] || 'transparent';
  };

  const bgColor = getBackgroundColor(type, index, isSelected, isHighlighted);
  const borderColor = getBorderColor(type);

  return (
    <div className={`select-none ${type === 'report' ? 'my-6' : ''}`} data-node-id={id}>
      <div
        className="flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all border-l-4 hover:opacity-80"
        style={{ 
          paddingLeft: `${level * 16 + 8}px`,
          backgroundColor: bgColor,
          borderLeftColor: borderColor
        }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors
            ${hasChildren ? 'hover:bg-gray-200 text-gray-500' : 'text-transparent'}
          `}
        >
          <span className={`text-xs transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
        </button>

        {/* Icon */}
        <span className="text-sm flex-shrink-0">{icon}</span>

        {/* Name */}
        <span
          className="flex-1 text-sm truncate ml-1"
          onClick={onSelect}
        >
          {name}
        </span>

        {/* Actions - always visible */}
        <div className={`flex items-center gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
          {childLabels ? (
            childLabels.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); item.action(); }}
                className="px-2 py-1 text-green-600 hover:bg-green-100 rounded transition-colors text-xs font-medium border border-green-300"
                title={item.label}
              >
                + {item.label}
              </button>
            ))
          ) : childLabel ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(); }}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors text-sm font-bold"
              title={childLabel}
            >
              +
            </button>
          ) : null}
          {onMoveUp && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors text-sm"
              title="Переместить вверх"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors text-sm"
              title="Переместить вниз"
            >
              ↓
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors text-sm"
            title="Редактировать"
          >
            ✎
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors text-sm"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}
