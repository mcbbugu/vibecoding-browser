import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, PanelLeftClose } from 'lucide-react';

export const SidebarHeader = ({ onNavigateHome, onToggleSidebar }) => {
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  useEffect(() => {
    window.electronAPI?.isWindowFullScreen?.().then(setIsFullScreen);
    const cleanup = window.electronAPI?.onWindowFullScreen?.(setIsFullScreen);
    return cleanup;
  }, []);
  
  const handleDoubleClick = (e) => {
    if (e.target === e.currentTarget) {
      window.electronAPI?.toggleMaximize?.();
    }
  };
  
  return (
    <div 
      className={`px-4 h-14 flex items-center gap-1 border-b border-zinc-200 dark:border-white/5 app-drag-region transition-all ${
        isFullScreen ? 'justify-between' : 'justify-end'
      }`}
      style={{ paddingLeft: isFullScreen ? '16px' : '76px' }}
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

