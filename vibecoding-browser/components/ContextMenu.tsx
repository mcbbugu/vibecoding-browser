import React, { useEffect, useRef } from 'react';
import { ContextMenuPosition, Project } from '../types';
import { Play, Square, FolderOpen, Settings, Trash2, ExternalLink, Terminal } from 'lucide-react';

interface ContextMenuProps {
  position: ContextMenuPosition;
  project: Project;
  onClose: () => void;
  onAction: (action: string, projectId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, project, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to keep in viewport
  const style = {
    top: position.y,
    left: position.x,
  };

  const isRunning = project.status === 'running';

  return (
    <div 
        ref={menuRef}
        style={style}
        className="fixed z-50 w-48 bg-white/90 dark:bg-[#1c1c1f]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 animate-fade-in origin-top-left flex flex-col"
    >
       <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5 mb-1">
           <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{project.name}</p>
           <p className="text-[10px] text-zinc-400 font-mono truncate">{project.path.split('/').pop()}</p>
       </div>
       
       <button 
         onClick={() => onAction('toggle', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          {isRunning ? <Square size={12} /> : <Play size={12} />}
          {isRunning ? 'Stop Server' : 'Start Server'}
       </button>

       <button 
         onClick={() => onAction('open', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <ExternalLink size={12} />
          Open in Browser
       </button>

        <div className="h-[1px] bg-zinc-100 dark:bg-white/10 my-1 mx-2" />

       <button 
         onClick={() => onAction('finder', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <FolderOpen size={12} />
          Reveal in Finder
       </button>
       
       <button 
         onClick={() => onAction('terminal', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <Terminal size={12} />
          Open Terminal
       </button>

       <div className="h-[1px] bg-zinc-100 dark:bg-white/10 my-1 mx-2" />

       <button 
         onClick={() => onAction('settings', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <Settings size={12} />
          Config
       </button>
       
       <button 
         onClick={() => onAction('delete', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <Trash2 size={12} />
          Remove Project
       </button>
    </div>
  );
};