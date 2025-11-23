export const electronAPI = {
  getProjects: () => {
    if (!window.electronAPI) return Promise.resolve([]);
    return window.electronAPI.getProjects();
  },

  saveProjects: (projects) => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.saveProjects(projects);
  },

  scanCommonPorts: () => {
    if (!window.electronAPI) return Promise.resolve([]);
    return window.electronAPI.scanCommonPorts();
  },

  startService: (projectPath, command) => {
    if (!window.electronAPI) return Promise.resolve({ success: false, error: 'Electron API not available' });
    return window.electronAPI.startService(projectPath, command);
  },

  stopService: (pid) => {
    if (!window.electronAPI) return Promise.resolve({ success: false, error: 'Electron API not available' });
    return window.electronAPI.stopService(pid);
  },

  getRunningServices: () => {
    if (!window.electronAPI) return Promise.resolve([]);
    return window.electronAPI.getRunningServices();
  },

  getLocalIPs: () => {
    if (!window.electronAPI) return Promise.resolve(['localhost', '127.0.0.1']);
    return window.electronAPI.getLocalIPs();
  },

  openFolder: (folderPath) => {
    if (!window.electronAPI) return Promise.resolve({ success: false, error: 'Electron API not available' });
    return window.electronAPI.openFolder(folderPath);
  },
  openEditor: (command, args) => {
    if (!window.electronAPI) return Promise.resolve({ success: false, error: 'Electron API not available' });
    return window.electronAPI.openEditor(command, args);
  },

  selectFolder: () => {
    if (!window.electronAPI) return Promise.resolve(null);
    return window.electronAPI.selectFolder();
  },

  browserViewLoad: (url, bounds) => {
    if (!window.electronAPI) return Promise.resolve({ success: false, error: 'Electron API not available' });
    return window.electronAPI.browserViewLoad(url, bounds);
  },

  browserViewRemove: () => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewRemove();
  },

  browserViewUpdateBounds: (bounds) => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewUpdateBounds(bounds);
  },

  browserViewReload: () => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewReload();
  },

  browserViewGoBack: () => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewGoBack();
  },

  browserViewGoForward: () => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewGoForward();
  },

  browserViewDevTools: () => {
    if (!window.electronAPI) return Promise.resolve({ success: false });
    return window.electronAPI.browserViewDevTools();
  },

  onBrowserViewLoading: (callback) => {
    if (!window.electronAPI?.onBrowserViewLoading) return null;
    return window.electronAPI.onBrowserViewLoading(callback);
  },

  onBrowserViewError: (callback) => {
    if (!window.electronAPI?.onBrowserViewError) return null;
    return window.electronAPI.onBrowserViewError(callback);
  },

  onGlobalShortcut: (callback) => {
    if (!window.electronAPI?.onGlobalShortcut) return null;
    return window.electronAPI.onGlobalShortcut(callback);
  },

  isAvailable: () => {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }
};

