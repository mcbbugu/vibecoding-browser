import React from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Home, PanelLeft } from 'lucide-react';

export const BrowserToolbar = ({ 
  onGoBack,
  onGoForward,
  onRefresh,
  isLoading,
  canGoBack,
  canGoForward,
  isSidebarCollapsed,
  onNavigateHome,
  onToggleSidebar
}) => {
  return (
    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
      {isSidebarCollapsed && (
        <>
          <button
            onClick={onNavigateHome}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
            title="返回首页"
          >
            <Home size={18} />
          </button>
          <button
            onClick={onToggleSidebar}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
            title="展开侧边栏"
          >
            <PanelLeft size={18} />
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        </>
      )}
      <button 
        onClick={onGoBack}
        disabled={!canGoBack}
        className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
        title="后退"
      >
        <ArrowLeft size={18} />
      </button>
      <button 
        onClick={onGoForward}
        disabled={!canGoForward}
        className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
        title="前进"
      >
        <ArrowRight size={18} />
      </button>
      <button 
        onClick={onRefresh}
        className={`hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 ${isLoading ? 'animate-spin' : ''}`}
        title="刷新"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

