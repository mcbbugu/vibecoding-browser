const { BrowserView, ipcMain, shell, dialog, clipboard, Menu } = require('electron');
const fs = require('fs');

let mainWindow = null;
let currentBrowserView = null;
const browserViews = new Map();
const viewLastAccess = new Map();
const MAX_CACHED_VIEWS = 5;
const IDLE_TIMEOUT = 10 * 60 * 1000;

function setMainWindow(window) {
  mainWindow = window;
}

function getCurrentBrowserView() {
  return currentBrowserView;
}

function getBrowserViews() {
  return browserViews;
}

function cleanupBrowserViews() {
  browserViews.forEach((view) => {
    try {
      if (!view.webContents.isDestroyed()) {
        view.webContents.removeAllListeners();
        view.webContents.destroy();
      }
    } catch (err) {
      console.warn('Failed to cleanup BrowserView:', err);
    }
  });
  browserViews.clear();
  viewLastAccess.clear();
  currentBrowserView = null;
}

function cleanupIdleViews() {
  const now = Date.now();
  const toDelete = [];
  
  for (const [key, view] of browserViews.entries()) {
    const lastAccess = viewLastAccess.get(key) || 0;
    if (view !== currentBrowserView && (now - lastAccess) > IDLE_TIMEOUT) {
      toDelete.push(key);
    }
  }
  
  toDelete.forEach(key => {
    const view = browserViews.get(key);
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.removeBrowserView(view);
      }
      if (!view.webContents.isDestroyed()) {
        view.webContents.removeAllListeners();
        view.webContents.destroy();
      }
    } catch (err) {
      console.warn('Failed to cleanup idle view:', err);
    }
    browserViews.delete(key);
    viewLastAccess.delete(key);
  });
  
  if (toDelete.length > 0) {
    console.log(`Cleaned up ${toDelete.length} idle BrowserViews`);
  }
}

setInterval(cleanupIdleViews, 60 * 1000);

