import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { BrowserToolbar } from './BrowserView/BrowserToolbar';
import { AddressBar } from './BrowserView/AddressBar';
import { DeviceSelector } from './BrowserView/DeviceSelector';
import { BrowserContent } from './BrowserView/BrowserContent';
import { TabsBar } from './BrowserView/TabsBar';
import { Code, TerminalSquare, Camera } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
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
  isSidebarCollapsed, 
  onToggleSidebar, 
  onQuickNavigate, 
  onScanPorts,
  isEditModalOpen,
  openTabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState({ 
    name: '桌面端', 
    width: '100%', 
    height: '100%', 
    category: 'desktop' 
  });
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const browserContainerRef = React.useRef(null);
  const projectUrlRef = React.useRef(null);
  const projectIdRef = React.useRef(null);
  const loadAttemptedRef = React.useRef(false);

  const canDisplayWebview = project && (project.status === 'running' || (!project.path && !project.port));
  const requiresLocalService = project && (project.path || project.port) && project.status !== 'running';

  const { updateBounds, setIsEditorConfigOpen, isEditorConfigOpen } = useApp();
  const { isDevToolsOpen, toggleDevTools } = useDevTools(project);
  const { openEditor } = useEditor(showToast, setIsEditorConfigOpen);
  const { captureScreenshot } = useScreenshot(showToast, project);
  
  useBrowserViewBounds(browserContainerRef, [isSidebarCollapsed]);

  useEffect(() => {
    if ((isEditModalOpen || isEditorConfigOpen) && electronAPI.isAvailable()) {
      electronAPI.browserViewRemove();
      return;
    }
  }, [isEditModalOpen, isEditorConfigOpen]);

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
    const shouldLoad = project && canDisplayWebview && projectUrl && !isEditModalOpen && !isEditorConfigOpen;
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
          electronAPI.browserViewLoad(project.url, bounds, project.id).then(result => {
            if (!result.success) {
              showToast(`Failed to load: ${result.error}`, 'error');
            }
          });
        }
      };
      
      const timer = setTimeout(updateBrowserView, 100);
      
      const cleanupLoading = electronAPI.onBrowserViewLoading((loading) => {
        setIsLoading(loading);
      });
      
      const cleanupError = electronAPI.onBrowserViewError((error) => {
        const errorMsg = typeof error === 'object' && error.description 
          ? `${error.description} (${error.code})` 
          : String(error);
        showToast(`Load error: ${errorMsg}`, 'error');
      });
      
      const cleanupNavigate = electronAPI.onBrowserViewNavigate((navigationUrl) => {
        setUrl(navigationUrl);
      });
      
      return () => {
        clearTimeout(timer);
        if (cleanupLoading) cleanupLoading();
        if (cleanupError) cleanupError();
        if (cleanupNavigate) cleanupNavigate();
      };
    } else if (!project || !canDisplayWebview || isEditModalOpen || isEditorConfigOpen) {
      if (electronAPI.isAvailable() && loadAttemptedRef.current) {
        electronAPI.browserViewRemove(projectIdRef.current);
        loadAttemptedRef.current = false;
        projectIdRef.current = null;
        projectUrlRef.current = null;
        setUrl('');
      }
    }
  }, [project?.id, project?.url, canDisplayWebview, isSidebarCollapsed, isEditModalOpen, isEditorConfigOpen]);

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

  return (
    <>
    <div className="flex-1 h-screen flex flex-col bg-zinc-50 dark:bg-[#111111] overflow-hidden transition-colors duration-300">
      {openTabs.length > 0 && (
        <TabsBar 
          tabs={openTabs}
          activeTabId={activeTabId}
          projects={projects}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
        />
      )}
      
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
      <div className="h-14 border-b border-zinc-100 dark:border-white/5 flex items-center px-5 gap-4 select-none bg-white dark:bg-[#1c1c1f] transition-colors">
            <BrowserToolbar 
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
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

            <Tooltip message="在编辑器中打开项目" position="top">
              <button 
                onClick={() => project && openEditor(project)}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <Code size={18} />
              </button>
            </Tooltip>
            <Tooltip message={isDevToolsOpen ? "关闭浏览器控制台" : "打开浏览器控制台"} position="top">
              <button 
                onClick={handleOpenDevTools}
                className={`hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 ${isDevToolsOpen ? 'text-indigo-500 dark:text-indigo-400' : ''}`}
              >
                <TerminalSquare size={18} />
              </button>
            </Tooltip>
            <Tooltip message="截图" position="top">
              <button 
                onClick={captureScreenshot}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <Camera size={18} />
              </button>
            </Tooltip>
      </div>
      
      <div className="flex-1 bg-white dark:bg-[#1c1c1f] flex flex-col overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-l border-zinc-200 dark:border-white/5 relative transition-colors duration-300">

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
