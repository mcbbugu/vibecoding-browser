import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { electronAPI } from '../utils/electron';
import { storage } from '../utils/storage';

export const ProjectEditModal = ({ project, isOpen, onClose, onSave, projects = [] }) => {
  const getDefaultForm = () => ({
    name: '',
    url: '',
    port: '',
    path: '',
    type: 'web',
    note: '',
    editorConfig: null
  });

  const [formData, setFormData] = useState(getDefaultForm());

  useEffect(() => {
    if (project) {
      const globalEditorConfig = storage.get('editorConfig', { command: 'code', args: ['{path}'] });
      setFormData({
        name: project.name || '',
        url: project.url || '',
        port: project.port ?? '',
        path: project.path || '',
        type: project.type || 'web',
        note: project.note || '',
        editorConfig: project.editorConfig || null
      });
    } else {
      setFormData(getDefaultForm());
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.name.trim(),
      url: formData.url.trim(),
      port: formData.port === '' ? null : Number(formData.port) || null,
      path: formData.path.trim(),
      note: formData.note.trim(),
      editorConfig: formData.editorConfig || undefined
    };
    onSave(project.id, payload);
    onClose();
  };

  const handleSelectFolder = async () => {
    const folder = await electronAPI.selectFolder();
    if (folder) {
      setFormData(prev => ({ ...prev, path: folder }));
    }
  };

  const presetEditors = [
    { name: 'VS Code', command: 'code', args: ['{path}'] },
    { name: 'Cursor', command: 'cursor', args: ['{path}'] },
    { name: 'Windsurf', command: 'windsurf', args: ['{path}'] },
    { name: 'Sublime Text', command: 'subl', args: ['{path}'] },
    { name: 'Atom', command: 'atom', args: ['{path}'] },
    { name: 'WebStorm', command: 'webstorm', args: ['{path}'] },
  ];

  const getEditorConfig = () => {
    if (formData.editorConfig) {
      return formData.editorConfig;
    }
    return storage.get('editorConfig', { command: 'code', args: ['{path}'] });
  };

  const editorConfig = getEditorConfig();

  const handlePresetSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      editorConfig: {
        command: preset.command,
        args: [...preset.args]
      }
    }));
  };

  const handleAddArg = () => {
    const currentConfig = getEditorConfig();
    setFormData(prev => ({
      ...prev,
      editorConfig: {
        command: currentConfig.command,
        args: [...currentConfig.args, '']
      }
    }));
  };

  const handleRemoveArg = (index) => {
    const currentConfig = getEditorConfig();
    if (currentConfig.args.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      editorConfig: {
        command: currentConfig.command,
        args: currentConfig.args.filter((_, i) => i !== index)
      }
    }));
  };

  const handleArgChange = (index, value) => {
    const currentConfig = getEditorConfig();
    setFormData(prev => ({
      ...prev,
      editorConfig: {
        command: currentConfig.command,
        args: currentConfig.args.map((arg, i) => i === index ? value : arg)
      }
    }));
  };

  const handleCommandChange = (value) => {
    const currentConfig = getEditorConfig();
    setFormData(prev => ({
      ...prev,
      editorConfig: {
        command: value,
        args: currentConfig.args
      }
    }));
  };

  const handleUseGlobalConfig = () => {
    setFormData(prev => ({
      ...prev,
      editorConfig: null
    }));
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
        className="w-full max-w-lg bg-white dark:bg-[#1c1c1f] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden"
        style={{ zIndex: 100000 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Edit Project</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">URL <span className="text-zinc-400 text-xs">(required)</span></label>
            <input
              type="text"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com or localhost:3000"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Port <span className="text-zinc-400 text-xs">(optional)</span></label>
              <input
                type="number"
                value={formData.port}
                onChange={e => setFormData(prev => ({ ...prev, port: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="3000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="web">Web</option>
                <option value="react">React</option>
                <option value="vue">Vue</option>
                <option value="next">Next.js</option>
                <option value="vite">Vite</option>
                <option value="node">Node.js</option>
                <option value="python">Python</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.path}
                onChange={e => setFormData(prev => ({ ...prev, path: e.target.value }))}
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="~/dev/project"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notes</label>
            <textarea
              value={formData.note}
              onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Add notes about this project..."
            />
          </div>

          <div className="border-t border-zinc-200 dark:border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">IDE 配置</label>
              {formData.editorConfig && (
                <button
                  type="button"
                  onClick={handleUseGlobalConfig}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  使用全局配置
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">预设编辑器</label>
                <div className="grid grid-cols-3 gap-2">
                  {presetEditors.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
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
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">命令</label>
                <input
                  type="text"
                  value={editorConfig.command}
                  onChange={(e) => handleCommandChange(e.target.value)}
                  placeholder="例如: code, cursor, subl"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">参数</label>
                <div className="space-y-2">
                  {editorConfig.args.map((arg, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={arg}
                        onChange={(e) => handleArgChange(index, e.target.value)}
                        placeholder="例如: {path}"
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      {editorConfig.args.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveArg(index)}
                          className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddArg}
                    className="w-full px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={12} />
                    添加参数
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1">使用 {'{path}'} 作为项目路径占位符</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

