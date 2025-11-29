import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, PanelLeftClose } from 'lucide-react';

export const SidebarHeader = ({ onNavigateHome, onToggleSidebar }) => {
  const { t } = useTranslation();
  
  const handleDoubleClick = (e) => {
    if (e.target === e.currentTarget) {
      window.electronAPI?.toggleMaximize?.();
    }
  };
  
  return (
    <div 
      className="px-4 h-14 flex items-center justify-end gap-1 border-b border-zinc-200 dark:border-white/5 app-drag-region"
      onDoubleClick={handleDoubleClick}
    >
      <button
        onClick={onNavigateHome}
        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors app-no-drag"
        title={t('action.goHome')}
      >
        <Home size={18} />
      </button>
      <button
        onClick={onToggleSidebar}
        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors app-no-drag"
        title={t('action.collapseSidebar')}
      >
        <PanelLeftClose size={18} />
      </button>
    </div>
  );
};

