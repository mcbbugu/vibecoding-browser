import React from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Settings } from 'lucide-react';

export const SidebarFooter = ({ 
  isDarkMode, 
  onToggleTheme,
  onOpenSettings
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="border-t border-zinc-200 dark:border-white/5 p-3 flex items-center justify-between bg-zinc-50 dark:bg-black/20">
      <button
        onClick={onToggleTheme}
        className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title={isDarkMode ? t('action.switchToLight') : t('action.switchToDark')}
      >
        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        onClick={onOpenSettings}
        className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title={t('settings.title')}
      >
        <Settings size={16} />
      </button>
    </div>
  );
};

