/**
 * 项目管理 IPC 处理器
 * 管理项目的存储和读取
 */
const { ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();

function registerProjectHandlers() {
  ipcMain.handle('get-projects', async () => {
    return store.get('projects', []);
  });

  ipcMain.handle('save-projects', async (event, projects) => {
    store.set('projects', projects);
    return { success: true };
  });
}

module.exports = { registerProjectHandlers, store };

