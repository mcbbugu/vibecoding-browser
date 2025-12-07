const { app, BrowserWindow, ipcMain, shell, globalShortcut, dialog, clipboard, nativeImage, session } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const { scanPort, scanCommonPorts, scanDevelopmentPorts, scanAllPorts } = require('./services/port-scanner');
const { startService, stopService, getRunningServices } = require('./services/process-manager');
const { registerTerminalHandlers } = require('./ipc/terminal');
const { registerBrowserHandlers, setMainWindow, cleanupBrowserViews } = require('./ipc/browser');

const store = new Store();

let mainWindow;

function registerGlobalShortcuts() {
  // 只在窗口有焦点时注册全局快捷键
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isFocused()) {
    return;
  }

  globalShortcut.unregisterAll();

  const shortcuts = [
    { accelerator: 'CommandOrControl+T', action: 'search' },
    { accelerator: 'CommandOrControl+W', action: 'close-tab' },
    { accelerator: 'CommandOrControl+R', action: 'reload' },
    { accelerator: 'CommandOrControl+L', action: 'focus-url' },
    { accelerator: 'CommandOrControl+[', action: 'go-back' },
    { accelerator: 'CommandOrControl+]', action: 'go-forward' },
    { accelerator: 'CommandOrControl+S', action: 'cmd-s' },
    { accelerator: 'CommandOrControl+F', action: 'find' },
    { accelerator: 'CommandOrControl+E', action: 'open-editor' },
    { accelerator: 'CommandOrControl+Option+I', action: 'toggle-devtools' }
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
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    
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
    cleanupBrowserViews();
    mainWindow = null;
  });

  // 监听窗口全屏状态变化
  mainWindow.on('enter-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('window-enter-fullscreen');
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('window-leave-fullscreen');
    }
  });
  
  setMainWindow(mainWindow);
}

app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
  
  registerTerminalHandlers();
  registerBrowserHandlers();
  setupDownloadHandler();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const mem = process.memoryUsage();
      console.log(`Memory: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(mem.rss / 1024 / 1024).toFixed(2)}MB`);
    }, 30000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      registerGlobalShortcuts();
    }
  });
});

app.on('window-all-closed', () => {
  unregisterGlobalShortcuts();
  cleanupBrowserViews();
  
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

ipcMain.handle('scan-development-ports', async (event) => {
  const results = [];
  await scanDevelopmentPorts((progress) => {
    event.sender.send('port-scan-progress', progress);
  });
  return results;
});

ipcMain.handle('scan-all-ports', async (event) => {
  return await scanAllPorts((progress) => {
    event.sender.send('port-scan-progress', progress);
  });
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

ipcMain.handle('toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('is-window-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
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

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { 
      success: true, 
      updateAvailable: result.updateInfo.version !== app.getVersion(),
      currentVersion: app.getVersion(),
      latestVersion: result.updateInfo.version
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', {
      version: info.version
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', {
      error: err.message
    });
  }
});

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall();
});

// 下载处理：拦截下载并用系统浏览器打开
function setupDownloadHandler() {
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // 取消下载
    event.preventDefault();
    
    // 获取下载 URL
    const url = item.getURL();
    
    // 用系统默认浏览器打开
    shell.openExternal(url);
  });
}