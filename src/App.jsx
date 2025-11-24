import React, { useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BrowserView } from './components/BrowserView';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';
import { ProjectEditModal } from './components/ProjectEditModal';
import { EditorConfigModal } from './components/EditorConfigModal';
import { UrlInputModal } from './components/UrlInputModal';
import { AppProvider, useApp } from './contexts/AppContext';
import { useProjects } from './hooks/useProjects';
import { useShortcuts } from './hooks/useShortcuts';
import { getProjectCategory } from './constants';

function AppContent() {
  const {
    projects,
    isLoading,
    activeProjectId,
    setActiveProjectId,
    openTabs,
    addTab,
    closeTab,
    isSearchOpen,
    setIsSearchOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isUrlInputModalOpen,
    setIsUrlInputModalOpen,
    editingProjectId,
    setEditingProjectId,
    isEditorConfigOpen,
    setIsEditorConfigOpen,
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

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sidebar-toggle'));
    }, 0);
  }, [setIsSidebarCollapsed]);

  const handleSelectProject = useCallback((id) => {
    if (id) {
      addTab(id);
    } else {
      setActiveProjectId(null);
    }
  }, [addTab, setActiveProjectId]);

  const handleAddProject = useCallback(() => {
    setIsUrlInputModalOpen(true);
  }, [setIsUrlInputModalOpen]);

  const handleUrlInputSave = useCallback((projectData) => {
    const newProject = addProject(projectData);
    addTab(newProject.id);
    showToast('项目已创建', 'success');
  }, [addProject, addTab, showToast]);

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

  const handleQuickNavigateWithSelect = useCallback((input) => {
    const newProject = handleQuickNavigate(input);
    addTab(newProject.id);
  }, [handleQuickNavigate, addTab]);

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
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProjectWithCleanup}
        onOpenEdit={handleOpenEditModal}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        showToast={showToast}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isContentHidden={isSidebarContentHidden}
      />
      
      <BrowserView 
        project={activeProject} 
        onUpdateProject={handleUpdateProjectWithSelect}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenEdit={handleOpenEditModal}
        onDeleteProject={handleDeleteProjectWithCleanup}
        showToast={showToast}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onQuickNavigate={handleQuickNavigateWithSelect}
        onScanPorts={handleScanPorts}
        isEditModalOpen={isEditModalOpen}
        openTabs={openTabs}
        activeTabId={activeProjectId}
        onSelectTab={handleSelectProject}
        onCloseTab={closeTab}
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
      />

      <ProjectEditModal
        project={projects.find(p => p.id === editingProjectId)}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateProjectWithSelect}
        projects={projects}
      />

      <EditorConfigModal
        isOpen={isEditorConfigOpen}
        onClose={() => setIsEditorConfigOpen(false)}
        showToast={showToast}
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
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
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

