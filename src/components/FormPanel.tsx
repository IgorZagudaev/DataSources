import React, { useState } from 'react';
import {
  addReport, updateReport,
  addSection, updateSection,
  addNote, updateNote,
  addNoteSource, updateNoteSource,
  addNoteBlock, updateNoteBlock,
  addIndicator, updateIndicator,
  addSlice, updateSlice,
  addSource, updateSource,
  addNoteBlockIndicator, updateNoteBlockIndicator,
  addNoteBlockSlice, updateNoteBlockSlice,
  addNoteBlockSource, updateNoteBlockSource
} from '../store';
import { SOURCE_TYPES, SourceType } from '../types';

interface FormPanelProps {
  formState: {
    type: string;
    parentIds: string[];
    editData?: any;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

export function FormPanel({ formState, onClose, onSave }: FormPanelProps) {
  const [name, setName] = useState(formState?.editData?.name || '');
  const [shortName, setShortName] = useState(formState?.editData?.shortName || '');
  const [description, setDescription] = useState(formState?.editData?.description || '');
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>(formState?.editData?.sourceTypes || []);

  if (!formState) return null;

  const getLabels = (type: string) => {
    const labels: Record<string, { name: string; description: string; title: string; shortName?: string }> = {
      report: { name: 'Название доклада', description: 'Описание доклада', title: 'Доклад' },
      section: { name: 'Название раздела', description: 'Описание раздела', title: 'Раздел' },
      note: { name: 'Название справки', description: 'Текст справки', title: 'Справка', shortName: 'Краткое название' },
      noteBlock: { name: 'Название блока справки', description: 'Описание блока', title: 'Блок справки' },
      indicator: { name: 'Название показателя', description: 'Описание показателя', title: 'Показатель' },
      noteBlockIndicator: { name: 'Название показателя', description: 'Описание показателя', title: 'Показатель' },
      slice: { name: 'Название разреза', description: 'Описание разреза данных', title: 'Разрез' },
      noteBlockSlice: { name: 'Название разреза', description: 'Описание разреза данных', title: 'Разрез' },
      source: { name: 'Название источника', description: 'Описание источника данных', title: 'Источник' },
      noteSource: { name: 'Название источника', description: 'Описание источника данных', title: 'Источник' },
      noteBlockSource: { name: 'Название источника', description: 'Описание источника данных', title: 'Источник' },
      noteBlockSliceSource: { name: 'Название источника', description: 'Описание источника данных', title: 'Источник' },
    };
    return labels[type] || { name: 'Название', description: 'Описание', title: 'Элемент' };
  };

  const labels = getLabels(formState.type);
  const isEdit = !!formState.editData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { type, parentIds, editData } = formState;

    if (isEdit) {
      // Режим редактирования
      switch (type) {
        case 'report':
          updateReport(editData.id, name, description);
          break;
        case 'section':
          updateSection(parentIds[0], editData.id, name, description);
          break;
        case 'note':
          updateNote(parentIds[0], parentIds[1], editData.id, name, description, shortName);
          break;
        case 'noteBlock':
          updateNoteBlock(parentIds[0], parentIds[1], parentIds[2], editData.id, name, description);
          break;
        case 'indicator':
          updateIndicator(parentIds[0], parentIds[1], parentIds[2], editData.id, name, description);
          break;
        case 'noteBlockIndicator':
          updateNoteBlockIndicator(parentIds[0], parentIds[1], parentIds[2], parentIds[3], editData.id, name, description);
          break;
        case 'slice':
          updateSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], editData.id, name, description);
          break;
        case 'noteBlockSlice':
          updateNoteBlockSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], editData.id, name, description);
          break;
        case 'source':
          updateSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], editData.id, name, description, sourceTypes);
          break;
        case 'noteSource':
          updateNoteSource(parentIds[0], parentIds[1], parentIds[2], editData.id, name, description, sourceTypes);
          break;
        case 'noteBlockSource':
          updateNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], editData.id, name, description, sourceTypes);
          break;
        case 'noteBlockSliceSource':
          updateNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], editData.id, name, description, sourceTypes);
          break;
      }
    } else {
      // Режим добавления
      switch (type) {
        case 'report':
          addReport(name, description);
          break;
        case 'section':
          addSection(parentIds[0], name, description);
          break;
        case 'note':
          addNote(parentIds[0], parentIds[1], name, description, shortName);
          break;
        case 'noteBlock':
          addNoteBlock(parentIds[0], parentIds[1], parentIds[2], name, description);
          break;
        case 'indicator':
          addIndicator(parentIds[0], parentIds[1], parentIds[2], name, description);
          break;
        case 'noteBlockIndicator':
          addNoteBlockIndicator(parentIds[0], parentIds[1], parentIds[2], parentIds[3], name, description);
          break;
        case 'slice':
          addSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], name, description);
          break;
        case 'noteBlockSlice':
          addNoteBlockSlice(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], name, description);
          break;
        case 'source':
          addSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], name, description, sourceTypes);
          break;
        case 'noteSource':
          addNoteSource(parentIds[0], parentIds[1], parentIds[2], name, description, sourceTypes);
          break;
        case 'noteBlockSource':
          addNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], name, description, sourceTypes);
          break;
        case 'noteBlockSliceSource':
          addNoteBlockSource(parentIds[0], parentIds[1], parentIds[2], parentIds[3], parentIds[4], parentIds[5], name, description, sourceTypes);
          break;
      }
    }

    onSave();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isEdit ? '✎' : '+'}</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {isEdit ? 'Редактирование' : 'Добавление'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-lg"
          title="Закрыть"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {isEdit ? 'Редактировать' : 'Добавить'}: {labels.title}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.name} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Введите название..."
              // autoFocus
              required
            />
          </div>

          {formState.type === 'note' && labels.shortName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {labels.shortName}
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Введите краткое название..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Введите описание (необязательно)..."
              rows={4}
            />
          </div>

          {(formState.type === 'source' || formState.type === 'noteSource' || formState.type === 'noteBlockSource' || formState.type === 'noteBlockSliceSource') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип источника
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SOURCE_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={sourceTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSourceTypes([...sourceTypes, type]);
                        } else {
                          setSourceTypes(sourceTypes.filter(t => t !== type));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 rounded-lg transition-colors"
          >
            {isEdit ? 'Сохранить' : 'Добавить'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

interface DeleteConfirmPanelProps {
  deleteConfirm: {
    id: string;
    type: string;
    parentIds: string[];
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmPanel({ deleteConfirm, onClose, onConfirm }: DeleteConfirmPanelProps) {
  if (!deleteConfirm) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Подтверждение удаления
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-lg"
          title="Закрыть"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Подтвердите удаление
          </h2>
          <p className="text-gray-600">
            Вы уверены, что хотите удалить этот элемент и все вложенные данные?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Это действие нельзя отменить.
          </p>
        </div>

        <div className="flex gap-2 w-full max-w-xs">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Удалить
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
