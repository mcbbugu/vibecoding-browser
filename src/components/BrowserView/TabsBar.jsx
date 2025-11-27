import React, { useCallback, useState } from 'react';
import { X, Globe } from 'lucide-react';

const getFaviconUrl = (url) => {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
};

export const TabsBar = ({ tabs, activeTabId, projects, onSelectTab, onCloseTab }) => {
  const [failedFavicons, setFailedFavicons] = useState({});

  const handleFaviconError = useCallback((key) => {
    setFailedFavicons(prev => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#1a1a1d] border-b border-zinc-200 dark:border-white/5 overflow-x-auto scrollbar-hide py-2 px-3">
      {tabs.map(tabId => {
        const tabProject = projects.find(p => p.id === tabId);
        if (!tabProject) return null;
        
        const isActive = activeTabId === tabId;
        const faviconUrl = getFaviconUrl(tabProject.url);
        const faviconKey = tabProject.url || tabId;
        const shouldShowFallback = !faviconUrl || failedFavicons[faviconKey];
        
        return (
          <div
            key={tabId}
            className={`
              group relative flex items-center gap-2.5 px-4 py-2 cursor-pointer min-w-[160px] max-w-[220px] rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-md ring-1 ring-zinc-200 dark:ring-white/10' 
                : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/50'}
            `}
            onClick={() => onSelectTab(tabId)}
          >
            {!shouldShowFallback ? (
              <img 
                src={faviconUrl} 
                alt=""
                className="w-4 h-4 rounded-sm shrink-0"
                onError={() => handleFaviconError(faviconKey)}
              />
            ) : (
              <Globe size={16} className="shrink-0 text-zinc-400 dark:text-zinc-500" />
            )}
            <span className="text-sm font-medium truncate flex-1">{tabProject.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tabId);
              }}
              className={`
                shrink-0 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all
                ${isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100'}
              `}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

