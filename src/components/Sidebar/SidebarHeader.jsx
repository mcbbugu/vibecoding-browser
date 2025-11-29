import React from 'react';
import { Home, PanelLeftClose } from 'lucide-react';

export const SidebarHeader = ({ onNavigateHome, onToggleSidebar }) => {
  return (
    <div className="px-4 h-14 flex items-center justify-between border-b border-zinc-200 dark:border-white/5">
      <button
        onClick={onNavigateHome}
        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title="返回首页"
      >
        <Home size={18} />
      </button>
      <button
        onClick={onToggleSidebar}
        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title="折叠侧边栏"
      >
        <PanelLeftClose size={18} />
      </button>
    </div>
  );
};

