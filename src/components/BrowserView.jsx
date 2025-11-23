import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { EditorConfigModal } from './EditorConfigModal';
import { BrowserToolbar } from './BrowserView/BrowserToolbar';
import { AddressBar } from './BrowserView/AddressBar';
import { DeviceSelector } from './BrowserView/DeviceSelector';
import { BrowserContent } from './BrowserView/BrowserContent';
import { TerminalPanel } from './BrowserView/TerminalPanel';
import { Code, Settings2 } from 'lucide-react';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
import { storage } from '../utils/storage';

export const BrowserView = ({ 
  project, 
  onStatusChange, 
  onUpdateProject, 
  projects, 
  onSelectProject, 
  showToast, 
  onOpenEdit, 
  onDeleteProject, 
  isSidebarCollapsed, 
  onToggleSidebar, 
  onQuickNavigate, 
  onScanPorts 
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState({ 
    name: '桌面端', 
    width: '100%', 
    height: '100%', 
    category: 'desktop' 
  });
  const [showEditorConfig, setShowEditorConfig] = useState(false);
  const browserContainerRef = React.useRef(null);
  const projectUrlRef = React.useRef(null);
  const projectIdRef = React.useRef(null);
  const loadAttemptedRef = React.useRef(false);

  const canDisplayWebview = project && (project.status === 'running' || (!project.path && !project.port));
  const requiresLocalService = project && (project.path || project.port) && project.status !== 'running';

  useEffect(() => {
    if (!project || !browserContainerRef.current) return;
    
    const timer = setTimeout(() => {
      if (browserContainerRef.current) {
        const rect = browserContainerRef.current.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
        electronAPI.browserViewUpdateBounds(bounds);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed, project, canDisplayWebview]);

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
        if (browserContainerRef.current) {
          const rect = browserContainerRef.current.getBoundingClientRect();
          const bounds = {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          
          electronAPI.browserViewLoad(project.url, bounds).then(result => {
            if (!result.success) {
              showToast(`Failed to load: ${result.error}`, 'error');
            }
          });
        }
      };
      
      const timer = setTimeout(updateBrowserView, 100);
      
      const handleResize = () => {
        if (browserContainerRef.current && project) {
          const rect = browserContainerRef.current.getBoundingClientRect();
          const bounds = {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          electronAPI.browserViewUpdateBounds(bounds);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      const cleanupLoading = electronAPI.onBrowserViewLoading((loading) => {
        setIsLoading(loading);
      });
      
      const cleanupError = electronAPI.onBrowserViewError((error) => {
        showToast(`Load error: ${error}`, 'error');
      });
      
      const handleSidebarToggle = () => {
        setTimeout(() => {
          if (browserContainerRef.current && project) {
            const rect = browserContainerRef.current.getBoundingClientRect();
            const bounds = {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
            electronAPI.browserViewUpdateBounds(bounds);
          }
        }, 300);
      };
      
      window.addEventListener('sidebar-toggle', handleSidebarToggle);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('sidebar-toggle', handleSidebarToggle);
        if (cleanupLoading) cleanupLoading();
        if (cleanupError) cleanupError();
      };
    } else if (!project || !canDisplayWebview) {
      if (electronAPI.isAvailable() && loadAttemptedRef.current) {
        electronAPI.browserViewRemove();
        loadAttemptedRef.current = false;
        projectIdRef.current = null;
        projectUrlRef.current = null;
      }
    }
  }, [project?.id, project?.url, canDisplayWebview, isSidebarCollapsed]);

  useEffect(() => {
    if (browserContainerRef.current && project && canDisplayWebview) {
      const timer = setTimeout(() => {
        const rect = browserContainerRef.current.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
        electronAPI.browserViewUpdateBounds(bounds);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDevice, project?.id, canDisplayWebview]);

  const handleCopyUrl = () => {
      navigator.clipboard.writeText(url);
      showToast('URL copied to clipboard', 'success');
  };

  const handleOpenDevTools = () => {
    if (electronAPI.isAvailable()) {
      electronAPI.browserViewDevTools();
    } else {
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
    
    if (electronAPI.isAvailable() && browserContainerRef.current) {
      const rect = browserContainerRef.current.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
      
      setIsLoading(true);
      electronAPI.browserViewLoad(targetUrl, bounds).then(result => {
        if (!result.success) {
          showToast(`Failed to load: ${result.error}`, 'error');
        }
        setIsLoading(false);
      });
    }
  };

  if (!project) {
    return <Dashboard 
      projects={projects} 
      onSelectProject={onSelectProject} 
      onOpenEdit={onOpenEdit}
      onDeleteProject={onDeleteProject}
      showToast={showToast}
    />;
  }

  const isRunning = canDisplayWebview;

  return (
    <>
    <div className="flex-1 h-screen flex flex-col bg-zinc-50 dark:bg-[#111111] overflow-hidden transition-colors duration-300">
      <div className="flex-1 bg-white dark:bg-[#1c1c1f] flex flex-col overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-l border-zinc-200 dark:border-white/5 relative transition-colors duration-300">
        
        <div className="h-14 border-b border-zinc-100 dark:border-white/5 flex items-center px-5 gap-4 select-none bg-white dark:bg-[#1c1c1f] transition-colors">
            <BrowserToolbar 
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={onToggleSidebar}
              onSelectProject={onSelectProject}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          
          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />

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

            <button 
              onClick={() => {
                if (project && project.path) {
                  const editorConfig = storage.get('editorConfig', { command: 'code', args: ['{path}'] });
                  const command = editorConfig.command;
                  const args = editorConfig.args.map(arg => arg.replace('{path}', project.path));
                  electronAPI.openEditor(command, args).then(result => {
                    if (result.success) {
                      showToast('编辑器已打开', 'success');
                    } else {
                      showToast(`打开编辑器失败: ${result.error}`, 'error');
                    }
                  });
                } else {
                  showToast('项目路径未设置', 'error');
                }
              }}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              title="在编辑器中打开项目"
            >
                <Code size={18} />
             </button>
            <button 
              onClick={() => setShowEditorConfig(true)}
              className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              title="配置编辑器"
            >
              <Settings2 size={18} />
            </button>
        </div>

          <BrowserContent 
            browserContainerRef={browserContainerRef}
            selectedDevice={selectedDevice}
            canDisplayWebview={canDisplayWebview}
            requiresLocalService={requiresLocalService}
            isLoading={isLoading}
            project={project}
            onStatusChange={onStatusChange}
            onOpenEdit={onOpenEdit}
            showToast={showToast}
          />

          <TerminalPanel 
            showTerminal={showTerminal}
            terminalLogs={terminalLogs}
            project={project}
            onClear={() => setTerminalLogs([])}
            onClose={() => setShowTerminal(false)}
          />
        </div>
      </div>

      <EditorConfigModal
        isOpen={showEditorConfig}
        onClose={() => setShowEditorConfig(false)}
        showToast={showToast}
      />
    </>
  );
};
