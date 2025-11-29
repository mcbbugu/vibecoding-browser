import React, { useState } from 'react';
import { RefreshCw, Pin, Home, Compass } from 'lucide-react';

export const ProjectList = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onContextMenu,
  isCollapsed,
  onRefresh,
  onNavigateHome
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const pinnedProjects = React.useMemo(() => {
    return projects.filter(p => p.pinned).sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running'));
  }, [projects]);

  const discoveredProjects = React.useMemo(() => {
    return projects.filter(p => !p.pinned && p.status === 'running');
  }, [projects]);

  const renderProjectItem = (project) => {
    const isActive = activeProjectId === project.id;
    return (
      <div 
        key={project.id}
        onContextMenu={(e) => onContextMenu(e, project.id)}
        className={`
          group flex items-center rounded-xl cursor-pointer transition-all duration-200 relative border
          ${isActive 
            ? 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-white shadow-sm border-zinc-200 dark:border-white/5' 
            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200'}
          ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}
        `}
        onClick={() => onSelectProject(project.id)}
        title={isCollapsed ? project.name : ''}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isCollapsed && (
            <>
              <div className={`
                w-2 h-2 rounded-full transition-all duration-300 shadow-sm shrink-0
                ${project.status === 'running' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-300 dark:bg-zinc-600'}
                ${project.status === 'error' ? 'bg-rose-500 shadow-rose-500/50' : ''}
              `} />
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
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 scrollbar-hide">
      {/* 固定项目 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Pin size={10} className="text-zinc-400 dark:text-zinc-600" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">固定</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{pinnedProjects.length}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {pinnedProjects.length === 0 ? (
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center py-3">
              暂无固定项目
            </div>
          ) : (
            pinnedProjects.map(renderProjectItem)
          )}
        </div>
      </div>

      {/* 发现的服务 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Compass size={10} className="text-zinc-400 dark:text-zinc-600" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">发现</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{discoveredProjects.length}</span>
          </div>
          {onRefresh && (
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
          {discoveredProjects.length === 0 ? (
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center py-3">
              未发现运行中的服务
            </div>
          ) : (
            discoveredProjects.map(renderProjectItem)
          )}
        </div>
      </div>
    </div>
  );
};
