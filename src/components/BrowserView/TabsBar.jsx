import React from 'react';
import { X } from 'lucide-react';

export const TabsBar = ({ tabs, activeTabId, projects, onSelectTab, onCloseTab }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 bg-zinc-50 dark:bg-[#1c1c1f] border-b border-zinc-200 dark:border-white/5 overflow-x-auto scrollbar-hide">
      {tabs.map(tabId => {
        const tabProject = projects.find(p => p.id === tabId);
        if (!tabProject) return null;
        
        const isActive = activeTabId === tabId;
        
        return (
          <div
            key={tabId}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-t-lg transition-all cursor-pointer min-w-[120px] max-w-[200px]
              ${isActive 
                ? 'bg-white dark:bg-[#111111] border-t border-x border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}
            `}
            onClick={() => onSelectTab(tabId)}
          >
            <span className="text-xs font-medium truncate flex-1">{tabProject.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tabId);
              }}
              className={`
                shrink-0 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity
                ${isActive ? 'opacity-100' : ''}
              `}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

