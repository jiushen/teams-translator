const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 剪贴板操作
  startClipboardWatch: () => ipcRenderer.invoke('start-clipboard-watch'),
  stopClipboardWatch: () => ipcRenderer.invoke('stop-clipboard-watch'),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  setClipboardText: (text) => ipcRenderer.invoke('set-clipboard-text', text),
  
  // 翻译服务
  translate: (options) => ipcRenderer.invoke('translate', options),
  batchTranslate: (options) => ipcRenderer.invoke('batch-translate', options),
  
  // 历史记录
  getTranslationHistory: (limit, offset) => ipcRenderer.invoke('get-translation-history', limit, offset),
  clearTranslationHistory: () => ipcRenderer.invoke('clear-translation-history'),
  exportHistory: (format, outputPath) => ipcRenderer.invoke('export-history', format, outputPath),
  
  // 统计信息
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  
  // 数据管理
  backupData: (backupPath) => ipcRenderer.invoke('backup-data', backupPath),
  restoreData: (backupPath) => ipcRenderer.invoke('restore-data', backupPath),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  cleanupOldData: (daysToKeep) => ipcRenderer.invoke('cleanup-old-data', daysToKeep),
  
  // 配置操作
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  exportConfig: (config) => ipcRenderer.send('export-config', config),
  
  // 事件监听
  onClipboardChanged: (callback) => {
    ipcRenderer.on('clipboard-changed', (event, text) => callback(text));
  },
  onShowGuide: (callback) => {
    ipcRenderer.on('show-guide', callback);
  },
  onShowModelComparison: (callback) => {
    ipcRenderer.on('show-model-comparison', callback);
  },
  onLoadConfig: (callback) => {
    ipcRenderer.on('load-config', (event, config) => callback(config));
  },
  onRequestConfigExport: (callback) => {
    ipcRenderer.on('request-config-export', callback);
  }
});