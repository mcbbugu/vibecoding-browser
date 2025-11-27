/**
 * 编辑器 IPC 处理器
 * 管理外部编辑器的启动
 */
const { ipcMain, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// 编辑器路径映射（macOS）
const EDITOR_PATHS = {
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

// 编辑器应用名称映射
const EDITOR_APP_NAMES = {
  'code': 'Visual Studio Code',
  'cursor': 'Cursor',
  'windsurf': 'Windsurf',
  'subl': 'Sublime Text',
  'atom': 'Atom',
  'webstorm': 'WebStorm'
};

function findEditorCommand(command) {
  if (os.platform() === 'darwin') {
    const paths = EDITOR_PATHS[command];
    if (paths) {
      for (const editorPath of paths) {
        if (fs.existsSync(editorPath)) {
          return editorPath;
        }
      }
    }
  }
  return command;
}

function registerEditorHandlers(mainWindow) {
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
                
                const appName = EDITOR_APP_NAMES[command];
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
                error: `找不到命令 "${command}"。请确保编辑器已安装，并将命令行工具添加到 PATH 中。` 
              });
            } else {
              resolved = true;
              resolve({ success: false, error: error.message });
            }
          });
          
          if (editorProcess.pid) {
            editorProcess.unref();
            
            // macOS: 激活编辑器窗口
            if (os.platform() === 'darwin') {
              const appName = EDITOR_APP_NAMES[command];
              if (appName) {
                setTimeout(() => {
                  spawn('osascript', ['-e', `tell application "${appName}" to activate`], {
                    detached: true,
                    stdio: 'ignore'
                  }).unref();
                }, 500);
              }
            }
            
            resolved = true;
            resolve({ success: true });
          } else {
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                resolve({ success: false, error: 'Failed to start process' });
              }
            }, 100);
          }
        } catch (error) {
          if (resolved) return;
          resolved = true;
          resolve({ success: false, error: error.message });
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
}

module.exports = { registerEditorHandlers };

