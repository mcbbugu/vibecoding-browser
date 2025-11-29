import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { FolderOpen, Trash2, Code, Edit, Pin, PinOff } from 'lucide-react';
import { Z_INDEX } from '../utils/constants';

const MENU_BUTTON_CLASS = "flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors mx-1 rounded-md";
const MENU_BUTTON_DANGER_CLASS = "flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500 hover:text-white transition-colors mx-1 rounded-md";

export const ContextMenu = ({ position, project, onClose, onAction, sidebarWidth }) => {
  const menuRef = useRef(null);

  const menuWidth = 192;
  const menuHeight = 200;
  let adjustedX = position.x;
  let adjustedY = position.y;
  
  if (sidebarWidth) {
    if (adjustedX + menuWidth > sidebarWidth) {
      adjustedX = sidebarWidth - menuWidth - 8;
    }
    if (adjustedX < 8) {
      adjustedX = 8;
    }
  } else {
    if (adjustedX + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 8;
    }
  }
  
  if (adjustedY + menuHeight > window.innerHeight) {
    adjustedY = window.innerHeight - menuHeight - 8;
  }

  const style = {
    top: adjustedY,
    left: adjustedX,
    zIndex: Z_INDEX.CONTEXT_MENU,
    position: 'fixed'
  };

  const menuContent = (
    <div 
        ref={menuRef}
        style={style}
        data-context-menu="true"
        className="fixed w-48 bg-white/90 dark:bg-[#1c1c1f]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 animate-fade-in origin-top-left flex flex-col"
    >
       <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5 mb-1">
           <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{project.name}</p>
           <p className="text-[10px] text-zinc-400 font-mono truncate">{project.path ? project.path.split('/').pop() : (project.url || '')}</p>
       </div>
       
       {project.path && (
         <>
           <button onClick={() => onAction('open-ide', project.id)} className={MENU_BUTTON_CLASS}>
             <Code size={12} />
             在 IDE 中打开
           </button>
           <button onClick={() => onAction('finder', project.id)} className={MENU_BUTTON_CLASS}>
             <FolderOpen size={12} />
             在 Finder 中显示
           </button>
         </>
       )}

       <div className="h-[1px] bg-zinc-100 dark:bg-white/10 my-1 mx-2" />

       <button onClick={() => onAction('pin', project.id)} className={MENU_BUTTON_CLASS}>
          {project.pinned ? <PinOff size={12} /> : <Pin size={12} />}
          {project.pinned ? '取消固定' : '固定项目'}
       </button>

       {project.pinned && (
         <button onClick={() => onAction('edit', project.id)} className={MENU_BUTTON_CLASS}>
            <Edit size={12} />
            编辑项目
         </button>
       )}
       
       <div className="h-[1px] bg-zinc-100 dark:bg-white/10 my-1 mx-2" />
       
       <button onClick={() => onAction('delete', project.id)} className={MENU_BUTTON_DANGER_CLASS}>
          <Trash2 size={12} />
          删除项目
       </button>
    </div>
  );

  return createPortal(menuContent, document.body);
};

