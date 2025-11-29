const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  scanPort: (port) => ipcRenderer.invoke('scan-port', port),
  scanCommonPorts: () => ipcRenderer.invoke('scan-common-ports'),
  scanDevelopmentPorts: () => ipcRenderer.invoke('scan-development-ports'),
  scanAllPorts: () => ipcRenderer.invoke('scan-all-ports'),
  onPortScanProgress: (callback) => {
    ipcRenderer.on('port-scan-progress', (event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('port-scan-progress');
  },
  startService: (projectPath, command) => ipcRenderer.invoke('start-service', projectPath, command),
  stopService: (pid) => ipcRenderer.invoke('stop-service', pid),
  getRunningServices: () => ipcRenderer.invoke('get-running-services'),
  sendTerminalInput: (pid, input) => ipcRenderer.invoke('send-terminal-input', pid, input),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  openEditor: (command, args) => ipcRenderer.invoke('open-editor', command, args),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // BrowserView API
  browserViewLoad: (url, bounds, projectId) => ipcRenderer.invoke('browser-view-load', url, bounds, projectId),
  browserViewRemove: (projectId) => ipcRenderer.invoke('browser-view-remove', projectId),
  browserViewUpdateBounds: (bounds) => ipcRenderer.invoke('browser-view-update-bounds', bounds),
  browserViewHide: () => ipcRenderer.invoke('browser-view-hide'),
  browserViewShow: (bounds) => ipcRenderer.invoke('browser-view-show', bounds),
  browserViewReload: () => ipcRenderer.invoke('browser-view-reload'),
  browserViewGoBack: () => ipcRenderer.invoke('browser-view-go-back'),
  browserViewGoForward: () => ipcRenderer.invoke('browser-view-go-forward'),
  browserViewDevTools: () => ipcRenderer.invoke('browser-view-devtools'),
  browserViewIsDevToolsOpened: () => ipcRenderer.invoke('browser-view-is-devtools-opened'),
  
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  
  browserViewFind: (text, options) => ipcRenderer.invoke('browser-view-find', text, options),
  browserViewStopFind: (action) => ipcRenderer.invoke('browser-view-stop-find', action),
  browserViewClearCache: () => ipcRenderer.invoke('browser-view-clear-cache'),
  browserViewHardReload: () => ipcRenderer.invoke('browser-view-hard-reload'),
  browserViewClearStorage: () => ipcRenderer.invoke('browser-view-clear-storage'),
  browserViewSetCacheDisabled: (disabled) => ipcRenderer.invoke('browser-view-set-cache-disabled', disabled),
  browserViewOpenNetworkPanel: () => ipcRenderer.invoke('browser-view-open-network-panel'),
  
  browserViewCanGoBack: () => ipcRenderer.invoke('browser-view-can-go-back'),
  browserViewCanGoForward: () => ipcRenderer.invoke('browser-view-can-go-forward'),
  browserViewCopy: () => ipcRenderer.invoke('browser-view-copy'),
  browserViewPaste: () => ipcRenderer.invoke('browser-view-paste'),
  browserViewSelectAll: () => ipcRenderer.invoke('browser-view-select-all'),
  browserViewViewSource: () => ipcRenderer.invoke('browser-view-view-source'),
  browserViewSaveAs: () => ipcRenderer.invoke('browser-view-save-as'),
  browserViewPrint: () => ipcRenderer.invoke('browser-view-print'),
  browserViewGetPageInfo: () => ipcRenderer.invoke('browser-view-get-page-info'),
  
  // 监听 BrowserView 事件
  onBrowserViewLoading: (callback) => {
    ipcRenderer.on('browser-view-loading', (event, loading) => callback(loading));
    return () => ipcRenderer.removeAllListeners('browser-view-loading');
  },
  onBrowserViewError: (callback) => {
    ipcRenderer.on('browser-view-error', (event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('browser-view-error');
  },
  
  onBrowserViewNavigate: (callback) => {
    ipcRenderer.on('browser-view-navigate', (event, url) => callback(url));
    return () => ipcRenderer.removeAllListeners('browser-view-navigate');
  },

  onGlobalShortcut: (callback) => {
    ipcRenderer.on('global-shortcut', (_, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('global-shortcut');
  },

  openInTerminal: (cwd) => ipcRenderer.invoke('open-in-terminal', cwd)
});

