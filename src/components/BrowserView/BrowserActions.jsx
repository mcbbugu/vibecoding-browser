import React from 'react';
import { useTranslation } from 'react-i18next';
import { Code, Camera, Bug, RefreshCw } from 'lucide-react';
import { Tooltip } from '../Tooltip';

export const BrowserActions = ({
  project,
  isDevToolsOpen,
  onOpenEditor,
  onToggleDevTools,
  onCaptureScreenshot,
  onClearAllCache
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-1 app-no-drag">
      <Tooltip message={t('action.openEditor')}>
        <button 
          onClick={() => project && onOpenEditor(project)}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <Code size={16} />
        </button>
      </Tooltip>
      <Tooltip message={isDevToolsOpen ? t('action.closeDevtools') : t('action.openDevtools')}>
        <button 
          onClick={onToggleDevTools}
          className={`transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5 ${isDevToolsOpen ? 'text-accent-500 dark:text-accent-400' : 'hover:text-zinc-800 dark:hover:text-zinc-200'}`}
        >
          <Bug size={16} />
        </button>
      </Tooltip>
      <Tooltip message={t('action.screenshot')}>
        <button 
          onClick={onCaptureScreenshot}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <Camera size={16} />
        </button>
      </Tooltip>
      <Tooltip message={t('action.clearCache')}>
        <button 
          onClick={onClearAllCache}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <RefreshCw size={16} />
        </button>
      </Tooltip>
    </div>
  );
};

