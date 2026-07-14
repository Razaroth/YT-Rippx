const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  download: (params) => ipcRenderer.invoke('download', params),
  getFormats: (url) => ipcRenderer.invoke('get-formats', url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
});
