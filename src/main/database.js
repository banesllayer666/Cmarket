import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

class JsonDatabase {
  constructor() {
    this.dataDir = null;
    this.skins = [];
    this.prices = new Map(); // key: `${market_hash_name}__${source}`
    this.priceHistory = new Map(); // key: market_hash_name -> array of points
    this.portfolio = [];
    this.alerts = [];
    this.settings = {
      currency: 'EUR',
      refresh_interval: '15',
      drop_alert_threshold: '10',
      sound_alerts: 'true',
      desktop_notifications: 'true',
      steam_api_key: '',
      skinport_client_id: '',
      csfloat_api_key: '',
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    const userDataPath = app ? app.getPath('userData') : process.cwd();
    this.dataDir = path.join(userDataPath, 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadAll();
    this.initialized = true;
  }

  getFilePath(name) {
    return path.join(this.dataDir, `${name}.json`);
  }

  loadAll() {
    try {
      const skinsFile = this.getFilePath('skins');
      if (fs.existsSync(skinsFile)) {
        this.skins = JSON.parse(fs.readFileSync(skinsFile, 'utf8'));
      }

      const pricesFile = this.getFilePath('prices');
      if (fs.existsSync(pricesFile)) {
        const raw = JSON.parse(fs.readFileSync(pricesFile, 'utf8'));
        this.prices = new Map(Object.entries(raw));
      }

      const historyFile = this.getFilePath('history');
      if (fs.existsSync(historyFile)) {
        const raw = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.priceHistory = new Map(Object.entries(raw));
      }

      const portfolioFile = this.getFilePath('portfolio');
      if (fs.existsSync(portfolioFile)) {
        this.portfolio = JSON.parse(fs.readFileSync(portfolioFile, 'utf8'));
      }

      const alertsFile = this.getFilePath('alerts');
      if (fs.existsSync(alertsFile)) {
        this.alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
      }

      const settingsFile = this.getFilePath('settings');
      if (fs.existsSync(settingsFile)) {
        const raw = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        this.settings = { ...this.settings, ...raw };
      }
    } catch (err) {
      console.warn('[Database] Warning loading store files:', err.message);
    }
  }

  save(name) {
    try {
      if (!this.dataDir) return;
      const filePath = this.getFilePath(name);

      let dataToSave = null;
      if (name === 'skins') dataToSave = this.skins;
      else if (name === 'prices') dataToSave = Object.fromEntries(this.prices);
      else if (name === 'history') dataToSave = Object.fromEntries(this.priceHistory);
      else if (name === 'portfolio') dataToSave = this.portfolio;
      else if (name === 'alerts') dataToSave = this.alerts;
      else if (name === 'settings') dataToSave = this.settings;

      if (dataToSave !== null) {
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
      }
    } catch (err) {
      console.error(`[Database] Error saving ${name}:`, err.message);
    }
  }

  // Settings
  getSetting(key) {
    return this.settings[key];
  }

  getAllSettings() {
    return { ...this.settings };
  }

  setSetting(key, value) {
    this.settings[key] = value;
    this.save('settings');
  }
}

export const dbStore = new JsonDatabase();

export function getDb() {
  dbStore.init();
  return dbStore;
}
