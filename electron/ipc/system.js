/**
 * 系统相关 IPC 处理器
 * 端口扫描、服务管理、网络信息等
 */
const { ipcMain, BrowserWindow } = require('electron');
const os = require('os');
const { scanPort, scanCommonPorts } = require('../services/port-scanner');
const { startService, stopService, getRunningServices, sendTerminalInput } = require('../services/process-manager');

function registerSystemHandlers() {
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
}

module.exports = { registerSystemHandlers };

