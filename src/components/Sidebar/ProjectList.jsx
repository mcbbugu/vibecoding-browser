import React from 'react';
import { getIconForType, getProjectCategory } from '../../constants';
import { Play, Square, RefreshCw, Link2 } from 'lucide-react';

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
  onToggleStatus,
  onContextMenu,
  isCollapsed 
}) => {
  const CATEGORY_ORDER = ['local', 'online'];

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
            </div>

            <div className="space-y-1.5">
              {categoryProjects.length === 0 ? (
                <div className={`text-xs text-zinc-400 dark:text-zinc-600 text-center py-6 border-2 border-dashed ${categoryStyle.placeholderBorder} rounded-xl`}>
                  {categoryStyle.emptyText}
                </div>
              ) : (
                categoryProjects.map(project => {
                  const Icon = getIconForType(project.type);
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
                      {!isCollapsed && (
                        <div 
                          className="relative flex items-center justify-center w-5 h-5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(project.id);
                          }}
                        >
                          <div className={`
                            w-3 h-3 rounded-full transition-all duration-300
                            ${project.status === 'running' 
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                              : project.status === 'error'
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              : 'bg-zinc-300 dark:bg-zinc-700'}
                          `} />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {project.status === 'running' 
                              ? <Square size={10} className="text-white fill-white" />
                              : <Play size={10} className="text-white fill-white" />
                            }
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon size={16} className={`shrink-0 ${isActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium truncate flex-1">{project.name}</span>
                            {project.boundProjectId && (
                              <Link2 size={12} className="shrink-0 text-zinc-400" />
                            )}
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

