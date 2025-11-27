import React, { useState } from 'react';
import { getProjectCategory } from '../../constants';
import { RefreshCw } from 'lucide-react';

const CATEGORY_STYLES = {
  local: {
    label: 'text-emerald-500',
    dot: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-500/30',
    placeholderBorder: 'border-emerald-500/20',
    emptyText: '暂无本地服务'
  },
  online: {
    label: 'text-sky-500',
    dot: 'bg-sky-500',
    hoverBorder: 'hover:border-sky-500/30',
    placeholderBorder: 'border-sky-500/20',
    emptyText: '暂无在线域名'
  }
};

export const ProjectList = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onContextMenu,
  isCollapsed,
  onRefresh
}) => {
  const CATEGORY_ORDER = ['local', 'online'];
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide">
      {CATEGORY_ORDER.map(category => {
        const categoryProjects = projects.filter(p => getProjectCategory(p) === category);
        const categoryStyle = CATEGORY_STYLES[category];

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                <span className={`text-xs font-semibold ${categoryStyle.label}`}>
                  {category === 'local' ? '本地开发' : '在线域名'}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                  {categoryProjects.length}
                </span>
              </div>
              {category === 'local' && onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
                  title="扫描端口"
                >
                  <RefreshCw size={12} className={`text-zinc-400 dark:text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {categoryProjects.length === 0 ? (
                <div className={`text-xs text-zinc-400 dark:text-zinc-600 text-center py-6 border-2 border-dashed ${categoryStyle.placeholderBorder} rounded-xl`}>
                  {categoryStyle.emptyText}
                </div>
              ) : (
                categoryProjects.map(project => {
                  const isActive = activeProjectId === project.id;
                  return (
                    <div 
                      key={project.id}
                      onContextMenu={(e) => onContextMenu(e, project.id)}
                      className={`
                        group flex items-center rounded-xl cursor-pointer transition-all duration-200 relative border
                        ${isActive 
                          ? 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-white shadow-sm border-zinc-200 dark:border-white/5' 
                          : `border-transparent ${categoryStyle.hoverBorder} hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200`}
                        ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}
                      `}
                      onClick={() => onSelectProject(project.id)}
                      title={isCollapsed ? project.name : ''}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!isCollapsed && (
                          <>
                            <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                              <div className={`
                                w-2 h-2 rounded-full transition-all duration-300 shadow-sm
                                ${project.status === 'running' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-300 dark:bg-zinc-600'}
                                ${project.status === 'error' ? 'bg-rose-500 shadow-rose-500/50' : ''}
                              `} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-sm font-medium truncate">{project.name}</span>
                              {project.url && (() => {
                                try {
                                  const url = new URL(project.url);
                                  const host = url.hostname;
                                  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
                                  return (
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                                      {host}:{port}
                                    </span>
                                  );
                                } catch {
                                  const displayUrl = project.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                  return (
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                                      {displayUrl}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

