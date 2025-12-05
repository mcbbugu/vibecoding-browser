import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dashboard } from './Dashboard';
import { BrowserToolbar } from './BrowserView/BrowserToolbar';
import { AddressBar } from './BrowserView/AddressBar';
import { DeviceSelector } from './BrowserView/DeviceSelector';
import { BrowserContent } from './BrowserView/BrowserContent';
import { BrowserActions } from './BrowserView/BrowserActions';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
import { handleElectronResult } from '../utils/electronHelper';
import { Z_INDEX } from '../utils/constants';
import { useApp } from '../contexts/AppContext';
import { calculateBrowserViewBounds } from '../utils/browserView';
import { useBrowserViewBounds } from '../hooks/useBrowserViewBounds';
import { useDevTools } from '../hooks/useDevTools';
import { useEditor } from '../hooks/useEditor';
import { useScreenshot } from '../hooks/useScreenshot';

export const BrowserView = ({ 
  project, 
  onUpdateProject, 
  projects, 
  onSelectProject, 
  showToast, 
  onOpenEdit, 
  onDeleteProject, 
  onPinProject,
  onReorderProjects,
  isSidebarCollapsed, 
  onToggleSidebar, 
  onQuickNavigate, 
  onScanPorts,
  isEditModalOpen,
  isSearchOpen,
  isSettingsOpen,
  isTabSwitcherOpen
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState({ 
    name: 'Desktop', 
    width: '100%', 
    height: '100%', 
    category: 'desktop' 
  });
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const { isFullScreen } = useApp();
  const browserContainerRef = React.useRef(null);
  const projectUrlRef = React.useRef(null);
  const projectIdRef = React.useRef(null);
  const loadAttemptedRef = React.useRef(false);

  const canDisplayWebview = project && (project.status === 'running' || (!project.path && !project.port));
  const requiresLocalService = project && (project.path || project.port) && project.status !== 'running';

  const { setIsEditorConfigOpen, isEditorConfigOpen } = useApp();
  const { isDevToolsOpen, toggleDevTools } = useDevTools(project);
  const { openEditor } = useEditor(showToast, setIsEditorConfigOpen);
  const { captureScreenshot } = useScreenshot(showToast, project);
  
  useBrowserViewBounds(browserContainerRef, [isSidebarCollapsed, selectedDevice]);


  useEffect(() => {
    const isModalOpen = isEditModalOpen || isEditorConfigOpen || isSearchOpen || isSettingsOpen || isTabSwitcherOpen;
    if (electronAPI.isAvailable()) {
      if (isModalOpen) {
        electronAPI.browserViewHide();
      } else if (project && canDisplayWebview) {
        const bounds = calculateBrowserViewBounds(browserContainerRef);
        if (bounds) {
          electronAPI.browserViewShow(bounds);
        }
      }
    }
  }, [isEditModalOpen, isEditorConfigOpen, isSearchOpen, isSettingsOpen, isTabSwitcherOpen, project, canDisplayWebview]);

  useEffect(() => {
    const checkNavigationState = async () => {
      if (electronAPI.isAvailable()) {
        const backResult = await electronAPI.browserViewCanGoBack();
        const forwardResult = await electronAPI.browserViewCanGoForward();
        setCanGoBack(backResult?.canGoBack || false);
        setCanGoForward(forwardResult?.canGoForward || false);
      }
    };

    const interval = setInterval(checkNavigationState, 500);
    return () => clearInterval(interval);
  }, [project?.id]);

  useEffect(() => {
    const projectId = project?.id;
    const projectUrl = project?.url;
    const shouldLoad = project && canDisplayWebview && projectUrl;
    const urlChanged = projectUrlRef.current !== projectUrl;
    const projectChanged = projectIdRef.current !== projectId;

    if (shouldLoad && (urlChanged || projectChanged)) {
      projectIdRef.current = projectId;
      projectUrlRef.current = projectUrl;
      loadAttemptedRef.current = true;
      setUrl(project.url);
      
      const updateBrowserView = () => {
        const bounds = calculateBrowserViewBounds(browserContainerRef);
        if (bounds) {
          electronAPI.browserViewLoad(project.url, bounds, project.id);
        }
      };
      
      const timer = setTimeout(updateBrowserView, 100);
      
      const cleanupLoading = electronAPI.onBrowserViewLoading((loading) => {
        setIsLoading(loading);
      });
      
      const cleanupNavigate = electronAPI.onBrowserViewNavigate((navigationUrl) => {
        setUrl(navigationUrl);
      });
      
      return () => {
        clearTimeout(timer);
        if (cleanupLoading) cleanupLoading();
        if (cleanupNavigate) cleanupNavigate();
      };
    } else if (!project || !canDisplayWebview) {
      if (electronAPI.isAvailable() && loadAttemptedRef.current) {
        electronAPI.browserViewHide();
        projectIdRef.current = null;
        projectUrlRef.current = null;
      }
    }
  }, [project?.id, project?.url, canDisplayWebview, isSidebarCollapsed]);

  useEffect(() => {
    if (project?.url && project.url !== url) {
      setUrl(project.url);
    } else if (!project) {
      setUrl('');
    }
  }, [project?.id, project?.url]);

  const handleCopyUrl = () => {
      navigator.clipboard.writeText(url);
      showToast('URL copied to clipboard', 'success');
  };

  const handleOpenDevTools = async () => {
    const success = await toggleDevTools();
    if (!success) {
      showToast('DevTools not available', 'info');
    }
  };
  
  const handleGoBack = () => {
    electronAPI.browserViewGoBack();
  };
  
  const handleGoForward = () => {
    electronAPI.browserViewGoForward();
  };
  
  const handleRefresh = () => {
    if (electronAPI.isAvailable()) {
      setIsLoading(true);
      electronAPI.browserViewReload();
      setTimeout(() => setIsLoading(false), 1000);
    }
  };
  
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    let targetUrl = url.trim();
    
    if (!targetUrl) return;
    
    if (isSearchQuery(targetUrl)) {
      targetUrl = createSearchUrl(targetUrl);
    } else {
      targetUrl = normalizeUrl(targetUrl);
    }
    
    setUrl(targetUrl);
    if (project?.id) {
      onUpdateProject(project.id, { url: targetUrl });
    }
    
    if (electronAPI.isAvailable()) {
      const bounds = calculateBrowserViewBounds(browserContainerRef);
      if (bounds) {
        setIsLoading(true);
        electronAPI.browserViewLoad(targetUrl, bounds).then(result => {
          if (!result.success) {
            showToast(`Failed to load: ${result.error}`, 'error');
          }
          setIsLoading(false);
        });
      }
    }
  };

  const handleClearAllCache = async () => {
    if (electronAPI.isAvailable()) {
      setIsLoading(true);
      const session = await electronAPI.browserViewClearCache();
      if (session?.success) {
        await electronAPI.browserViewClearStorage();
      }
      await handleElectronResult(
        () => electronAPI.browserViewHardReload(),
        showToast,
        t('toast.cacheCleared')
      );
      setTimeout(() => setIsLoading(false), 1000);
    }
  };


  return (
    <>
    <div className="flex-1 h-screen flex flex-col bg-zinc-50 dark:bg-[#111111] overflow-hidden transition-colors duration-300">
      <div 
        className={`flex-1 overflow-hidden flex-col transition-opacity duration-300 ${
          !project 
            ? 'flex opacity-100' 
            : 'absolute inset-0 invisible opacity-0 pointer-events-none z-[-1]'
        }`}
      >
        <Dashboard 
          projects={projects} 
          onSelectProject={onSelectProject} 
          onOpenEdit={onOpenEdit}
          onDeleteProject={onDeleteProject}
          onPinProject={onPinProject}
          onReorderProjects={onReorderProjects}
          onScanPorts={onScanPorts}
          showToast={showToast}
        />
      </div>
      
      <div 
        className={`flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-[#111111] ${
          project 
            ? 'flex opacity-100 relative z-10' 
            : 'absolute inset-0 invisible opacity-0 pointer-events-none z-[-1]'
        }`}
      >
      <div 
        className="h-14 border-b border-zinc-100 dark:border-white/5 flex items-center pr-5 gap-4 select-none bg-zinc-50 dark:bg-sidebar transition-colors relative app-drag-region" 
        style={{ zIndex: Z_INDEX.BROWSER_TOOLBAR, paddingLeft: isSidebarCollapsed ? '88px' : '20px' }}
        onDoubleClick={(e) => { if (e.target === e.currentTarget) window.electronAPI?.toggleMaximize?.(); }}
      >
            <BrowserToolbar 
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              isSidebarCollapsed={isSidebarCollapsed}
              onNavigateHome={() => onSelectProject(null)}
              onToggleSidebar={onToggleSidebar}
            />

            <AddressBar 
              url={url}
              onUrlChange={setUrl}
              onUrlSubmit={handleUrlSubmit}
              onCopyUrl={handleCopyUrl}
              project={project}
              projects={projects}
              onSelectProject={onSelectProject}
            />

            <DeviceSelector 
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
            />

            <BrowserActions
              project={project}
              isDevToolsOpen={isDevToolsOpen}
              onOpenEditor={openEditor}
              onToggleDevTools={handleOpenDevTools}
              onCaptureScreenshot={captureScreenshot}
              onClearAllCache={handleClearAllCache}
            />
      </div>
      
      <div className="flex-1 bg-white dark:bg-[#1c1c1f] flex flex-col overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative transition-colors duration-300">

          <BrowserContent 
            browserContainerRef={browserContainerRef}
            selectedDevice={selectedDevice}
            canDisplayWebview={canDisplayWebview}
            requiresLocalService={requiresLocalService}
            isLoading={isLoading}
            project={project}
            onOpenEdit={onOpenEdit}
            showToast={showToast}
          />
          
        </div>
        </div>
      </div>
    </>
  );
};
