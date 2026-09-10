import { ipcMain } from 'electron';
import { getDb } from './database.js';
import { catalogService } from './services/catalog-service.js';
import { skinportService } from './services/skinport-service.js';
import { steamMarketService } from './services/steam-market-service.js';
import { analysisEngine } from './services/analysis-engine.js';
import { steamInventoryService } from './services/steam-inventory-service.js';
import { alertEngine } from './services/alert-engine.js';
import { priceScheduler } from './services/price-scheduler.js';

export function registerIpcHandlers() {
  // Catalog
  ipcMain.handle('catalog:sync', async (_, force) => {
    return await catalogService.syncCatalog(force);
  });

  ipcMain.handle('catalog:getSkins', async (_, params) => {
    return catalogService.getSkins(params);
  });

  ipcMain.handle('catalog:getSkinById', async (_, id) => {
    return catalogService.getSkinById(id);
  });

  ipcMain.handle('catalog:getFilters', async () => {
    return catalogService.getFilterOptions();
  });

  // Live Market & Prices
  ipcMain.handle('market:syncPrices', async (_, currency) => {
    const activeCurrency = currency || priceScheduler.getCurrency();
    return await skinportService.syncPrices(activeCurrency);
  });

  ipcMain.handle('market:fetchSteamPrice', async (_, { marketHashName, currency }) => {
    const activeCurrency = currency || priceScheduler.getCurrency();
    return await steamMarketService.fetchItemPrice(marketHashName, activeCurrency);
  });

  // Analysis & Signals
  ipcMain.handle('analysis:analyzeSkin', async (_, { marketHashName, currency }) => {
    const activeCurrency = currency || priceScheduler.getCurrency();
    return await analysisEngine.analyzeSkin(marketHashName, activeCurrency);
  });

  // Portfolio
  ipcMain.handle('portfolio:get', async () => {
    return steamInventoryService.getPortfolio();
  });

  ipcMain.handle('portfolio:importSteam', async (_, steamId) => {
    return await steamInventoryService.importToPortfolio(steamId);
  });

  ipcMain.handle('portfolio:addManual', async (_, data) => {
    return steamInventoryService.addManualItem(data);
  });

  ipcMain.handle('portfolio:remove', async (_, id) => {
    return steamInventoryService.removeItem(id);
  });

  // Alerts
  ipcMain.handle('alerts:get', async (_, limit) => {
    return alertEngine.getAlerts(limit);
  });

  ipcMain.handle('alerts:markRead', async () => {
    return alertEngine.markAllAsRead();
  });

  ipcMain.handle('alerts:clear', async () => {
    return alertEngine.clearAlerts();
  });

  // Settings
  ipcMain.handle('settings:getAll', async () => {
    const db = getDb();
    return db.getAllSettings();
  });

  ipcMain.handle('settings:set', async (_, { key, value }) => {
    const db = getDb();
    db.setSetting(key, String(value));
    if (key === 'drop_alert_threshold') {
      alertEngine.setThreshold(value);
    }
    if (key === 'refresh_interval') {
      priceScheduler.start();
    }
    return { success: true };
  });

  // System Stats
  ipcMain.handle('app:getStats', async () => {
    const db = getDb();
    return {
      skinsCount: db.skins.length,
      pricesCount: db.prices.size,
      alertsCount: db.alerts.length,
      unreadAlerts: alertEngine.getUnreadCount(),
      portfolioCount: db.portfolio.length,
      currency: priceScheduler.getCurrency()
    };
  });
}
