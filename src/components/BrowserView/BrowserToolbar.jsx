import React from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

export const BrowserToolbar = ({ 
  onGoBack,
  onGoForward,
  onRefresh,
  isLoading,
  canGoBack,
  canGoForward
}) => {
  return (
    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
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

