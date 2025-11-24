const { app, BrowserWindow, BrowserView, ipcMain, shell, globalShortcut, dialog, clipboard, nativeImage, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { scanPort, scanCommonPorts } = require('./services/port-scanner');
const { startService, stopService, getRunningServices, sendTerminalInput } = require('./services/process-manager');

const store = new Store();

let mainWindow;
let currentBrowserView = null;
const browserViews = new Map();

function registerGlobalShortcuts() {
  // 只在窗口有焦点时注册全局快捷键
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isFocused()) {
    return;
  }

  globalShortcut.unregisterAll();

  const shortcuts = [
    { accelerator: 'CommandOrControl+K', action: 'search' },
    { accelerator: 'CommandOrControl+T', action: 'new-tab' },
    { accelerator: 'CommandOrControl+W', action: 'close-tab' },
    { accelerator: 'CommandOrControl+R', action: 'reload' },
    { accelerator: 'CommandOrControl+L', action: 'focus-url' },
    { accelerator: 'CommandOrControl+[', action: 'go-back' },
    { accelerator: 'CommandOrControl+]', action: 'go-forward' },
    { accelerator: 'CommandOrControl+S', action: 'cmd-s' },
    { accelerator: 'CommandOrControl+F', action: 'find' },
    { accelerator: 'CommandOrControl+Tab', action: 'next-tab' },
    { accelerator: 'CommandOrControl+Shift+Tab', action: 'prev-tab' }
  ];

  shortcuts.forEach(({ accelerator, action }) => {
    const success = globalShortcut.register(accelerator, () => {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
        mainWindow.webContents.send('global-shortcut', action);
      }
    });

    if (!success) {
      console.warn(`Failed to register shortcut: ${accelerator}`);
    }
  });
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
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

  // 窗口获得焦点时注册快捷键
  mainWindow.on('focus', () => {
    registerGlobalShortcuts();
  });

  // 窗口失去焦点时取消注册快捷键，释放给其他应用
  mainWindow.on('blur', () => {
    unregisterGlobalShortcuts();
  });

  mainWindow.on('closed', () => {
    unregisterGlobalShortcuts();
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

ipcMain.handle('send-terminal-input', async (event, pid, input) => {
  return sendTerminalInput(pid, input);
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

const findEditorCommand = (command) => {
  if (os.platform() === 'darwin') {
    const editorPaths = {
      'code': [
        '/usr/local/bin/code',
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
      ],
      'cursor': [
        '/usr/local/bin/cursor',
        '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
        '/Applications/CursorPro.app/Contents/Resources/app/bin/cursor'
      ],
      'windsurf': [
        '/usr/local/bin/windsurf',
        '/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf'
      ],
      'subl': [
        '/usr/local/bin/subl',
        '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl'
      ],
      'atom': [
        '/usr/local/bin/atom',
        '/Applications/Atom.app/Contents/Resources/app/atom.sh'
      ],
      'webstorm': [
        '/usr/local/bin/webstorm',
        '/Applications/WebStorm.app/Contents/MacOS/webstorm'
      ]
    };

    const paths = editorPaths[command];
    if (paths) {
      for (const editorPath of paths) {
        if (fs.existsSync(editorPath)) {
          return editorPath;
        }
      }
    }
  }
  return command;
};

ipcMain.handle('open-editor', async (event, command, args) => {
  return new Promise((resolve) => {
    let resolved = false;
    
    const tryOpen = (actualCommand) => {
      try {
        const editorProcess = spawn(actualCommand, args, {
          detached: true,
          stdio: 'ignore'
        });
        
        editorProcess.on('error', (error) => {
          if (resolved) return;
          
          if (error.code === 'ENOENT') {
            if (actualCommand === command && os.platform() === 'darwin') {
              const fallbackCommand = findEditorCommand(command);
              if (fallbackCommand !== command && fs.existsSync(fallbackCommand)) {
                tryOpen(fallbackCommand);
                return;
              }
              
              const appNames = {
                'code': 'Visual Studio Code',
                'cursor': 'Cursor',
                'windsurf': 'Windsurf',
                'subl': 'Sublime Text',
                'atom': 'Atom',
                'webstorm': 'WebStorm'
              };
              
              const appName = appNames[command];
              if (appName && fs.existsSync(`/Applications/${appName}.app`)) {
                const projectPath = args[0];
                const openProcess = spawn('open', ['-a', appName, projectPath], {
                  detached: true,
                  stdio: 'ignore'
                });
                openProcess.unref();
                resolved = true;
                resolve({ success: true });
                return;
              }
            }
            
            resolved = true;
            resolve({ 
              success: false, 
              error: `找不到命令 "${command}"。请确保编辑器已安装，并将命令行工具添加到 PATH 中。\n\n提示：在终端运行 "which ${command}" 检查命令是否可用。` 
            });
          } else {
            resolved = true;
            resolve({ success: false, error: error.message });
          }
        });
        
        if (editorProcess.pid) {
          editorProcess.unref();
          
          if (os.platform() === 'darwin') {
            setTimeout(() => {
              const appName = command === 'code' ? 'Visual Studio Code' 
                : command === 'cursor' ? 'Cursor'
                : command === 'windsurf' ? 'Windsurf'
                : command === 'subl' ? 'Sublime Text'
                : command === 'atom' ? 'Atom'
                : command === 'webstorm' ? 'WebStorm'
                : null;
              
              if (appName) {
                spawn('osascript', [
                  '-e', `tell application "${appName}" to activate`
                ], { detached: true, stdio: 'ignore' }).unref();
              }
            }, 500);
          }
          
          resolved = true;
          resolve({ success: true });
        } else {
          setTimeout(() => {
            if (!resolved) {
              if (editorProcess.pid) {
                editorProcess.unref();
                resolved = true;
                resolve({ success: true });
              } else {
                resolved = true;
                resolve({ success: false, error: 'Failed to start process' });
              }
            }
          }, 100);
        }
      } catch (error) {
        if (resolved) return;
        resolved = true;
        
        if (error.code === 'ENOENT') {
          resolve({ 
            success: false, 
            error: `找不到命令 "${command}"` 
          });
        } else {
          resolve({ success: false, error: error.message });
        }
      }
    };
    
    tryOpen(command);
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

ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择项目文件夹'
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0] || null;
  } catch (error) {
    return null;
  }
});

// BrowserView 管理
ipcMain.handle('browser-view-load', (event, url, bounds, projectId) => {
  if (!mainWindow) return { success: false, error: 'Main window not found' };
  
  try {
    const key = projectId || url;
    
    // 如果已经存在该项目的 BrowserView，直接切换显示
    if (browserViews.has(key)) {
      const existingView = browserViews.get(key);
      
      // 如果 URL 改变了，重新加载
      if (existingView.url !== url) {
        existingView.url = url;
        existingView.webContents.loadURL(url);
      }
      
      // 隐藏当前显示的 BrowserView
      if (currentBrowserView && currentBrowserView !== existingView) {
        mainWindow.removeBrowserView(currentBrowserView);
      }
      
      // 显示这个 BrowserView
      currentBrowserView = existingView;
      mainWindow.addBrowserView(currentBrowserView);
      currentBrowserView.setBounds(bounds);
      currentBrowserView.setAutoResize({ width: true, height: true });
      
      return { success: true };
    }
    
    // 隐藏当前的 BrowserView（但不销毁）
    if (currentBrowserView) {
      mainWindow.removeBrowserView(currentBrowserView);
    }
    
    // 创建新的 BrowserView
    const isLocalUrl = url && (
      url.includes('localhost') || 
      url.includes('127.0.0.1') || 
      url.includes('0.0.0.0') || 
      url.includes('::1') ||
      url.startsWith('file://') ||
      url.match(/^https?:\/\/127\./i) ||
      url.match(/^https?:\/\/localhost/i)
    );
    
    const newBrowserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        devTools: true,
        webSecurity: !isLocalUrl,
        allowRunningInsecureContent: isLocalUrl,
        experimentalFeatures: true
      }
    });
    
    newBrowserView.url = url;
    
    if (isLocalUrl) {
      const session = newBrowserView.webContents.session;
      
      session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: details.requestHeaders });
      });
      
      session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'notifications' || permission === 'geolocation') {
          callback(false);
        } else {
          callback(true);
        }
      });
      
      session.setCertificateVerifyProc((request, callback) => {
        callback(0);
      });
    }
    
    browserViews.set(key, newBrowserView);
    currentBrowserView = newBrowserView;
    
    // 添加事件监听器（只在创建新 BrowserView 时添加一次）
    const setupEventListeners = (view) => {
      view.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        
        const isCmdOrCtrl = input.meta || input.control;
        if (!isCmdOrCtrl) return;
        
        const shortcuts = {
          'k': 'search',
          't': 'new-tab',
          'w': 'close-tab',
          'r': 'reload',
          'l': 'focus-url',
          's': 'cmd-s',
          'f': 'find',
          '[': 'go-back',
          ']': 'go-forward'
        };
        
        if (input.key === 'Tab') {
          event.preventDefault();
          mainWindow.webContents.send('global-shortcut', input.shift ? 'prev-tab' : 'next-tab');
        } else if (shortcuts[input.key.toLowerCase()]) {
          event.preventDefault();
          mainWindow.webContents.send('global-shortcut', shortcuts[input.key.toLowerCase()]);
        }
      });
      
      view.webContents.on('did-start-loading', () => {
        if (mainWindow && !mainWindow.isDestroyed() && currentBrowserView === view) {
          mainWindow.webContents.send('browser-view-loading', true);
        }
      });
      
      view.webContents.on('did-stop-loading', () => {
        if (mainWindow && !mainWindow.isDestroyed() && currentBrowserView === view) {
          mainWindow.webContents.send('browser-view-loading', false);
        }
      });
      
      view.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (mainWindow && !mainWindow.isDestroyed() && currentBrowserView === view) {
          console.error('BrowserView load failed:', {
            errorCode,
            errorDescription,
            validatedURL,
            isMainFrame
          });
          mainWindow.webContents.send('browser-view-error', {
            code: errorCode,
            description: errorDescription,
            url: validatedURL
          });
        }
      });
      
      view.webContents.on('did-navigate', (event, navigationUrl) => {
        if (mainWindow && !mainWindow.isDestroyed() && currentBrowserView === view) {
          mainWindow.webContents.send('browser-view-navigate', navigationUrl);
        }
      });
      
      view.webContents.on('did-navigate-in-page', (event, navigationUrl) => {
        if (mainWindow && !mainWindow.isDestroyed() && currentBrowserView === view) {
          mainWindow.webContents.send('browser-view-navigate', navigationUrl);
        }
      });
    };
    
    setupEventListeners(newBrowserView);
    
    mainWindow.addBrowserView(currentBrowserView);
    currentBrowserView.setBounds(bounds);
    currentBrowserView.setAutoResize({ width: true, height: true });
    currentBrowserView.webContents.loadURL(url);
    
    currentBrowserView.webContents.on('context-menu', (event, params) => {
      const menuTemplate = [];
      
      if (params.linkURL) {
        menuTemplate.push(
          { label: '在新窗口打开链接', click: () => shell.openExternal(params.linkURL) },
          { label: '复制链接地址', click: () => clipboard.writeText(params.linkURL) },
          { type: 'separator' }
        );
      }
      
      if (params.hasImageContents) {
        menuTemplate.push(
          { label: '在新窗口打开图片', click: () => shell.openExternal(params.srcURL) },
          { label: '复制图片地址', click: () => clipboard.writeText(params.srcURL) },
          { type: 'separator' }
        );
      }
      
      if (params.isEditable) {
        menuTemplate.push(
          { label: '撤销', role: 'undo', enabled: params.editFlags.canUndo },
          { label: '重做', role: 'redo', enabled: params.editFlags.canRedo },
          { type: 'separator' },
          { label: '剪切', role: 'cut', enabled: params.editFlags.canCut },
          { label: '复制', role: 'copy', enabled: params.editFlags.canCopy },
          { label: '粘贴', role: 'paste', enabled: params.editFlags.canPaste },
          { label: '全选', role: 'selectAll', enabled: params.editFlags.canSelectAll },
          { type: 'separator' }
        );
      } else if (params.selectionText) {
        menuTemplate.push(
          { label: '复制', role: 'copy' },
          { type: 'separator' }
        );
      }
      
      menuTemplate.push(
        { label: '后退', enabled: currentBrowserView.webContents.canGoBack(), click: () => currentBrowserView.webContents.goBack() },
        { label: '前进', enabled: currentBrowserView.webContents.canGoForward(), click: () => currentBrowserView.webContents.goForward() },
        { label: '刷新', click: () => currentBrowserView.webContents.reload() },
        { type: 'separator' },
        { label: '另存为...', click: async () => {
          const result = await dialog.showSaveDialog(mainWindow, {
            title: '保存网页',
            defaultPath: 'page.html',
            filters: [{ name: '网页', extensions: ['html'] }]
          });
          if (!result.canceled && result.filePath) {
            const html = await currentBrowserView.webContents.executeJavaScript('document.documentElement.outerHTML');
            require('fs').writeFileSync(result.filePath, html, 'utf-8');
          }
        }},
        { label: '查看网页源代码', click: () => {
          const url = currentBrowserView.webContents.getURL();
          if (url) currentBrowserView.webContents.loadURL(`view-source:${url}`);
        }},
        { label: '检查元素', click: () => currentBrowserView.webContents.openDevTools() }
      );
      
      const menu = Menu.buildFromTemplate(menuTemplate);
      menu.popup({ window: mainWindow });
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-remove', (event, projectId) => {
  if (!mainWindow) return { success: false };
  
  try {
    if (projectId) {
      const key = projectId;
      if (browserViews.has(key)) {
        const view = browserViews.get(key);
        if (currentBrowserView === view) {
          mainWindow.removeBrowserView(currentBrowserView);
          currentBrowserView = null;
        }
        view.webContents.destroy();
        browserViews.delete(key);
      }
    } else {
      if (currentBrowserView) {
        mainWindow.removeBrowserView(currentBrowserView);
        currentBrowserView = null;
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
    if (currentBrowserView.webContents.isDevToolsOpened()) {
      currentBrowserView.webContents.closeDevTools();
    } else {
      currentBrowserView.webContents.openDevTools();
    }
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('browser-view-is-devtools-opened', () => {
  if (currentBrowserView) {
    return { isOpened: currentBrowserView.webContents.isDevToolsOpened() };
  }
  return { isOpened: false };
});

ipcMain.handle('capture-screenshot', async () => {
  if (!currentBrowserView || !mainWindow) {
    return { success: false, error: 'BrowserView not found' };
  }
  
  try {
    const image = await currentBrowserView.webContents.capturePage();
    if (image && !image.isEmpty()) {
      clipboard.writeImage(image);
      return { success: true };
    } else {
      return { success: false, error: 'Failed to capture page' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-find', (event, text, options = {}) => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  
  try {
    if (text === '') {
      currentBrowserView.webContents.startFindInPage('');
    } else {
      currentBrowserView.webContents.findInPage(text, options);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-stop-find', (event, action) => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  
  try {
    currentBrowserView.webContents.stopFindInPage(action || 'clearSelection');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-clear-cache', async () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  
  try {
    const session = currentBrowserView.webContents.session;
    await session.clearCache();
    await session.clearStorageData();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-can-go-back', () => {
  if (!currentBrowserView) {
    return { canGoBack: false };
  }
  return { canGoBack: currentBrowserView.webContents.canGoBack() };
});

ipcMain.handle('browser-view-can-go-forward', () => {
  if (!currentBrowserView) {
    return { canGoForward: false };
  }
  return { canGoForward: currentBrowserView.webContents.canGoForward() };
});

ipcMain.handle('browser-view-copy', () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    currentBrowserView.webContents.copy();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-paste', () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    currentBrowserView.webContents.paste();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-select-all', () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    currentBrowserView.webContents.selectAll();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-view-source', () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    const url = currentBrowserView.webContents.getURL();
    if (url && url !== 'about:blank') {
      const viewSourceUrl = `view-source:${url}`;
      currentBrowserView.webContents.loadURL(viewSourceUrl);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-save-as', async () => {
  if (!currentBrowserView || !mainWindow) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存网页',
      defaultPath: 'page.html',
      filters: [
        { name: '网页', extensions: ['html', 'htm'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    
    const filePath = result.filePath;
    const isPDF = filePath.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      try {
        const data = await currentBrowserView.webContents.printToPDF({});
        fs.writeFileSync(filePath, data);
        return { success: true, filePath };
      } catch (pdfError) {
        return { success: false, error: pdfError.message };
      }
    } else {
      try {
        const html = await currentBrowserView.webContents.executeJavaScript(`
          (function() {
            return document.documentElement.outerHTML;
          })()
        `);
        fs.writeFileSync(filePath, html, 'utf-8');
        return { success: true, filePath };
      } catch (jsError) {
        return { success: false, error: '无法获取页面内容' };
      }
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-print', () => {
  if (!currentBrowserView) {
    return { success: false, error: 'BrowserView not found' };
  }
  try {
    currentBrowserView.webContents.print({}, (success, failureReason) => {
      if (!success) {
        console.error('Print failed:', failureReason);
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browser-view-get-page-info', async () => {
  if (!currentBrowserView) {
    return null;
  }
  try {
    const url = currentBrowserView.webContents.getURL();
    const title = await currentBrowserView.webContents.executeJavaScript('document.title');
    const encoding = await currentBrowserView.webContents.executeJavaScript('document.characterSet || document.charset || "未知"');
    
    return {
      url: url || '',
      title: title || '',
      encoding: encoding || '未知'
    };
  } catch (error) {
    return {
      url: currentBrowserView.webContents.getURL() || '',
      title: '',
      encoding: '未知'
    };
  }
});

