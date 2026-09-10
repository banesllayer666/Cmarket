import { skinportService } from './skinport-service.js';
import { steamMarketService } from './steam-market-service.js';
import { getDb } from '../database.js';

export class PriceScheduler {
  constructor() {
    this.timer = null;
    this.isRunning = false;
  }

  getIntervalMinutes() {
    const db = getDb();
    const val = db.getSetting('refresh_interval');
    return parseInt(val, 10) || 15;
  }

  getCurrency() {
    const db = getDb();
    const val = db.getSetting('currency');
    return val || 'EUR';
  }

  start() {
    if (this.timer) clearInterval(this.timer);

    const intervalMinutes = this.getIntervalMinutes();
    console.log(`[PriceScheduler] Starting automatic background refresher (every ${intervalMinutes} mins)...`);

    setTimeout(() => this.runSync(), 2500);

    this.timer = setInterval(() => {
      this.runSync();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[PriceScheduler] Stopped.');
  }

  async runSync() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const currency = this.getCurrency();
      console.log(`[PriceScheduler] Running price sync cycle in ${currency}...`);

      await skinportService.syncPrices(currency);

      const db = getDb();
      const portfolioItems = db.portfolio.slice(0, 20);
      for (const item of portfolioItems) {
        if (item.market_hash_name) {
          await steamMarketService.fetchItemPrice(item.market_hash_name, currency);
        }
      }

      console.log('[PriceScheduler] Sync cycle finished.');
    } catch (err) {
      console.error('[PriceScheduler] Error during scheduled sync:', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const priceScheduler = new PriceScheduler();
