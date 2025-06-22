const { app, BrowserWindow, ipcMain, clipboard, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 在文件顶部添加服务导入
const TranslatorService = require('./services/translator');
const StorageService = require('./services/storage');

let mainWindow;
let clipboardWatcher;
let lastClipboardContent = '';
let isWatchingClipboard = false;

// 创建服务实例
const translator = new TranslatorService();
const storage = new StorageService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('renderer/index.html');

  // 创建菜单
  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopClipboardWatcher();
  });
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入配置',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'JSON', extensions: ['json'] }]
            }).then(result => {
              if (!result.canceled) {
                const config = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
                mainWindow.webContents.send('load-config', config);
              }
            });
          }
        },
        {
          label: '导出配置',
          click: () => {
            mainWindow.webContents.send('request-config-export');
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用说明',
          click: () => {
            mainWindow.webContents.send('show-guide');
          }
        },
        {
          label: '模型对比',
          click: () => {
            mainWindow.webContents.send('show-model-comparison');
          }
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'Teams翻译助手 v2.1',
              detail: '支持剪贴板监听的跨平台翻译工具\n\n功能特性：\n• 剪贴板自动翻译\n• 多种AI模型支持\n• 自定义术语词典\n• 批量翻译功能',
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 剪贴板监听
function startClipboardWatcher() {
  if (isWatchingClipboard) return;
  
  isWatchingClipboard = true;
  lastClipboardContent = clipboard.readText(); // 初始化当前剪贴板内容
  
  clipboardWatcher = setInterval(() => {
    const currentContent = clipboard.readText();
    
    if (currentContent && 
        currentContent !== lastClipboardContent && 
        currentContent.trim().length > 1) {
      
      // 过滤敏感信息
      if (!currentContent.startsWith('sk-') && 
          !currentContent.startsWith('api') &&
          !currentContent.startsWith('Bearer ')) {
        
        console.log('剪贴板内容变化:', {
          old: lastClipboardContent.substring(0, 50),
          new: currentContent.substring(0, 50)
        });
        
        lastClipboardContent = currentContent;
        mainWindow.webContents.send('clipboard-changed', currentContent);
      }
    }
  }, 1000);
}

function stopClipboardWatcher() {
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
    clipboardWatcher = null;
    isWatchingClipboard = false;
  }
}

// 基础IPC通信处理
ipcMain.handle('start-clipboard-watch', () => {
  startClipboardWatcher();
  return true;
});

ipcMain.handle('stop-clipboard-watch', () => {
  stopClipboardWatcher();
  return true;
});

ipcMain.handle('get-clipboard-text', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard-text', (event, text) => {
  clipboard.writeText(text);
  // 立即更新最后的剪贴板内容，避免循环
  lastClipboardContent = text;
  
  console.log('设置剪贴板内容:', text.substring(0, 50));
  
  // 延迟再次确认，防止时序问题
  setTimeout(() => {
    lastClipboardContent = clipboard.readText();
  }, 500);
  
  return true;
});

// 翻译服务IPC处理器
ipcMain.handle('translate', async (event, options) => {
  try {
    const result = await translator.translate(options);
    
    // 计算成本
    if (result.usage) {
      result.cost = translator.calculateCost(result.usage, options.modelKey);
    }
    
    // 保存到历史
    await storage.addTranslationHistory(result);
    
    // 更新统计
    await storage.updateStatistics(result);
    
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('batch-translate', async (event, options) => {
  try {
    const result = await translator.batchTranslate(options);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 历史记录IPC处理器
ipcMain.handle('get-translation-history', async (event, limit, offset) => {
  return await storage.getTranslationHistory(limit, offset);
});

ipcMain.handle('clear-translation-history', async () => {
  return await storage.clearTranslationHistory();
});

ipcMain.handle('export-history', async (event, format, outputPath) => {
  return await storage.exportHistory(format, outputPath);
});

// 统计信息IPC处理器
ipcMain.handle('get-statistics', async () => {
  return await storage.getStatistics();
});

// 数据管理IPC处理器
ipcMain.handle('backup-data', async (event, backupPath) => {
  return await storage.backupData(backupPath);
});

ipcMain.handle('restore-data', async (event, backupPath) => {
  return await storage.restoreData(backupPath);
});

ipcMain.handle('get-storage-info', async () => {
  return await storage.getStorageInfo();
});

ipcMain.handle('cleanup-old-data', async (event, daysToKeep) => {
  return await storage.cleanupOldData(daysToKeep);
});

// 配置存储（使用新的StorageService）
ipcMain.handle('save-config', async (event, config) => {
  return await storage.saveConfig(config);
});

ipcMain.handle('load-config', async () => {
  return await storage.loadConfig();
});

// 导出配置
ipcMain.on('export-config', (event, config) => {
  dialog.showSaveDialog(mainWindow, {
            defaultPath: 'config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '成功',
        message: '配置已导出',
        buttons: ['确定']
      });
    }
  });
});

// 应用启动
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});