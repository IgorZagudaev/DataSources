import React, { useState } from 'react';
import { Report } from '../types';
import {
  addReport, updateReport, deleteReport,
  addSection, updateSection, deleteSection,
  addNote, updateNote, deleteNote,
  addNoteSource, updateNoteSource, deleteNoteSource,
  addIndicator, updateIndicator, deleteIndicator,
  addSlice, updateSlice, deleteSlice,
  addSource, updateSource, deleteSource
} from '../store';
import { Modal, EntityForm, ConfirmDialog } from './Modal';

interface TreeViewProps {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string, type: string) => void;
}

export function TreeView({ reports, selectedId, onSelect }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['report-1']));
  const [modalState, setModalState] = useState<{ type: string; parentIds: string[]; editData?: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string; parentIds: string[] } | null>(null);

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
    setModalState({ type, parentIds });
  };

  const handleEdit = (type: string, parentIds: string[], data: any) => {
    setModalState({ type, parentIds, editData: data });
  };

  const handleSave = (name: string, description: string) => {
    if (!modalState) return;
    const { type, parentIds, editData } = modalState;

    if (editData) {
      // Edit mode
      switch (type) {
        case 'report':
          updateReport(editData.id, name, description);
          break;
        case 'section':
          updateSection(parentIds[0], editData.id, name, description);
          break;
        case 'note':
          updateNote(parentIds[0], parentIds[1], editData.id, name, description);
          break;
        case 'indicator':
          updateIndicator(parentIds[0], parentIds[1], parentIds[2], editData.id, name, description);
          break;
        case 'slice':
          updateSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], editData.id, name, description);
          break;
        case 'source':
          updateSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], editData.id, name, description);
          break;
        case 'noteSource':
          updateNoteSource(parentIds[0], parentIds[1], parentIds[2], editData.id, name, description);
          break;
      }
    } else {
      // Add mode
      let newId = '';
      switch (type) {
        case 'report': {
          const r = addReport(name, description);
          newId = r.id;
          break;
        }
        case 'section': {
          const s = addSection(parentIds[0], name, description);
          newId = s.id;
          break;
        }
        case 'note': {
          const n = addNote(parentIds[0], parentIds[1], name, description);
          newId = n.id;
          break;
        }
        case 'indicator': {
          const ind = addIndicator(parentIds[0], parentIds[1], parentIds[2], name, description);
          newId = ind.id;
          break;
        }
        case 'slice': {
          const sl = addSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], name, description);
          newId = sl.id;
          break;
        }
        case 'source': {
          const src = addSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], name, description);
          newId = src.id;
          break;
        }
        case 'noteSource': {
          const ns = addNoteSource(parentIds[0], parentIds[1], parentIds[2], name, description);
          newId = ns.id;
          break;
        }
      }
      // Auto-expand parent and new item
      setExpandedNodes(prev => {
        const next = new Set(prev);
        parentIds.forEach(id => next.add(id));
        if (newId && ['report', 'section', 'note', 'indicator', 'slice'].includes(type)) {
          next.add(newId);
        }
        return next;
      });
    }
    setModalState(null);
  };

  const handleDelete = (id: string, type: string, parentIds: string[]) => {
    setDeleteConfirm({ id, type, parentIds });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
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
      case 'indicator':
        deleteIndicator(parentIds[0], parentIds[1], parentIds[2], id);
        break;
      case 'slice':
        deleteSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], id);
        break;
      case 'source':
        deleteSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], id);
        break;
      case 'noteSource':
        deleteNoteSource(parentIds[0], parentIds[1], parentIds[2], id);
        break;
    }
    setDeleteConfirm(null);
  };

  const getLabels = (type: string) => {
    const labels: Record<string, { name: string; description: string }> = {
      report: { name: 'Название доклада', description: 'Описание доклада' },
      section: { name: 'Название раздела', description: 'Описание раздела' },
      note: { name: 'Название справки', description: 'Текст справки' },
      indicator: { name: 'Название показателя', description: 'Описание показателя' },
      slice: { name: 'Название разреза', description: 'Описание разреза данных' },
      source: { name: 'Название источника', description: 'Описание источника данных' },
      noteSource: { name: 'Название источника', description: 'Описание источника данных' },
    };
    return labels[type] || { name: 'Название', description: 'Описание' };
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Tree */}
      <div className="p-2">
        <div className="mb-3">
          <button
            onClick={() => handleAdd('report', [])}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <span>+</span>
            Добавить доклад
          </button>
        </div>

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
                    name={note.name}
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
                    childOptions={[
                      { label: '📊 Показатель', type: 'indicator' },
                      { label: '📚 Источник', type: 'noteSource' }
                    ]}
                    onAddChildType={(type) => handleAdd(type, [report.id, section.id, note.id])}
                  >
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
                    {note.sources.map((source, sourceIndex) => (
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.editData ? 'Редактирование' : `Добавить: ${getLabels(modalState?.type || '').name}`}
      >
        {modalState && (
          <EntityForm
            onSave={handleSave}
            onCancel={() => setModalState(null)}
            initialName={modalState.editData?.name || ''}
            initialDescription={modalState.editData?.description || ''}
            nameLabel={getLabels(modalState.type).name}
            descriptionLabel={getLabels(modalState.type).description}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        message="Вы уверены, что хотите удалить этот элемент и все вложенные данные?"
      />
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
  childOptions?: Array<{ label: string; type: string }>;
  onAddChildType?: (type: string) => void;
  index?: number;
}

function TreeNodeItem({
  name, type, level, icon, isExpanded, isSelected, index = 0,
  onToggle, onSelect, onAddChild, onEdit, onDelete,
  children, childLabel, childOptions, onAddChildType
}: TreeNodeItemProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const hasChildren = children && React.Children.count(children) > 0;

  // Цвета для разных уровней иерархии с чередованием тональности
  const getBackgroundColor = (type: string, index: number, isSelected: boolean): string => {
    if (isSelected) return '#dbeafe'; // blue-100
    
    const isEven = index % 2 === 0;
    
    const colorMap: Record<string, [string, string]> = {
      report:    isEven ? ['#fce7f3', '#fbcfe8'] : ['#fbcfe8', '#fce7f3'], // pink (розовый)
      section:   isEven ? ['#e0f2fe', '#bae6fd'] : ['#bae6fd', '#e0f2fe'], // sky blue (голубой)
      note:      isEven ? ['#ffedd5', '#fed7aa'] : ['#fed7aa', '#ffedd5'], // orange (оранжевый)
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
      indicator: '#22c55e', // green-500 (зелёный)
      slice: '#a855f7',     // purple-500 (фиолетовый)
      source: '#6b7280',    // gray-500 (серый)
    };
    return borderColors[type] || 'transparent';
  };

  const bgColor = getBackgroundColor(type, index, isSelected);
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
          {childOptions && onAddChildType ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors text-sm font-bold"
                title="Добавить"
              >
                +
              </button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                  {childOptions.map(opt => (
                    <button
                      key={opt.type}
                      onClick={(e) => { e.stopPropagation(); onAddChildType(opt.type); setShowAddMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
