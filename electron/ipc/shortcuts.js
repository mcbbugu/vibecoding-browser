/**
 * 全局快捷键管理
 */
const { globalShortcut } = require('electron');

// 快捷键配置
const SHORTCUTS = [
  { accelerator: 'CommandOrControl+T', action: 'search' },
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

function registerGlobalShortcuts(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isFocused()) {
    return;
  }

  globalShortcut.unregisterAll();

  SHORTCUTS.forEach(({ accelerator, action }) => {
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

module.exports = { 
  registerGlobalShortcuts, 
  unregisterGlobalShortcuts,
  SHORTCUTS 
};

