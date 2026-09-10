import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Catalog
  syncCatalog: (force) => ipcRenderer.invoke('catalog:sync', force),
  getSkins: (params) => ipcRenderer.invoke('catalog:getSkins', params),
  getSkinById: (id) => ipcRenderer.invoke('catalog:getSkinById', id),
  getFilters: () => ipcRenderer.invoke('catalog:getFilters'),

  // Market & Pricing
  syncPrices: (currency) => ipcRenderer.invoke('market:syncPrices', currency),
  fetchSteamPrice: (params) => ipcRenderer.invoke('market:fetchSteamPrice', params),

  // Analysis
  analyzeSkin: (params) => ipcRenderer.invoke('analysis:analyzeSkin', params),

  // Portfolio
  getPortfolio: () => ipcRenderer.invoke('portfolio:get'),
  importSteamInventory: (steamId) => ipcRenderer.invoke('portfolio:importSteam', steamId),
  addManualPortfolioItem: (data) => ipcRenderer.invoke('portfolio:addManual', data),
  removePortfolioItem: (id) => ipcRenderer.invoke('portfolio:remove', id),

  // Alerts
  getAlerts: (limit) => ipcRenderer.invoke('alerts:get', limit),
  markAlertsRead: () => ipcRenderer.invoke('alerts:markRead'),
  clearAlerts: () => ipcRenderer.invoke('alerts:clear'),
  onNewAlerts: (callback) => {
    const subscription = (_, value) => callback(value);
    ipcRenderer.on('alerts:new', subscription);
    return () => ipcRenderer.removeListener('alerts:new', subscription);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),

  // Stats
  getStats: () => ipcRenderer.invoke('app:getStats')
});
