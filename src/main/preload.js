const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  download: (params) => ipcRenderer.invoke('download', params),
  getFormats: (url) => ipcRenderer.invoke('get-formats', url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  onDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.on('download-progress', (_e, percent) => callback(percent));
  },
  removeDownloadProgressListeners: () => ipcRenderer.removeAllListeners('download-progress'),
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close:    () => ipcRenderer.invoke('window-close'),
  },
});
