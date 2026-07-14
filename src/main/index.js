const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { downloadYouTube } = require('../services/youtubeService');
const { getDownloadHistory, addToHistory, clearHistory } = require('../services/historyService');
const { getFormats } = require('../services/formatsService');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 780,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    minWidth: 700,
    minHeight: 540,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  // Windows 11 Acrylic material (gracefully degrades on older Windows)
  if (process.platform === 'win32') {
    try { mainWindow.setBackgroundMaterial('acrylic'); } catch (_) {}
  }

  mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('download', async (event, { url, format, quality, outputPath }) => {
  try {
    const onProgress = (percent) => {
      try { event.sender.send('download-progress', percent); } catch (_) {}
    };
    const result = await downloadYouTube(url, format, quality, outputPath, onProgress);
    await addToHistory({
      url,
      format,
      quality,
      filename: result.filename,
      timestamp: new Date(),
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-formats', async (event, url) => {
  try {
    const formats = await getFormats(url);
    return { success: true, data: formats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-history', async () => {
  try {
    const history = await getDownloadHistory();
    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    await clearHistory();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

// Window control handlers (used by custom frameless titlebar)
ipcMain.handle('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
});
ipcMain.handle('window-close', () => { if (mainWindow) mainWindow.close(); });

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About YTRippx',
            message: 'YTRippx',
            detail: 'A YouTube downloader for MP3 and MP4 files',
          });
        },
      },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
