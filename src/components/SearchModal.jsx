import React, { useState, useEffect, useRef } from 'react';
import { Search, CornerDownLeft, Command, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX } from '../utils/constants';

const isUrl = (str) => {
  return str.includes('.') || str.includes(':') || str.startsWith('localhost');
};

export const SearchModal = ({ isOpen, onClose, projects, onSelectProject, onQuickNavigate }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && query.trim() && isUrl(query)) {
        const filtered = projects.filter(p => 
          p.name?.toLowerCase().includes(query.toLowerCase()) || 
          (p.path && p.path.toLowerCase().includes(query.toLowerCase())) ||
          (p.url && p.url.toLowerCase().includes(query.toLowerCase()))
        );
        if (filtered.length === 0 && onQuickNavigate) {
          onQuickNavigate(query.trim());
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, projects, onClose, onQuickNavigate]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(query.toLowerCase()) || 
    (p.path && p.path.toLowerCase().includes(query.toLowerCase())) ||
    (p.url && p.url.toLowerCase().includes(query.toLowerCase()))
  );
  
  const showCreateNew = query.trim() && isUrl(query);
  
  const handleCreateNew = () => {
    if (onQuickNavigate && query.trim()) {
      onQuickNavigate(query.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-[15vh] bg-zinc-900/10 dark:bg-black/20 backdrop-blur-[2px] transition-all duration-300" style={{ zIndex: Z_INDEX.MODAL_BACKDROP }} onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-5 border-b border-zinc-100 dark:border-white/5 h-16">
          <Search className="text-zinc-400 dark:text-zinc-500 mr-4" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-xl font-light"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-500 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">ESC</div>
        </div>
        
        <div className="max-h-[360px] overflow-y-auto p-2 scroll-smooth">
            {showCreateNew && (
              <div className="mb-2">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">{t('search.quickCreate')}</div>
                <button
                  onClick={handleCreateNew}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl group transition-colors text-left border border-dashed border-indigo-300 dark:border-indigo-700"
                >
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Plus size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('search.createAndOpen')}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">{query}</span>
                  </div>
                  <CornerDownLeft size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                </button>
              </div>
            )}
            
            {filteredProjects.length === 0 && !showCreateNew ? (
                <div className="py-12 text-center">
                    <p className="text-zinc-500 dark:text-zinc-600 mb-1">{t('search.noResults')}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{t('search.createHint')}</p>
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="space-y-1">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">{t('search.results')}</div>
                    {filteredProjects.map((project) => (
                        <button
                            key={project.id}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl group transition-colors text-left relative overflow-hidden"
                            onClick={() => {
                                onSelectProject(project.id);
                                onClose();
                            }}
                        >
                            <div className="flex flex-col relative z-10">
                                <span className="text-base font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white">{project.name}</span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 font-mono truncate max-w-[340px]">{project.path}</span>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${project.status === 'running' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                    {t(`project.status.${project.status}`)}
                                </div>
                                <CornerDownLeft size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
        
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#09090b] border-t border-zinc-100 dark:border-white/5 flex items-center justify-end text-[10px] text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-1.5">
                <kbd className="font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shadow-sm">⌘T</kbd>
                <span>{t('search.openSearch')}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