function registerBrowserHandlers() {
  ipcMain.handle('browser-view-load', (event, url, bounds, projectId) => {
    if (!mainWindow) return { success: false, error: 'Main window not found' };
    
    try {
      const key = projectId || url;
      
      if (browserViews.has(key)) {
        const existingView = browserViews.get(key);
        viewLastAccess.set(key, Date.now());
        
        if (existingView.url !== url) {
          existingView.url = url;
          existingView.webContents.loadURL(url);
        }
        
        if (currentBrowserView && currentBrowserView !== existingView) {
          mainWindow.removeBrowserView(currentBrowserView);
        }
        
        currentBrowserView = existingView;
        mainWindow.addBrowserView(currentBrowserView);
        currentBrowserView.setBounds(bounds);
        currentBrowserView.setAutoResize({ width: true, height: true, horizontal: 'none', vertical: 'none' });
        
        return { success: true };
      }
      
      if (currentBrowserView) {
        mainWindow.removeBrowserView(currentBrowserView);
      }
      
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
      
      if (browserViews.size >= MAX_CACHED_VIEWS) {
        let lruKey = null;
        let oldestTime = Date.now();
        
        for (const [k, v] of browserViews.entries()) {
          const lastAccess = viewLastAccess.get(k) || 0;
          if (v !== currentBrowserView && lastAccess < oldestTime) {
            oldestTime = lastAccess;
            lruKey = k;
          }
        }
        
        if (lruKey) {
          const oldView = browserViews.get(lruKey);
          try {
            if (!oldView.webContents.isDestroyed()) {
              oldView.webContents.removeAllListeners();
              oldView.webContents.destroy();
            }
          } catch (err) {
            console.warn('Failed to cleanup old view:', err);
          }
          browserViews.delete(lruKey);
          viewLastAccess.delete(lruKey);
        }
      }
      
      browserViews.set(key, newBrowserView);
      viewLastAccess.set(key, Date.now());
      currentBrowserView = newBrowserView;
      
      const setupEventListeners = (view) => {
        view.webContents.setWindowOpenHandler(({ url }) => {
          shell.openExternal(url);
          return { action: 'deny' };
        });

        view.webContents.on('before-input-event', (event, input) => {
          if (input.type === 'keyUp' && (input.key === 'Control' || input.key === 'Meta')) {
            mainWindow.webContents.send('global-shortcut', 'ctrl-released');
            return;
          }
          
          if (input.type !== 'keyDown') return;
          
          const isCmdOrCtrl = input.meta || input.control;
          if (!isCmdOrCtrl) return;
          
          const shortcuts = {
            't': 'search',
            'w': 'close-tab',
            'r': 'reload',
            'l': 'focus-url',
            's': 'cmd-s',
            'f': 'find',
            'e': 'open-editor',
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
      currentBrowserView.setAutoResize({ width: true, height: true, horizontal: 'none', vertical: 'none' });
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
            currentBrowserView = null;
          }
          try {
            if (!mainWindow.isDestroyed()) {
              mainWindow.removeBrowserView(view);
            }
          } catch (err) {
            console.warn('removeBrowserView failed:', err);
          }
          try {
            if (!view.webContents.isDestroyed()) {
              view.webContents.removeAllListeners();
              setImmediate(() => {
                if (!view.webContents.isDestroyed()) {
                  view.webContents.destroy();
                }
              });
            }
          } catch (err) {
            console.warn('destroy webContents failed:', err);
          }
          browserViews.delete(key);
          viewLastAccess.delete(key);
        }
      } else {
        if (currentBrowserView) {
          const view = currentBrowserView;
          currentBrowserView = null;
          try {
            if (!mainWindow.isDestroyed()) {
              mainWindow.removeBrowserView(view);
            }
          } catch (err) {
            console.warn('removeBrowserView failed:', err);
          }
          try {
            if (!view.webContents.isDestroyed()) {
              view.webContents.removeAllListeners();
              setImmediate(() => {
                if (!view.webContents.isDestroyed()) {
                  view.webContents.destroy();
                }
              });
            }
          } catch (err) {
            console.warn('destroy failed:', err);
          }
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-update-bounds', (event, bounds) => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        currentBrowserView.setBounds(bounds);
        return { success: true };
      } catch (err) {
        console.warn('setBounds failed:', err);
        return { success: false };
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-hide', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        currentBrowserView.setBounds({ x: -9999, y: -9999, width: 0, height: 0 });
        return { success: true };
      } catch (err) {
        console.warn('hide failed:', err);
        return { success: false };
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-show', (event, bounds) => {
    if (currentBrowserView && bounds && !currentBrowserView.webContents.isDestroyed()) {
      try {
        currentBrowserView.setBounds(bounds);
        return { success: true };
      } catch (err) {
        console.warn('show failed:', err);
        return { success: false };
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-reload', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        currentBrowserView.webContents.reload();
        return { success: true };
      } catch (err) {
        console.warn('reload failed:', err);
        return { success: false };
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-go-back', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        if (currentBrowserView.webContents.canGoBack()) {
          currentBrowserView.webContents.goBack();
          return { success: true };
        }
      } catch (err) {
        console.warn('goBack failed:', err);
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-go-forward', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        if (currentBrowserView.webContents.canGoForward()) {
          currentBrowserView.webContents.goForward();
          return { success: true };
        }
      } catch (err) {
        console.warn('goForward failed:', err);
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-devtools', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        if (currentBrowserView.webContents.isDevToolsOpened()) {
          currentBrowserView.webContents.closeDevTools();
        } else {
          currentBrowserView.webContents.openDevTools();
        }
        return { success: true };
      } catch (err) {
        console.warn('devtools toggle failed:', err);
        return { success: false };
      }
    }
    return { success: false };
  });

  ipcMain.handle('browser-view-is-devtools-opened', () => {
    if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
      try {
        return { isOpened: currentBrowserView.webContents.isDevToolsOpened() };
      } catch (err) {
        console.warn('isDevToolsOpened failed:', err);
      }
    }
    return { isOpened: false };
  });

  ipcMain.handle('capture-screenshot', async () => {
    if (!currentBrowserView || !mainWindow || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    
    try {
      const session = currentBrowserView.webContents.session;
      session.clearCache();
      session.clearStorageData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-hard-reload', async () => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    
    try {
      const session = currentBrowserView.webContents.session;
      await session.clearCache();
      currentBrowserView.webContents.reloadIgnoringCache();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-clear-storage', async () => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    
    try {
      const session = currentBrowserView.webContents.session;
      await session.clearStorageData({
        storages: ['localstorage', 'cookies', 'sessionstorage']
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-set-cache-disabled', async (event, disabled) => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    
    try {
      const session = currentBrowserView.webContents.session;
      await session.setCacheEnabled(!disabled);
      return { success: true, disabled };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-can-go-back', () => {
    if (!currentBrowserView || !currentBrowserView.webContents || currentBrowserView.webContents.isDestroyed()) {
      return { canGoBack: false };
    }
    try {
      return { canGoBack: currentBrowserView.webContents.canGoBack() };
    } catch {
      return { canGoBack: false };
    }
  });

  ipcMain.handle('browser-view-can-go-forward', () => {
    if (!currentBrowserView || !currentBrowserView.webContents || currentBrowserView.webContents.isDestroyed()) {
      return { canGoForward: false };
    }
    try {
      return { canGoForward: currentBrowserView.webContents.canGoForward() };
    } catch {
      return { canGoForward: false };
    }
  });

  ipcMain.handle('browser-view-copy', () => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    try {
      currentBrowserView.webContents.selectAll();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-save-as', async () => {
    if (!currentBrowserView || !mainWindow || currentBrowserView.webContents.isDestroyed()) {
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
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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

  ipcMain.handle('browser-view-open-network-panel', () => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
      return { success: false, error: 'BrowserView not found' };
    }
    try {
      if (currentBrowserView.webContents.isDevToolsOpened()) {
        currentBrowserView.webContents.devToolsWebContents.executeJavaScript(`
          DevToolsAPI.showPanel('network');
        `).catch(() => {});
      } else {
        currentBrowserView.webContents.openDevTools({ mode: 'right', activate: true });
        setTimeout(() => {
          if (currentBrowserView && !currentBrowserView.webContents.isDestroyed()) {
            currentBrowserView.webContents.devToolsWebContents.executeJavaScript(`
              DevToolsAPI.showPanel('network');
            `).catch(() => {});
          }
        }, 500);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser-view-get-page-info', async () => {
    if (!currentBrowserView || currentBrowserView.webContents.isDestroyed()) {
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
        url: currentBrowserView && !currentBrowserView.webContents.isDestroyed() ? currentBrowserView.webContents.getURL() || '' : '',
        title: '',
        encoding: '未知'
      };
    }
  });
}

module.exports = { 
  registerBrowserHandlers,
  setMainWindow,
  getCurrentBrowserView,
  getBrowserViews,
  cleanupBrowserViews
};

