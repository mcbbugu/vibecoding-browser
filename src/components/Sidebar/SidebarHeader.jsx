import React from 'react';
import { PanelLeftClose } from 'lucide-react';

export const SidebarHeader = ({ onNavigateHome, onToggleSidebar }) => {
  return (
    <div className="p-4 pt-5 flex items-center justify-between">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        title="返回首页"
      >
        <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <div className="w-2.5 h-2.5 bg-white rounded-full" />
        </div>
        <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm tracking-tight">VibeCoding</span>
      </button>
      <button
        onClick={onToggleSidebar}
        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title="折叠侧边栏"
      >
        <PanelLeftClose size={16} />
      </button>
    </div>
  );
};

