/**
 * 终端操作 IPC 处理器
 * 在系统终端中打开项目目录
 */
const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const os = require('os');

function registerTerminalHandlers() {
  ipcMain.handle('open-in-terminal', async (event, cwd) => {
    try {
      const platform = os.platform();
      
      if (platform === 'darwin') {
        // macOS: 使用 Terminal.app
        const script = `
          tell application "Terminal"
            do script "cd ${cwd.replace(/"/g, '\\"')}"
            activate
          end tell
        `;
        
        spawn('osascript', ['-e', script], {
          detached: true,
          stdio: 'ignore'
        }).unref();
        
        return { success: true };
      } else if (platform === 'win32') {
        // Windows: 使用 cmd
        spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/K', `cd /d "${cwd}"`], {
          detached: true,
          stdio: 'ignore'
        }).unref();
        
        return { success: true };
      } else {
        // Linux: 尝试常见的终端
        const terminals = ['gnome-terminal', 'konsole', 'xterm'];
        
        for (const terminal of terminals) {
          try {
            spawn(terminal, ['--working-directory', cwd], {
              detached: true,
              stdio: 'ignore'
            }).unref();
            
            return { success: true };
          } catch (err) {
            continue;
          }
        }
        
        return { success: false, error: '未找到可用的终端应用' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerTerminalHandlers };

