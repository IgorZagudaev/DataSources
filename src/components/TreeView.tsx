import React, { useState } from 'react';
import { Report } from '../types';
import {
  addReport, updateReport, deleteReport,
  addSection, updateSection, deleteSection,
  addNote, updateNote, deleteNote,
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
    };
    return labels[type] || { name: 'Название', description: 'Описание' };
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Add Report button */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => handleAdd('report', [])}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить доклад
        </button>
      </div>

      {/* Tree */}
      <div className="p-2">
        {reports.map(report => (
          <TreeNodeItem
            key={report.id}
            id={report.id}
            name={report.name}
            type="report"
            level={0}
            icon="📋"
            isExpanded={expandedNodes.has(report.id)}
            isSelected={selectedId === report.id}
            onToggle={() => toggleExpand(report.id)}
            onSelect={() => handleSelect(report.id, 'report')}
            onAddChild={() => handleAdd('section', [report.id])}
            onEdit={() => handleEdit('report', [report.id], report)}
            onDelete={() => handleDelete(report.id, 'report', [])}
            childLabel="+ Раздел"
          >
            {report.sections.map(section => (
              <TreeNodeItem
                key={section.id}
                id={section.id}
                name={section.name}
                type="section"
                level={1}
                icon="📁"
                isExpanded={expandedNodes.has(section.id)}
                isSelected={selectedId === section.id}
                onToggle={() => toggleExpand(section.id)}
                onSelect={() => handleSelect(section.id, 'section')}
                onAddChild={() => handleAdd('note', [report.id, section.id])}
                onEdit={() => handleEdit('section', [report.id], section)}
                onDelete={() => handleDelete(section.id, 'section', [report.id])}
                childLabel="+ Справка"
              >
                {section.notes.map(note => (
                  <TreeNodeItem
                    key={note.id}
                    id={note.id}
                    name={note.name}
                    type="note"
                    level={2}
                    icon="📝"
                    isExpanded={expandedNodes.has(note.id)}
                    isSelected={selectedId === note.id}
                    onToggle={() => toggleExpand(note.id)}
                    onSelect={() => handleSelect(note.id, 'note')}
                    onAddChild={() => handleAdd('indicator', [report.id, section.id, note.id])}
                    onEdit={() => handleEdit('note', [report.id, section.id], note)}
                    onDelete={() => handleDelete(note.id, 'note', [report.id, section.id])}
                    childLabel="+ Показатель"
                  >
                    {note.indicators.map(indicator => (
                      <TreeNodeItem
                        key={indicator.id}
                        id={indicator.id}
                        name={indicator.name}
                        type="indicator"
                        level={3}
                        icon="📊"
                        isExpanded={expandedNodes.has(indicator.id)}
                        isSelected={selectedId === indicator.id}
                        onToggle={() => toggleExpand(indicator.id)}
                        onSelect={() => handleSelect(indicator.id, 'indicator')}
                        onAddChild={() => handleAdd('slice', [report.id, section.id, note.id, indicator.id])}
                        onEdit={() => handleEdit('indicator', [report.id, section.id, note.id], indicator)}
                        onDelete={() => handleDelete(indicator.id, 'indicator', [report.id, section.id, note.id])}
                        childLabel="+ Разрез"
                      >
                        {indicator.slices.map(slice => (
                          <TreeNodeItem
                            key={slice.id}
                            id={slice.id}
                            name={slice.name}
                            type="slice"
                            level={4}
                            icon="🔀"
                            isExpanded={expandedNodes.has(slice.id)}
                            isSelected={selectedId === slice.id}
                            onToggle={() => toggleExpand(slice.id)}
                            onSelect={() => handleSelect(slice.id, 'slice')}
                            onAddChild={() => handleAdd('source', [report.id, section.id, note.id, indicator.id, slice.id])}
                            onEdit={() => handleEdit('slice', [report.id, section.id, note.id, indicator.id], slice)}
                            onDelete={() => handleDelete(slice.id, 'slice', [report.id, section.id, note.id, indicator.id])}
                            childLabel="+ Источник"
                          >
                            {slice.sources.map(source => (
                              <TreeNodeItem
                                key={source.id}
                                id={source.id}
                                name={source.name}
                                type="source"
                                level={5}
                                icon="📚"
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
}

function TreeNodeItem({
  name, type, level, icon, isExpanded, isSelected,
  onToggle, onSelect, onAddChild, onEdit, onDelete,
  children, childLabel
}: TreeNodeItemProps) {
  const hasChildren = children && React.Children.count(children) > 0;

  const levelColors: Record<string, string> = {
    report: 'border-l-blue-500',
    section: 'border-l-green-500',
    note: 'border-l-yellow-500',
    indicator: 'border-l-purple-500',
    slice: 'border-l-orange-500',
    source: 'border-l-pink-500',
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'bg-blue-50 border-l-4 ' + (levelColors[type] || '') : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors
            ${hasChildren ? 'hover:bg-gray-200 text-gray-500' : 'text-transparent'}
          `}
        >
          <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
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
        <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
          {childLabel ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(); }}
              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
              title={childLabel}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : null}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Редактировать"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Удалить"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
