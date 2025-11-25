import React from 'react';
import { X } from 'lucide-react';

const getFaviconUrl = (url) => {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
};

export const TabsBar = ({ tabs, activeTabId, projects, onSelectTab, onCloseTab }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-zinc-100 dark:bg-[#1a1a1d] border-b border-zinc-200 dark:border-white/5 overflow-x-auto scrollbar-hide pt-2 px-2">
      {tabs.map(tabId => {
        const tabProject = projects.find(p => p.id === tabId);
        if (!tabProject) return null;
        
        const isActive = activeTabId === tabId;
        const faviconUrl = getFaviconUrl(tabProject.url);
        
        return (
          <div
            key={tabId}
            className={`
              group relative flex items-center gap-2 px-3 py-2.5 cursor-pointer min-w-[140px] max-w-[240px] transition-all
              ${isActive 
                ? 'bg-white dark:bg-[#111111] text-zinc-900 dark:text-white shadow-sm' 
                : 'bg-zinc-50 dark:bg-[#252529] text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-[#2a2a2e]'}
            `}
            style={{
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              marginRight: '-8px',
              zIndex: isActive ? 10 : 1
            }}
            onClick={() => onSelectTab(tabId)}
          >
            {faviconUrl ? (
              <img 
                src={faviconUrl} 
                alt=""
                className="w-4 h-4 shrink-0"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="w-4 h-4 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />
            )}
            <span className="text-xs font-medium truncate flex-1">{tabProject.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tabId);
              }}
              className={`
                shrink-0 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all
                ${isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 group-hover:hover:opacity-100'}
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

