const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  scanPort: (port) => ipcRenderer.invoke('scan-port', port),
  scanCommonPorts: () => ipcRenderer.invoke('scan-common-ports'),
  startService: (projectPath, command) => ipcRenderer.invoke('start-service', projectPath, command),
  stopService: (pid) => ipcRenderer.invoke('stop-service', pid),
  getRunningServices: () => ipcRenderer.invoke('get-running-services'),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  openEditor: (command, args) => ipcRenderer.invoke('open-editor', command, args),
  
  // BrowserView API
  browserViewLoad: (url, bounds) => ipcRenderer.invoke('browser-view-load', url, bounds),
  browserViewRemove: () => ipcRenderer.invoke('browser-view-remove'),
  browserViewUpdateBounds: (bounds) => ipcRenderer.invoke('browser-view-update-bounds', bounds),
  browserViewReload: () => ipcRenderer.invoke('browser-view-reload'),
  browserViewGoBack: () => ipcRenderer.invoke('browser-view-go-back'),
  browserViewGoForward: () => ipcRenderer.invoke('browser-view-go-forward'),
  browserViewDevTools: () => ipcRenderer.invoke('browser-view-devtools'),
  
  // 监听 BrowserView 事件
  onBrowserViewLoading: (callback) => {
    ipcRenderer.on('browser-view-loading', (event, loading) => callback(loading));
    return () => ipcRenderer.removeAllListeners('browser-view-loading');
  },
  onBrowserViewError: (callback) => {
    ipcRenderer.on('browser-view-error', (event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('browser-view-error');
  },

  onGlobalShortcut: (callback) => {
    ipcRenderer.on('global-shortcut', (_, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('global-shortcut');
  }
});

