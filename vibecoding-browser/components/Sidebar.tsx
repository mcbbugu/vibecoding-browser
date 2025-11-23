import React, { useState } from 'react';
import { Project, Space, ContextMenuPosition } from '../types';
import { getIconForType } from '../constants';
import { ContextMenu } from './ContextMenu';
import { 
  Plus, 
  Search, 
  Settings, 
  Folder,
  Play,
  Square,
  ChevronDown,
  Moon,
  Sun,
  User,
  MoreHorizontal
} from 'lucide-react';

interface SidebarProps {
  spaces: Space[];
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onToggleProjectStatus: (id: string) => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  spaces,
  activeSpaceId,
  setActiveSpaceId,
  projects,
  activeProjectId,
  onSelectProject,
  onToggleProjectStatus,
  onOpenSearch,
  isDarkMode,
  toggleTheme,
  showToast
}) => {
  
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  const currentSpaceProjects = projects.filter(p => p.space === activeSpaceId);
  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          projectId
      });
  };

  const handleContextMenuAction = (action: string, projectId: string) => {
      setContextMenu(null);
      switch(action) {
          case 'toggle':
              onToggleProjectStatus(projectId);
              break;
          case 'finder':
              showToast('Opened in Finder', 'info');
              break;
          case 'terminal':
              showToast('Terminal Launched', 'success');
              break;
          case 'delete':
              showToast('Project removed from workspace', 'error');
              break;
          default:
              break;
      }
  };

  return (
    <>
    <div className="h-full w-[260px] flex flex-col bg-zinc-50 dark:bg-sidebar border-r border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 select-none transition-colors duration-300 z-20">
      
      {/* Workspace Header */}
      <div className="p-4 pt-5 flex items-center justify-between group cursor-pointer">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm tracking-tight">VibeCoding</span>
          <ChevronDown size={12} className="opacity-50" />
        </div>
        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
           <User size={14} className="text-zinc-500" />
        </div>
      </div>

      {/* Search Trigger */}
      <div className="px-4 mb-2">
        <button 
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-400 shadow-sm"
        >
          <Search size={14} className="text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200" />
          <span className="text-zinc-500">Find anything...</span>
          <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 font-mono">⌘K</span>
        </button>
      </div>

      {/* Spaces Scroller */}
      <div className="px-4 py-3">
        <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-black/20 rounded-lg backdrop-blur-sm overflow-hidden">
        {spaces.map(space => (
          <button
            key={space.id}
            onClick={() => setActiveSpaceId(space.id)}
            className={`
              flex-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-300 text-xs font-medium
              ${activeSpaceId === space.id 
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'}
            `}
            title={space.name}
          >
             {space.name}
          </button>
        ))}
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          {activeSpace?.name} Projects
        </h2>
        <button className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-white/5 p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10">
            <Plus size={12} />
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4 scroll-smooth">
        {currentSpaceProjects.map((project) => (
          <div 
            key={project.id}
            onContextMenu={(e) => handleContextMenu(e, project.id)}
            className={`
              group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative border border-transparent
              ${activeProjectId === project.id 
                ? 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-white shadow-sm border-zinc-200 dark:border-white/5' 
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200'}
            `}
            onClick={() => onSelectProject(project.id)}
          >
            {/* Status Indicator / Action */}
            <div 
                className="relative flex items-center justify-center w-5 h-5 shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleProjectStatus(project.id);
                }}
            >
                <div className={`
                    absolute inset-0 rounded-md transition-opacity duration-300
                    ${project.status === 'running' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-transparent'}
                `} />
                
                {/* Status Dot */}
                <div className={`
                    w-2 h-2 rounded-full transition-all duration-300 shadow-sm
                    ${project.status === 'running' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-300 dark:bg-zinc-600'}
                    ${project.status === 'error' ? 'bg-rose-500 shadow-rose-500/50' : ''}
                    group-hover:opacity-0
                `} />

                {/* Hover Play/Stop Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                    {project.status === 'running' ? (
                        <Square size={10} className="fill-current text-rose-500" />
                    ) : (
                        <Play size={10} className="fill-current text-emerald-500 ml-0.5" />
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-sm font-medium truncate leading-tight">{project.name}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-mono opacity-80">:{project.port}</span>
            </div>

            <div className={`opacity-40 group-hover:opacity-100 transition-opacity ${activeProjectId === project.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400'}`}>
                {getIconForType(project.type)}
            </div>
            
            {/* Options Trigger (Visual only for now as Context Menu is cleaner) */}
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 lg:hidden">
                 <MoreHorizontal size={14} className="text-zinc-500" />
            </div>
          </div>
        ))}
        
        <div className="px-3 py-6">
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800/50" />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-1">
             <button 
                onClick={toggleTheme}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title="Toggle Theme"
            >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <Settings size={16} />
            </button>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Folder size={14} />
            <span className="text-xs font-medium">Library</span>
        </button>
      </div>
    </div>
    {contextMenu && (
        <ContextMenu 
            position={contextMenu} 
            project={projects.find(p => p.id === contextMenu.projectId)!}
            onClose={() => setContextMenu(null)}
            onAction={handleContextMenuAction}
        />
    )}
    </>
  );
};