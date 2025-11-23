import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { storage } from '../utils/storage';

export const EditorConfigModal = ({ isOpen, onClose, showToast }) => {
  const [editorConfig, setEditorConfig] = useState({
    command: 'code',
    args: ['{path}']
  });

  useEffect(() => {
    if (isOpen) {
      const saved = storage.get('editorConfig', { command: 'code', args: ['{path}'] });
      setEditorConfig(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    storage.set('editorConfig', editorConfig);
    showToast('编辑器配置已保存', 'success');
    onClose();
  };

  const handleAddArg = () => {
    setEditorConfig(prev => ({
      ...prev,
      args: [...prev.args, '']
    }));
  };

  const handleRemoveArg = (index) => {
    setEditorConfig(prev => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }));
  };

  const handleArgChange = (index, value) => {
    setEditorConfig(prev => ({
      ...prev,
      args: prev.args.map((arg, i) => i === index ? value : arg)
    }));
  };

  const presetEditors = [
    { name: 'VS Code', command: 'code', args: ['{path}'] },
    { name: 'Cursor', command: 'cursor', args: ['{path}'] },
    { name: 'Sublime Text', command: 'subl', args: ['{path}'] },
    { name: 'Atom', command: 'atom', args: ['{path}'] },
    { name: 'WebStorm', command: 'webstorm', args: ['{path}'] },
  ];

  const handlePresetSelect = (preset) => {
    setEditorConfig({
      command: preset.command,
      args: [...preset.args]
    });
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      style={{ 
        zIndex: 99999,
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
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">配置编辑器</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              预设编辑器
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presetEditors.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    editorConfig.command === preset.command
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              命令
            </label>
            <input
              type="text"
              value={editorConfig.command}
              onChange={(e) => setEditorConfig(prev => ({ ...prev, command: e.target.value }))}
              placeholder="例如: code, cursor, subl"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-zinc-400 mt-1">命令名称（需要在系统PATH中）</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              参数
            </label>
            <div className="space-y-2">
              {editorConfig.args.map((arg, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={arg}
                    onChange={(e) => handleArgChange(index, e.target.value)}
                    placeholder="例如: {path}"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {editorConfig.args.length > 1 && (
                    <button
                      onClick={() => handleRemoveArg(index)}
                      className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddArg}
                className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                添加参数
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1">使用 {'{path}'} 作为项目路径占位符</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2"
            >
              <Save size={16} />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

