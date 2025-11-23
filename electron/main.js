const { app, BrowserWindow, BrowserView, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { scanPort, scanCommonPorts } = require('./services/port-scanner');
const { startService, stopService, getRunningServices } = require('./services/process-manager');

const store = new Store();

let mainWindow;
let currentBrowserView = null;

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();

  const shortcuts = [
    { accelerator: 'CommandOrControl+K', action: 'search' },
    { accelerator: 'CommandOrControl+T', action: 'new-tab' },
    { accelerator: 'CommandOrControl+W', action: 'close-tab' },
    { accelerator: 'CommandOrControl+R', action: 'reload' },
    { accelerator: 'CommandOrControl+L', action: 'focus-url' },
    { accelerator: 'CommandOrControl+[', action: 'go-back' },
    { accelerator: 'CommandOrControl+]', action: 'go-forward' },
    { accelerator: 'CommandOrControl+S', action: 'cmd-s' }
  ];

  shortcuts.forEach(({ accelerator, action }) => {
    const success = globalShortcut.register(accelerator, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut', action);
      }
    });

    if (!success) {
      console.warn(`Failed to register shortcut: ${accelerator}`);
    }
  });
}

// 开发环境热重载
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module, {
      ignore: ['node_modules', 'dist', '.git'],
      watchRenderer: false // Vite 已经处理了渲染进程的热更新
    });
  } catch (err) {
    console.log('electron-reloader not available, skipping...');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    
    // 开发模式自动打开开发者工具
    mainWindow.webContents.openDevTools();
    
    let retryCount = 0;
    const maxRetries = 3;
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL === 'http://localhost:5173/' && retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:5173');
        }, 1000);
      }
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
      retryCount = 0;
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      registerGlobalShortcuts();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('get-projects', async () => {
  return store.get('projects', []);
});

ipcMain.handle('save-projects', async (event, projects) => {
  store.set('projects', projects);
  return { success: true };
});

ipcMain.handle('scan-port', async (event, port) => {
  return await scanPort(port);
});

ipcMain.handle('scan-common-ports', async () => {
  return await scanCommonPorts();
});

ipcMain.handle('start-service', async (event, projectPath, command) => {
  return await startService(projectPath, command);
});

ipcMain.handle('stop-service', async (event, pid) => {
  return await stopService(pid);
});

ipcMain.handle('get-running-services', async () => {
  return getRunningServices();
});

ipcMain.handle('get-local-ips', async () => {
  const interfaces = os.networkInterfaces();
  const ips = ['localhost', '127.0.0.1'];
  
  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  });
  
  return [...new Set(ips)];
});

ipcMain.on('open-devtools', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.webContents.openDevTools();
  }
});

ipcMain.handle('open-editor', async (event, command, args) => {
  return new Promise((resolve) => {
    try {
      const process = spawn(command, args, {
        detached: true,
        stdio: 'ignore'
      });
      process.unref();
      resolve({ success: true });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// BrowserView 管理
ipcMain.handle('browser-view-load', (event, url, bounds) => {
  if (!mainWindow) return { success: false, error: 'Main window not found' };
  
  try {
    // 移除旧的 BrowserView
    if (currentBrowserView) {
      mainWindow.removeBrowserView(currentBrowserView);
      currentBrowserView.webContents.destroy();
      currentBrowserView = null;
    }
    
    // 创建新的 BrowserView
    currentBrowserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        devTools: true
      }
    });
    
    mainWindow.addBrowserView(currentBrowserView);
    currentBrowserView.setBounds(bounds);
    currentBrowserView.setAutoResize({ width: true, height: true });
    currentBrowserView.webContents.loadURL(url);
    
    // 监听加载状态
    currentBrowserView.webContents.on('did-start-loading', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser-view-loading', true);
      }
    });
    
    currentBrowserView.webContents.on('did-stop-loading', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser-view-loading', false);
      }
    });
    
    currentBrowserView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser-view-error', errorDescription);
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-remove', () => {
  if (currentBrowserView && mainWindow) {
    mainWindow.removeBrowserView(currentBrowserView);
    currentBrowserView.webContents.destroy();
    currentBrowserView = null;
  }
  return { success: true };
});

ipcMain.handle('browser-view-update-bounds', (event, bounds) => {
  if (currentBrowserView) {
    currentBrowserView.setBounds(bounds);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('browser-view-reload', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.reload();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('browser-view-go-back', () => {
  if (currentBrowserView && currentBrowserView.webContents.canGoBack()) {
    currentBrowserView.webContents.goBack();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('browser-view-go-forward', () => {
  if (currentBrowserView && currentBrowserView.webContents.canGoForward()) {
    currentBrowserView.webContents.goForward();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('browser-view-devtools', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.openDevTools();
    return { success: true };
  }
  return { success: false };
});

