import React, { useState, useEffect, useRef } from 'react';
import { Search, CornerDownLeft, Command } from 'lucide-react';

export const SearchModal = ({ isOpen, onClose, projects, onSelectProject }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.path.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-zinc-50/80 dark:bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-5 border-b border-zinc-100 dark:border-white/5 h-16">
          <Search className="text-zinc-400 dark:text-zinc-500 mr-4" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-xl font-light"
            placeholder="Search projects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-500 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">ESC</div>
        </div>
        
        <div className="max-h-[360px] overflow-y-auto p-2 scroll-smooth">
            {filteredProjects.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-zinc-500 dark:text-zinc-600 mb-2">No matching projects found.</p>
                    <button className="text-indigo-500 hover:underline text-sm">Create new project?</button>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">Top Results</div>
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
                                    {project.status}
                                </div>
                                <CornerDownLeft size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#151518] border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shadow-sm">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shadow-sm">↵</kbd> Select</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors">
                <Command size={10} /> <span>More Actions</span>
            </div>
        </div>
      </div>
    </div>
  );
};

