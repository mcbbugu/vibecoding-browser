import React, { useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BrowserView } from './components/BrowserView';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';
import { ProjectEditModal } from './components/ProjectEditModal';
import { UrlInputModal } from './components/UrlInputModal';
import { AppProvider, useApp } from './contexts/AppContext';
import { useProjects } from './hooks/useProjects';
import { useShortcuts } from './hooks/useShortcuts';
import { getProjectCategory } from './constants';

function AppContent() {
  const {
    spaces,
    setSpaces,
    projects,
    isLoading,
    activeSpaceId,
    setActiveSpaceId,
    activeProjectId,
    setActiveProjectId,
    isSearchOpen,
    setIsSearchOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isUrlInputModalOpen,
    setIsUrlInputModalOpen,
    editingProjectId,
    setEditingProjectId,
    toast,
    setToast,
    isDarkMode,
    toggleTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isSidebarContentHidden,
    showToast
  } = useApp();

  const {
    handleAddProject: addProject,
    handleUpdateProject,
    handleDeleteProject,
    handleToggleProjectStatus,
    handleScanPorts,
    handleQuickNavigate
  } = useProjects();

  useShortcuts();

  const handleSelectProject = useCallback((id) => {
    setActiveProjectId(id);
    if (!id) return;
    
    const project = projects.find(p => p.id === id);
    if (project && project.space !== activeSpaceId) {
      setActiveSpaceId(project.space);
    }
  }, [projects, activeSpaceId, setActiveProjectId, setActiveSpaceId]);

  const handleAddProject = useCallback(() => {
    setIsUrlInputModalOpen(true);
  }, [setIsUrlInputModalOpen]);

  const handleUrlInputSave = useCallback((projectData) => {
    const newProject = addProject(projectData);
    setActiveProjectId(newProject.id);
    showToast('项目已创建', 'success');
  }, [addProject, setActiveProjectId, showToast]);

  const handleDeleteProjectWithCleanup = useCallback((id) => {
    handleDeleteProject(id);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [handleDeleteProject, activeProjectId, setActiveProjectId]);

  const handleUpdateProjectWithSelect = useCallback((id, updates) => {
    handleUpdateProject(id, updates);
    if (updates.url) {
      setActiveProjectId(id);
    }
  }, [handleUpdateProject, setActiveProjectId]);

  const handleOpenEditModal = useCallback((id) => {
    setEditingProjectId(id);
    setIsEditModalOpen(true);
  }, [setEditingProjectId, setIsEditModalOpen]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingProjectId(null);
  }, [setIsEditModalOpen, setEditingProjectId]);

  const handleCreateSpace = useCallback((name) => {
    const newSpace = {
      id: `space-${Date.now()}`,
      name: name.trim() || 'New Space',
      color: 'bg-indigo-500',
      icon: 'folder'
    };
    setSpaces(prev => {
      const updated = [...prev, newSpace];
      if (updated.length === 1) {
        setActiveSpaceId(newSpace.id);
      }
      return updated;
    });
    showToast(`空间 "${newSpace.name}" 已创建`, 'success');
  }, [setSpaces, setActiveSpaceId, showToast]);

  const handleUpdateSpace = useCallback((id, updates) => {
    setSpaces(prev => prev.map(space => 
      space.id === id ? { ...space, ...updates } : space
    ));
  }, [setSpaces]);

  const handleDeleteSpace = useCallback((id) => {
    setSpaces(prev => {
      const filtered = prev.filter(space => space.id !== id);
      if (activeSpaceId === id && filtered.length > 0) {
        setActiveSpaceId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveSpaceId(null);
      }
      return filtered;
    });
  }, [setSpaces, activeSpaceId, setActiveSpaceId]);

  const handleQuickNavigateWithSelect = useCallback((input) => {
    const newProject = handleQuickNavigate(input);
    setActiveProjectId(newProject.id);
  }, [handleQuickNavigate, setActiveProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (isLoading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-zinc-50 dark:bg-[#111111]">
        <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen bg-zinc-50 dark:bg-[#111111] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-hidden">
      <Sidebar 
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        setActiveSpaceId={setActiveSpaceId}
        onCreateSpace={handleCreateSpace}
        onUpdateSpace={handleUpdateSpace}
        onDeleteSpace={handleDeleteSpace}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onToggleProjectStatus={handleToggleProjectStatus}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProjectWithCleanup}
        onOpenEdit={handleOpenEditModal}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        showToast={showToast}
        isCollapsed={isSidebarCollapsed}
      onToggleCollapse={() => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sidebar-toggle'));
        }, 0);
      }}
      isContentHidden={isSidebarContentHidden}
      />
      
      <BrowserView 
        project={activeProject} 
        onStatusChange={handleToggleProjectStatus}
        onUpdateProject={handleUpdateProjectWithSelect}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenEdit={handleOpenEditModal}
        onDeleteProject={handleDeleteProjectWithCleanup}
        showToast={showToast}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sidebar-toggle'));
          }, 0);
        }}
        onQuickNavigate={handleQuickNavigateWithSelect}
        onScanPorts={handleScanPorts}
        isEditModalOpen={isEditModalOpen}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <UrlInputModal
        isOpen={isUrlInputModalOpen}
        onClose={() => setIsUrlInputModalOpen(false)}
        onSave={handleUrlInputSave}
        activeSpaceId={activeSpaceId}
      />

      <ProjectEditModal
        project={projects.find(p => p.id === editingProjectId)}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateProjectWithSelect}
        spaces={spaces}
        projects={projects}
      />
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; left: 0; }
          50% { width: 70%; left: 10%; }
          100% { width: 100%; left: 100%; opacity: 0; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

