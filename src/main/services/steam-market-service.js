import { getDb } from '../database.js';
import { alertEngine } from './alert-engine.js';

export class SteamMarketService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minIntervalMs = 1500;
  }

  getCurrencyId(code = 'EUR') {
    switch (code.toUpperCase()) {
      case 'EUR': return 3;
      case 'USD': return 1;
      case 'GBP': return 2;
      case 'BRL': return 7;
      default: return 3;
    }
  }

  parseSteamPrice(str) {
    if (!str || typeof str !== 'string') return 0;
    const cleaned = str
      .replace(/[^0-9.,]/g, '')
      .replace(',', '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      const decimals = parts.pop();
      return parseFloat(parts.join('') + '.' + decimals) || 0;
    }
    return parseFloat(cleaned) || 0;
  }

  async fetchItemPrice(marketHashName, currencyCode = 'EUR') {
    const currencyId = this.getCurrencyId(currencyCode);

    return new Promise((resolve) => {
      this.queue.push({
        marketHashName,
        currencyCode,
        currencyId,
        resolve
      });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      const elapsed = Date.now() - this.lastRequestTime;
      if (elapsed < this.minIntervalMs) {
        await new Promise(r => setTimeout(r, this.minIntervalMs - elapsed));
      }

      try {
        const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=${item.currencyId}&market_hash_name=${encodeURIComponent(item.marketHashName)}`;
        this.lastRequestTime = Date.now();

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://steamcommunity.com/market/'
          }
        });

        if (!res.ok) {
          console.warn(`[SteamMarket] Error status ${res.status} for ${item.marketHashName}`);
          item.resolve({ status: 'error', code: res.status });
          continue;
        }

        const data = await res.json();
        if (!data || !data.success) {
          item.resolve({ status: 'not_found' });
          continue;
        }

        const lowest = this.parseSteamPrice(data.lowest_price);
        const median = this.parseSteamPrice(data.median_price);
        const volume = parseInt((data.volume || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const currentPrice = lowest > 0 ? lowest : median;

        const db = getDb();
        const now = Date.now();
        const priceKey = `${item.marketHashName}__steam`;

        const oldEntry = db.prices.get(priceKey);
        if (oldEntry && oldEntry.price && currentPrice > 0) {
          const dropPercent = ((oldEntry.price - currentPrice) / oldEntry.price) * 100;
          if (dropPercent >= 10) {
            const skinInfo = db.skins.find(s => s.market_hash_name === item.marketHashName) || { name: item.marketHashName, image: '' };
            alertEngine.recordDrops([{
              market_hash_name: item.marketHashName,
              skin_name: skinInfo.name,
              skin_image: skinInfo.image,
              old_price: oldEntry.price,
              new_price: currentPrice,
              drop_percent: Math.round(dropPercent * 10) / 10,
              source: 'steam',
              timestamp: now
            }]);
          }
        }

        db.prices.set(priceKey, {
          market_hash_name: item.marketHashName,
          source: 'steam',
          price: currentPrice,
          currency: item.currencyCode,
          volume,
          lowest_price: lowest,
          median_price: median,
          updated_at: now
        });

        if (!db.priceHistory.has(item.marketHashName)) {
          db.priceHistory.set(item.marketHashName, []);
        }
        const hist = db.priceHistory.get(item.marketHashName);
        hist.push({
          source: 'steam',
          price: currentPrice,
          currency: item.currencyCode,
          volume,
          timestamp: now
        });
        if (hist.length > 50) hist.shift();

        db.save('prices');
        db.save('history');

        item.resolve({
          status: 'success',
          price: currentPrice,
          lowest_price: lowest,
          median_price: median,
          volume,
          currency: item.currencyCode,
          source: 'steam'
        });
      } catch (err) {
        console.error(`[SteamMarket] Fetch exception for ${item.marketHashName}:`, err.message);
        item.resolve({ status: 'error', message: err.message });
      }
    }

    this.isProcessing = false;
  }
}

export const steamMarketService = new SteamMarketService();
