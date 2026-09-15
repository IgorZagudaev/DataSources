import React, { useState } from 'react';
import { Report } from '../types';

interface TreeViewProps {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string, type: string) => void;
  onAdd: (type: string, parentIds: string[]) => void;
  onEdit: (type: string, parentIds: string[], data: any) => void;
  onDelete: (id: string, type: string, parentIds: string[]) => void;
  sourceTypeFilter?: string;
}

export function TreeView({ reports, selectedId, onSelect, onAdd, onEdit, onDelete, sourceTypeFilter = '' }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['report-1']));

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    <div className="h-full overflow-y-auto">
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
  children?: React.ReactNode;
  childLabel?: string;
  childLabels?: Array<{ label: string; action: () => void }>;
  index?: number;
  isHighlighted?: boolean;
}

function TreeNodeItem({
  name, type, level, icon, isExpanded, isSelected, index = 0,
  onToggle, onSelect, onAddChild, onEdit, onDelete,
  children, childLabel, childLabels, isHighlighted = false
}: TreeNodeItemProps) {
  const hasChildren = children && React.Children.count(children) > 0;

  // Цвета для разных уровней иерархии с чередованием тональности
  const getBackgroundColor = (type: string, index: number, isSelected: boolean, isHighlighted: boolean): string => {
    if (isSelected) return '#dbeafe'; // blue-100
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
    <div className={`select-none ${type === 'report' ? 'my-6' : ''}`}>
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
