import React from 'react';
import { Moon, Sun } from 'lucide-react';

export const SidebarFooter = ({ 
  isDarkMode, 
  onToggleTheme
}) => {
  return (
    <div className="border-t border-zinc-200 dark:border-white/5 p-3 flex items-center justify-end bg-zinc-50 dark:bg-black/20">
      <button
        onClick={onToggleTheme}
        className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
      >
        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
};

