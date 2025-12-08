import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { storage } from '../utils/storage';
import { Z_INDEX } from '../utils/constants';

export const EditorConfigModal = ({ isOpen, onClose, showToast }) => {
  const { t } = useTranslation();
  const [selectedEditor, setSelectedEditor] = useState('cursor');
  const [customEditors, setCustomEditors] = useState([]);

  const presetEditors = [
    { id: 'code', name: 'VS Code', command: 'code' },
    { id: 'cursor', name: 'Cursor', command: 'cursor' },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf' },
  ];

  useEffect(() => {
    if (isOpen) {
      const savedEditor = storage.get('selectedEditor', 'cursor');
      const savedCustomEditors = storage.get('customEditors', []);
      setSelectedEditor(savedEditor);
      setCustomEditors(savedCustomEditors);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    storage.set('selectedEditor', selectedEditor);
    storage.set('customEditors', customEditors);
    showToast(t('toast.editorConfigSaved'), 'success');
    onClose();
  };

  const handleAddCustomEditor = () => {
    const newEditor = {
      id: `custom-${Date.now()}`,
      name: '',
      command: ''
    };
    setCustomEditors(prev => [...prev, newEditor]);
  };

  const handleRemoveCustomEditor = (id) => {
    setCustomEditors(prev => prev.filter(e => e.id !== id));
    if (selectedEditor === id) {
      setSelectedEditor('cursor');
    }
  };

  const handleCustomEditorChange = (id, field, value) => {
    setCustomEditors(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm"
      style={{ 
        zIndex: Z_INDEX.MODAL_BACKDROP,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-800"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('editorConfig.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-3">
            <p className="text-xs text-accent-700 dark:text-accent-300 leading-relaxed">
              {t('settings.editorHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t('editorConfig.selectEditor')}
            </label>
            <div className="space-y-2">
              {presetEditors.map(editor => (
                <label
                  key={editor.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEditor === editor.id
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="editor"
                    value={editor.id}
                    checked={selectedEditor === editor.id}
                    onChange={() => setSelectedEditor(editor.id)}
                    className="w-4 h-4 text-accent-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{editor.name}</span>
                  <span className="text-xs text-zinc-400 ml-auto font-mono">{editor.command}</span>
                </label>
              ))}
              
              {customEditors.map(editor => (
                <div
                  key={editor.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedEditor === editor.id
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="editor"
                    value={editor.id}
                    checked={selectedEditor === editor.id}
                    onChange={() => setSelectedEditor(editor.id)}
                    className="w-4 h-4 text-accent-500"
                  />
              <input
                type="text"
                value={editor.name}
                onChange={(e) => handleCustomEditorChange(editor.id, 'name', e.target.value)}
                placeholder={t('editorConfig.namePlaceholder')}
                className="flex-1 px-2 py-1 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accent-500"
              />
              <input
                type="text"
                value={editor.command}
                onChange={(e) => handleCustomEditorChange(editor.id, 'command', e.target.value)}
                placeholder={t('editorConfig.commandPlaceholder')}
                className="w-24 px-2 py-1 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-xs font-mono text-zinc-400 focus:outline-none focus:border-accent-500"
              />
                  <button
                    onClick={() => handleRemoveCustomEditor(editor.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddCustomEditor}
              className="w-full mt-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              {t('settings.addCustomEditor')}
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {t('action.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg flex items-center gap-2"
            >
              <Save size={16} />
              {t('action.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
