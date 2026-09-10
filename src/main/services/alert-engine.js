import { getDb } from '../database.js';
import { Notification, BrowserWindow } from 'electron';

export class AlertEngine {
  constructor() {
    this.cachedThreshold = null;
  }

  getThreshold() {
    const db = getDb();
    const val = db.getSetting('drop_alert_threshold');
    return parseFloat(val) || 10;
  }

  setThreshold(percent) {
    const val = parseFloat(percent) || 10;
    const db = getDb();
    db.setSetting('drop_alert_threshold', String(val));
  }

  recordDrops(drops) {
    if (!drops || drops.length === 0) return;
    const db = getDb();
    const threshold = this.getThreshold();

    const eligibleDrops = drops.filter(d => d.drop_percent >= threshold);
    if (eligibleDrops.length === 0) return;

    for (const drop of eligibleDrops) {
      db.alerts.unshift({
        id: Date.now() + Math.random(),
        market_hash_name: drop.market_hash_name,
        skin_name: drop.skin_name,
        skin_image: drop.skin_image,
        old_price: drop.old_price,
        new_price: drop.new_price,
        drop_percent: drop.drop_percent,
        source: drop.source,
        alert_type: 'price_drop',
        timestamp: drop.timestamp,
        is_read: 0
      });
    }

    if (db.alerts.length > 200) {
      db.alerts = db.alerts.slice(0, 200);
    }
    db.save('alerts');

    // Native Desktop Notification
    const biggestDrop = [...eligibleDrops].sort((a, b) => b.drop_percent - a.drop_percent)[0];
    if (Notification.isSupported()) {
      try {
        const notif = new Notification({
          title: `⚠️ Price Crash: -${biggestDrop.drop_percent}%!`,
          body: `${biggestDrop.skin_name || biggestDrop.market_hash_name} dropped from €${biggestDrop.old_price.toFixed(2)} to €${biggestDrop.new_price.toFixed(2)} on ${biggestDrop.source.toUpperCase()}!`,
          silent: false
        });
        notif.show();
      } catch (err) {
        console.warn('[AlertEngine] Notification error:', err.message);
      }
    }

    // Broadcast to renderer windows
    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      if (!win.isDestroyed()) {
        win.webContents.send('alerts:new', eligibleDrops);
      }
    }
  }

  getAlerts(limit = 50) {
    const db = getDb();
    return db.alerts.slice(0, limit);
  }

  getUnreadCount() {
    const db = getDb();
    return db.alerts.filter(a => a.is_read === 0).length;
  }

  markAllAsRead() {
    const db = getDb();
    for (const a of db.alerts) a.is_read = 1;
    db.save('alerts');
    return true;
  }

  clearAlerts() {
    const db = getDb();
    db.alerts = [];
    db.save('alerts');
    return true;
  }
}

export const alertEngine = new AlertEngine();
