import { getDb } from '../database.js';
import { alertEngine } from './alert-engine.js';

const SKINPORT_ITEMS_URL = 'https://api.skinport.com/v1/items';
const SKINPORT_SALES_URL = 'https://api.skinport.com/v1/sales/history';

export class SkinportService {
  constructor() {
    this.isSyncing = false;
    this.lastSync = 0;
  }

  async syncPrices(currency = 'EUR') {
    if (this.isSyncing) return { status: 'in_progress' };
    this.isSyncing = true;

    try {
      console.log(`[SkinportService] Fetching live prices in ${currency}...`);
      const url = `${SKINPORT_ITEMS_URL}?app_id=730&currency=${encodeURIComponent(currency)}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Encoding': 'br, gzip, deflate',
          'User-Agent': 'CS2-Market-Analyzer/1.0'
        }
      });

      if (!res.ok) {
        throw new Error(`Skinport API returned status ${res.status}`);
      }

      const items = await res.json();
      if (!Array.isArray(items)) {
        throw new Error('Invalid response structure from Skinport');
      }

      console.log(`[SkinportService] Received ${items.length} items. Updating database...`);
      const db = getDb();
      const now = Date.now();
      const detectedDrops = [];
      let updatedCount = 0;

      for (const item of items) {
        const marketHashName = item.market_hash_name;
        const currentPrice = item.suggested_price || item.min_price || item.mean_price;
        if (!currentPrice || currentPrice <= 0) continue;

        const priceKey = `${marketHashName}__skinport`;
        const oldEntry = db.prices.get(priceKey);

        if (oldEntry && oldEntry.price && oldEntry.price > 0) {
          const dropPercent = ((oldEntry.price - currentPrice) / oldEntry.price) * 100;
          if (dropPercent >= 10) {
            const skinInfo = db.skins.find(s => s.market_hash_name === marketHashName) || { name: marketHashName, image: '' };
            detectedDrops.push({
              market_hash_name: marketHashName,
              skin_name: skinInfo.name,
              skin_image: skinInfo.image,
              old_price: oldEntry.price,
              new_price: currentPrice,
              drop_percent: Math.round(dropPercent * 10) / 10,
              source: 'skinport',
              timestamp: now
            });
          }
        }

        db.prices.set(priceKey, {
          market_hash_name: marketHashName,
          source: 'skinport',
          price: currentPrice,
          currency,
          volume: item.quantity || 0,
          lowest_price: item.min_price || currentPrice,
          median_price: item.median_price || currentPrice,
          updated_at: now
        });

        // Add history point
        if (!db.priceHistory.has(marketHashName)) {
          db.priceHistory.set(marketHashName, []);
        }
        const hist = db.priceHistory.get(marketHashName);
        hist.push({
          source: 'skinport',
          price: currentPrice,
          currency,
          volume: item.quantity || 0,
          timestamp: now
        });
        if (hist.length > 50) hist.shift(); // Keep last 50 points

        updatedCount++;
      }

      db.save('prices');
      db.save('history');
      this.lastSync = now;
      console.log(`[SkinportService] Successfully updated ${updatedCount} prices.`);

      if (detectedDrops.length > 0) {
        alertEngine.recordDrops(detectedDrops);
      }

      return { status: 'success', count: updatedCount, dropsDetected: detectedDrops.length };
    } catch (err) {
      console.error('[SkinportService] Error syncing prices:', err);
      return { status: 'error', message: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  async getSalesHistory(marketHashName, currency = 'EUR') {
    try {
      const url = `${SKINPORT_SALES_URL}?app_id=730&currency=${encodeURIComponent(currency)}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Encoding': 'br, gzip, deflate',
          'User-Agent': 'CS2-Market-Analyzer/1.0'
        }
      });
      if (!res.ok) return null;
      const sales = await res.json();
      if (!Array.isArray(sales)) return null;

      return sales.find(s => s.market_hash_name === marketHashName) || null;
    } catch (err) {
      console.warn(`[SkinportService] Failed to fetch sales history:`, err.message);
      return null;
    }
  }

  /**
   * Test connection: checks authenticated account or validates public feed connectivity
   */
  async testConnection(clientId, clientSecret) {
    const startTime = Date.now();

    if (clientId === 'DEMO_KEY' || clientId === 'SKINPORT_DEMO_KEY') {
      return {
        status: 'success',
        isDemo: true,
        pingMs: 32,
        message: 'Connected to Skinport Sandbox (Demo Mode)',
        account: { username: 'SkinportDev', balance: '520.00 EUR' }
      };
    }

    if (clientId && clientSecret) {
      try {
        const authString = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
        const res = await fetch('https://api.skinport.com/v1/account', {
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'CS2-Market-Analyzer/1.0'
          }
        });
        const pingMs = Date.now() - startTime;
        if (res.status === 200) {
          const data = await res.json();
          return {
            status: 'success',
            pingMs,
            message: 'Authenticated with Skinport Developer API (Client ID & Secret valid)',
            account: data
          };
        }
        if (res.status === 401) {
          return {
            status: 'error',
            pingMs,
            message: 'Invalid Client ID or Client Secret (HTTP 401 Unauthorized)'
          };
        }
      } catch (e) {
        // Fall back to test public feed
      }
    }

    // Validate public live items feed
    try {
      const res = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=EUR', {
        headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' }
      });
      const pingMs = Date.now() - startTime;
      if (res.ok) {
        return {
          status: 'success',
          pingMs,
          message: 'Skinport Public Live Market Feed Active (Zero Auth Required)'
        };
      }
      return {
        status: 'error',
        pingMs,
        message: `Skinport responded with HTTP ${res.status}`
      };
    } catch (err) {
      return {
        status: 'error',
        pingMs: Date.now() - startTime,
        message: `Network error: ${err.message}`
      };
    }
  }
}

export const skinportService = new SkinportService();
