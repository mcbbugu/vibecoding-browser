import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FolderOpen, Link2 } from 'lucide-react';
import { electronAPI } from '../utils/electron';
import { getProjectCategory } from '../constants';

export const ProjectEditModal = ({ project, isOpen, onClose, onSave, spaces = [], projects = [] }) => {
  const getDefaultForm = () => ({
    name: '',
    url: '',
    port: '',
    path: '',
    type: 'web',
    space: spaces.length > 0 ? spaces[0].id : 'work',
    note: '',
    boundProjectId: ''
  });

  const [formData, setFormData] = useState(getDefaultForm());

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        url: project.url || '',
        port: project.port ?? '',
        path: project.path || '',
        type: project.type || 'web',
        space: project.space || (spaces.length > 0 ? spaces[0].id : 'work'),
        note: project.note || '',
        boundProjectId: project.boundProjectId || ''
      });
    } else {
      setFormData(getDefaultForm());
    }
  }, [project, spaces]);

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
      boundProjectId: formData.boundProjectId || null
    };
    onSave(project.id, payload);
    onClose();
  };

  const currentCategory = project ? getProjectCategory(project) : 'local';
  const oppositeCategory = currentCategory === 'local' ? 'online' : 'local';
  const availableProjects = projects.filter(p => {
    if (p.id === project.id) return false;
    const pCategory = getProjectCategory(p);
    return pCategory === oppositeCategory;
  });

  const handleSelectFolder = async () => {
    const folder = await electronAPI.selectFolder();
    if (folder) {
      setFormData(prev => ({ ...prev, path: folder }));
    }
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
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all cursor-pointer appearance-none hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <option value="web" className="bg-white dark:bg-zinc-800">Web</option>
                  <option value="react" className="bg-white dark:bg-zinc-800">React</option>
                  <option value="vue" className="bg-white dark:bg-zinc-800">Vue</option>
                  <option value="next" className="bg-white dark:bg-zinc-800">Next.js</option>
                  <option value="vite" className="bg-white dark:bg-zinc-800">Vite</option>
                  <option value="node" className="bg-white dark:bg-zinc-800">Node.js</option>
                  <option value="python" className="bg-white dark:bg-zinc-800">Python</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Space</label>
            <div className="relative">
              <select
                value={formData.space}
                onChange={e => setFormData(prev => ({ ...prev, space: e.target.value }))}
                className="w-full px-3 py-2 pr-8 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all cursor-pointer appearance-none hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {spaces.map(space => (
                  <option key={space.id} value={space.id} className="bg-white dark:bg-zinc-800">{space.name}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <div className="flex items-center gap-2">
                <Link2 size={14} />
                <span>绑定项目</span>
                <span className="text-zinc-400 text-xs font-normal">({oppositeCategory === 'local' ? '本地开发' : '在线域名'})</span>
              </div>
            </label>
            <div className="relative">
              <select
                value={formData.boundProjectId}
                onChange={e => setFormData(prev => ({ ...prev, boundProjectId: e.target.value }))}
                className="w-full px-3 py-2 pr-8 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all cursor-pointer appearance-none hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <option value="" className="bg-white dark:bg-zinc-800">无绑定</option>
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-800">{p.name} - {p.url}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {availableProjects.length === 0 && (
              <p className="text-xs text-zinc-400 mt-1">暂无{oppositeCategory === 'local' ? '本地开发' : '在线域名'}项目可绑定</p>
            )}
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

