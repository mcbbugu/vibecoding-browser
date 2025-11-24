import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FolderOpen, Settings, Trash2, ExternalLink, Edit } from 'lucide-react';

export const ContextMenu = ({ position, project, onClose, onAction, sidebarWidth = 260 }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuWidth = 192;
  let adjustedX = position.x;
  
  if (adjustedX + menuWidth > sidebarWidth) {
    adjustedX = sidebarWidth - menuWidth - 8;
  }
  
  if (adjustedX < 8) {
    adjustedX = 8;
  }

  const style = {
    top: position.y,
    left: adjustedX,
    zIndex: 100001,
    position: 'fixed'
  };

  const menuContent = (
    <div 
        ref={menuRef}
        style={style}
        className="fixed w-48 bg-white/90 dark:bg-[#1c1c1f]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 animate-fade-in origin-top-left flex flex-col"
    >
       <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5 mb-1">
           <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{project.name}</p>
           <p className="text-[10px] text-zinc-400 font-mono truncate">{project.path ? project.path.split('/').pop() : (project.url || '')}</p>
       </div>
       
       {project.url && (
         <button 
           onClick={() => onAction('open', project.id)}
           className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
         >
            <ExternalLink size={12} />
            Open in Browser
         </button>
       )}

        {project.path && (
          <>
            <div className="h-[1px] bg-zinc-100 dark:bg-white/10 my-1 mx-2" />
            <button 
              onClick={() => onAction('finder', project.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
            >
              <FolderOpen size={12} />
              Reveal in Finder
            </button>
          </>
        )}

       <button 
         onClick={() => onAction('edit', project.id)}
         className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md"
       >
          <Edit size={12} />
          Edit Project
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

  return createPortal(menuContent, document.body);
};

