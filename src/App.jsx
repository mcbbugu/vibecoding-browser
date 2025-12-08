import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, PanelLeft } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { BrowserView } from './components/BrowserView';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';
import { ProjectEditModal } from './components/ProjectEditModal';
import { EditorConfigModal } from './components/EditorConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { UrlInputModal } from './components/UrlInputModal';
import { TabSwitcher } from './components/TabSwitcher';
import { useApp } from './contexts/AppContext';
import { useProjects } from './hooks/useProjects';
import { useShortcuts } from './hooks/useShortcuts';
import { useEditor } from './hooks/useEditor';
import analytics, { trackAppLaunched, trackDailyActive } from './utils/analytics';
import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';

function App() {
  const {
    projects,
    isLoading,
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
    isEditorConfigOpen,
    setIsEditorConfigOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isTabSwitcherOpen,
    toast,
    setToast,
    isDarkMode,
    toggleTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isSidebarContentHidden,
    showToast,
    isFullScreen
  } = useApp();

  const { t } = useTranslation();

  // 初始化 Analytics（默认开启，不弹窗）
  useEffect(() => {
    // 标记早期用户（未来付费版会用到）
    if (!localStorage.getItem('early_user')) {
      localStorage.setItem('early_user', 'true');
      localStorage.setItem('early_user_since', Date.now().toString());
    }
    
    // 首次启动默认开启统计
    if (!analytics.hasConsent()) {
      localStorage.setItem('analytics_consent', 'true');
    }
    
    // 初始化并发送事件
    const initAnalytics = async () => {
      await analytics.init();
      const version = window.electron?.getAppVersion?.() || '1.0.0';
      trackAppLaunched(version);
      trackDailyActive();
    };
    initAnalytics();
    
    // 监听窗口激活（从后台切回来）
    const handleFocus = () => {
      trackDailyActive();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const {
    handleAddProject: addProject,
    handleUpdateProject,
    handleDeleteProject,
    handleToggleProjectStatus,
    handleScanPorts,
    handleQuickNavigate,
    handlePinProject,
    handleReorderProjects
  } = useProjects();

  // 启动时自动扫描端口，更新 pinned 项目的 status
  useEffect(() => {
    if (!isLoading) {
      handleScanPorts('common');
    }
  }, [isLoading]);

  const { openEditor } = useEditor(showToast, setIsEditorConfigOpen);

  useShortcuts();

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sidebar-toggle'));
    }, 0);
  }, [setIsSidebarCollapsed]);

  const handleSelectProject = useCallback((id) => {
    setActiveProjectId(id);
  }, [setActiveProjectId]);

  const handleAddProject = useCallback(() => {
    setIsUrlInputModalOpen(true);
  }, [setIsUrlInputModalOpen]);

  const handleUrlInputSave = useCallback((projectData) => {
    const newProject = addProject(projectData);
    setActiveProjectId(newProject.id);
    showToast(t('toast.projectCreated'), 'success');
  }, [addProject, setActiveProjectId, showToast, t]);

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
    const result = handleQuickNavigate(input);
    if (result && result.id) {
      setActiveProjectId(result.id);
    }
  }, [handleQuickNavigate, setActiveProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (isLoading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={isDarkMode ? logoDark : logoLight} 
            alt="DevDock" 
            className="h-12 w-auto"
          />
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-hidden">
      {isSidebarCollapsed && !activeProjectId && (
        <div className="fixed left-4 top-8 flex items-center gap-2 z-50">
          <button
            onClick={() => setActiveProjectId(null)}
            className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            title={t('action.goHome')}
          >
            <Home size={18} className="text-zinc-600 dark:text-zinc-300" />
          </button>
          <button
            onClick={handleToggleSidebar}
            className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            title={t('action.expandSidebar')}
          >
            <PanelLeft size={18} className="text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>
      )}
      
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
        onNavigateHome={() => setActiveProjectId(null)}
        onOpenEditor={openEditor}
        onScanPorts={handleScanPorts}
        onPinProject={handlePinProject}
        onReorderProjects={handleReorderProjects}
      />
      
      <BrowserView 
        project={activeProject} 
        onUpdateProject={handleUpdateProjectWithSelect}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenEdit={handleOpenEditModal}
        onOpenEditor={openEditor}
        onDeleteProject={handleDeleteProjectWithCleanup}
        onPinProject={handlePinProject}
        onReorderProjects={handleReorderProjects}
        showToast={showToast}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onQuickNavigate={handleQuickNavigateWithSelect}
        onScanPorts={handleScanPorts}
        isEditModalOpen={isEditModalOpen}
        isSearchOpen={isSearchOpen}
        isSettingsOpen={isSettingsOpen}
        isTabSwitcherOpen={isTabSwitcherOpen}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
        onQuickNavigate={handleQuickNavigateWithSelect}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showToast={showToast}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <TabSwitcher />
      
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

export default App;

