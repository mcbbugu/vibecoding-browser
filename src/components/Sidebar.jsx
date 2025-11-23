import React, { useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { SpaceManageModal } from './SpaceManageModal';
import { SidebarHeader } from './Sidebar/SidebarHeader';
import { SpaceTabs } from './Sidebar/SpaceTabs';
import { ProjectList } from './Sidebar/ProjectList';
import { SidebarFooter } from './Sidebar/SidebarFooter';
import { Search, RefreshCw } from 'lucide-react';
import { electronAPI } from '../utils/electron';

export const Sidebar = ({
  spaces,
  activeSpaceId,
  setActiveSpaceId,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
  projects,
  activeProjectId,
  onSelectProject,
  onToggleProjectStatus,
  onAddProject,
  onDeleteProject,
  onOpenEdit,
  onOpenSearch,
  isDarkMode,
  toggleTheme,
  showToast,
  isCollapsed,
  onToggleCollapse,
  isContentHidden
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isSpaceManageModalOpen, setIsSpaceManageModalOpen] = useState(false);

  const currentSpaceProjects = projects.filter(p => p.space === activeSpaceId);

  const handleContextMenu = (e, projectId) => {
    e.preventDefault();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project
    });
  };

  return (
    <>
      <div className={`h-screen flex flex-col bg-zinc-50 dark:bg-sidebar border-r border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 select-none transition-all duration-300 z-20 overflow-hidden ${isCollapsed ? 'w-0 border-0' : 'w-[260px]'}`}>
        
        {!isCollapsed && <SidebarHeader />}

        {isCollapsed ? null : isContentHidden ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 px-6 text-center">
            Sidebar Hidden
            <span className="mt-2 text-[10px] tracking-wide text-zinc-500 dark:text-zinc-500">Press ⌘S twice to show</span>
          </div>
        ) : (
          <>
            <div className="px-4 mb-2">
              <button 
                onClick={onOpenSearch}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-black/20 hover:bg-zinc-200 dark:hover:bg-black/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all text-sm group"
              >
                <Search size={14} />
                <span className="font-medium">搜索项目...</span>
              </button>
            </div>

            <SpaceTabs 
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              onSelectSpace={setActiveSpaceId}
              onCreateSpace={onCreateSpace}
            />

            <ProjectList 
              projects={currentSpaceProjects}
              activeProjectId={activeProjectId}
              onSelectProject={onSelectProject}
              onToggleStatus={onToggleProjectStatus}
              onContextMenu={handleContextMenu}
              isCollapsed={isCollapsed}
            />

            <SidebarFooter 
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              onOpenSpaceManage={() => setIsSpaceManageModalOpen(true)}
            />
          </>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          project={contextMenu.project}
          onClose={() => setContextMenu(null)}
          onAction={(action, projectId) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            
            switch(action) {
              case 'toggle':
                onToggleProjectStatus(projectId);
                break;
              case 'edit':
                onOpenEdit(projectId);
                break;
              case 'delete':
                if (window.confirm(`确定删除「${project.name}」吗？`)) {
                  onDeleteProject(projectId);
                  showToast(`已删除「${project.name}」`, 'info');
                }
                break;
              case 'open':
                if (project.url) {
                  window.open(project.url, '_blank');
                }
                break;
              case 'finder':
                if (project.path) {
                  electronAPI.revealInFinder(project.path);
                }
                break;
            }
            setContextMenu(null);
          }}
        />
      )}

      <SpaceManageModal
        isOpen={isSpaceManageModalOpen}
        onClose={() => setIsSpaceManageModalOpen(false)}
        spaces={spaces}
        onCreateSpace={onCreateSpace}
        onUpdateSpace={onUpdateSpace}
        onDeleteSpace={onDeleteSpace}
        activeSpaceId={activeSpaceId}
        setActiveSpaceId={setActiveSpaceId}
        showToast={showToast}
      />
    </>
  );
};
