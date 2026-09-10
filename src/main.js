import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getDb } from './main/database.js';
import { registerIpcHandlers } from './main/ipc-handlers.js';
import { catalogService } from './main/services/catalog-service.js';
import { priceScheduler } from './main/services/price-scheduler.js';

if (started) {
  app.quit();
}

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'CS2 Skin Market Analyzer & Trend Engine',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  try {
    getDb();
    console.log('[Main] Database initialized.');
  } catch (dbErr) {
    console.error('[Main] Failed to initialize database:', dbErr);
  }

  registerIpcHandlers();
  createWindow();

  setTimeout(async () => {
    try {
      console.log('[Main] Checking catalog status...');
      await catalogService.syncCatalog(false);
      priceScheduler.start();
    } catch (err) {
      console.warn('[Main] Background sync warning:', err.message);
    }
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  priceScheduler.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
