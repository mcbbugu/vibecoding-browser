const safeInvoke = (method, fallback) => {
  return (...args) => {
    if (!window.electronAPI) return Promise.resolve(fallback);
    return window.electronAPI[method](...args);
  };
};

export const electronAPI = {
  getProjects: safeInvoke('getProjects', []),

  saveProjects: safeInvoke('saveProjects', { success: false }),

  scanCommonPorts: safeInvoke('scanCommonPorts', []),

  startService: safeInvoke('startService', { success: false, error: 'Electron API not available' }),

  stopService: safeInvoke('stopService', { success: false, error: 'Electron API not available' }),

  getRunningServices: safeInvoke('getRunningServices', []),

  sendTerminalInput: safeInvoke('sendTerminalInput', { success: false, error: 'Electron API not available' }),

  getLocalIPs: safeInvoke('getLocalIPs', ['localhost', '127.0.0.1']),

  openFolder: safeInvoke('openFolder', { success: false, error: 'Electron API not available' }),

  openEditor: safeInvoke('openEditor', { success: false, error: 'Electron API not available' }),

  selectFolder: safeInvoke('selectFolder', null),

  browserViewLoad: (url, bounds, projectId) => {
    if (window.electronAPI?.browserViewLoad) {
      return window.electronAPI.browserViewLoad(url, bounds, projectId);
    }
    return Promise.resolve({ success: false, error: 'Electron API not available' });
  },
  browserViewRemove: (projectId) => {
    if (window.electronAPI?.browserViewRemove) {
      return window.electronAPI.browserViewRemove(projectId);
    }
    return Promise.resolve({ success: false });
  },

  browserViewUpdateBounds: safeInvoke('browserViewUpdateBounds', { success: false }),

  browserViewReload: safeInvoke('browserViewReload', { success: false }),

  browserViewGoBack: safeInvoke('browserViewGoBack', { success: false }),

  browserViewGoForward: safeInvoke('browserViewGoForward', { success: false }),

  browserViewDevTools: safeInvoke('browserViewDevTools', { success: false }),
  browserViewIsDevToolsOpened: safeInvoke('browserViewIsDevToolsOpened', { isOpened: false }),
  
  captureScreenshot: safeInvoke('captureScreenshot', { success: false, error: 'Electron API not available' }),
  
  browserViewFind: safeInvoke('browserViewFind', { success: false, error: 'Electron API not available' }),
  browserViewStopFind: safeInvoke('browserViewStopFind', { success: false, error: 'Electron API not available' }),
  browserViewClearCache: safeInvoke('browserViewClearCache', { success: false, error: 'Electron API not available' }),
  
  browserViewCanGoBack: safeInvoke('browserViewCanGoBack', { canGoBack: false }),
  browserViewCanGoForward: safeInvoke('browserViewCanGoForward', { canGoForward: false }),
  browserViewCopy: safeInvoke('browserViewCopy', { success: false }),
  browserViewPaste: safeInvoke('browserViewPaste', { success: false }),
  browserViewSelectAll: safeInvoke('browserViewSelectAll', { success: false }),
  browserViewViewSource: safeInvoke('browserViewViewSource', { success: false }),
  browserViewSaveAs: safeInvoke('browserViewSaveAs', { success: false }),
  browserViewPrint: safeInvoke('browserViewPrint', { success: false }),
  browserViewGetPageInfo: safeInvoke('browserViewGetPageInfo', null),

  onBrowserViewLoading: (callback) => {
    if (!window.electronAPI?.onBrowserViewLoading) return null;
    return window.electronAPI.onBrowserViewLoading(callback);
  },

  onBrowserViewError: (callback) => {
    if (!window.electronAPI?.onBrowserViewError) return null;
    return window.electronAPI.onBrowserViewError(callback);
  },

  onBrowserViewNavigate: (callback) => {
    if (!window.electronAPI?.onBrowserViewNavigate) return null;
    return window.electronAPI.onBrowserViewNavigate(callback);
  },

  onGlobalShortcut: (callback) => {
    if (!window.electronAPI?.onGlobalShortcut) return null;
    return window.electronAPI.onGlobalShortcut(callback);
  },

  isAvailable: () => {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }
};

