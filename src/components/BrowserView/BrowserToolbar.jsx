import React from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, PanelLeftClose, PanelLeft, LayoutPanelLeft } from 'lucide-react';

export const BrowserToolbar = ({ 
  isSidebarCollapsed, 
  onToggleSidebar, 
  onSelectProject,
  onGoBack,
  onGoForward,
  onRefresh,
  isLoading 
}) => {
  return (
    <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
      <button 
        onClick={onToggleSidebar}
        className="hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-all"
        title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
      >
        {isSidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
      </button>
      <button 
        onClick={() => onSelectProject('')}
        className="hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-all" 
        title="Back to Dashboard"
      >
        <LayoutPanelLeft size={18} />
      </button>

      <div className="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />

      <div className="flex items-center gap-2">
        <button 
          onClick={onGoBack}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={onGoForward}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
          title="Go Forward"
        >
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={onRefresh}
          className={`hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 ${isLoading ? 'animate-spin' : ''}`}
          title="Refresh Page"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
};

