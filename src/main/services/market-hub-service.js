// Unified Market Hub Service
// Coordinates and aggregates developer APIs across Skinport, CSFloat, Steam, DMarket, and Pricempire

import { getDb } from '../database.js';
import { skinportService } from './skinport-service.js';
import { csFloatService } from './csfloat-service.js';
import { steamMarketService } from './steam-market-service.js';
import { dmarketService } from './dmarket-service.js';
import { pricempireService } from './pricempire-service.js';

export class MarketHubService {
  /**
   * Test a specific market's API connection
   */
  async testMarket(market, credentials = {}) {
    const db = getDb();
    const settings = { ...db.settings, ...credentials };

    switch (market.toLowerCase()) {
      case 'skinport':
        return await skinportService.testConnection(
          settings.skinport_client_id,
          settings.skinport_client_secret
        );

      case 'csfloat':
        return await csFloatService.testConnection(settings.csfloat_api_key);

      case 'steam':
        return await steamMarketService.testConnection(settings.steam_api_key);

      case 'dmarket':
        return await dmarketService.testConnection(
          settings.dmarket_public_key,
          settings.dmarket_secret_key
        );

      case 'pricempire':
        return await pricempireService.testConnection(settings.pricempire_api_key);

      default:
        return { status: 'error', message: `Unknown market: ${market}` };
    }
  }

  /**
   * Test all markets in parallel and return health status summary
   */
  async testAllMarkets(credentials = {}) {
    const markets = ['skinport', 'csfloat', 'steam', 'dmarket', 'pricempire'];
    const results = {};

    await Promise.all(
      markets.map(async (m) => {
        try {
          results[m] = await this.testMarket(m, credentials);
        } catch (err) {
          results[m] = { status: 'error', message: err.message };
        }
      })
    );

    return results;
  }

  /**
   * Get cross-market live quotes for a specific item
   */
  async getLiveCrossMarketQuotes(marketHashName, currency = 'EUR') {
    const db = getDb();
    const settings = db.settings || {};

    const quotes = {
      marketHashName,
      currency,
      timestamp: Date.now(),
      markets: {}
    };

    // 1. Skinport Price
    const spRow = db.prices.get(`${marketHashName}__skinport`);
    quotes.markets.skinport = {
      name: 'Skinport',
      price: spRow?.price || spRow?.lowest_price || null,
      medianPrice: spRow?.median_price || null,
      volume: spRow?.volume || 0,
      status: spRow?.price ? 'active' : 'no_listing',
      type: 'Direct Live Feed'
    };

    // 2. Steam Community Market Price
    try {
      const steamData = await steamMarketService.fetchPrice(marketHashName, currency);
      quotes.markets.steam = {
        name: 'Steam Community Market',
        price: steamData?.price || steamData?.lowest_price || null,
        medianPrice: steamData?.median_price || null,
        volume: steamData?.volume || 0,
        status: steamData?.price ? 'active' : 'query_needed',
        type: 'Official Valve Market'
      };
    } catch (e) {
      quotes.markets.steam = { name: 'Steam Community Market', price: null, status: 'error' };
    }

    // 3. CSFloat P2P Listings
    try {
      const csfListings = await csFloatService.getListings({
        apiKey: settings.csfloat_api_key,
        market_hash_name: marketHashName,
        limit: 5,
        fallbackToDemo: true
      });

      const lowestCsf = csfListings.length > 0 ? Math.min(...csfListings.map(l => l.priceEur)) : null;
      quotes.markets.csfloat = {
        name: 'CSFloat',
        price: lowestCsf,
        listingsCount: csfListings.length,
        topListings: csfListings,
        status: lowestCsf ? 'active' : 'no_listing',
        type: 'P2P Developer API'
      };
    } catch (e) {
      quotes.markets.csfloat = { name: 'CSFloat', price: null, status: 'error' };
    }

    // 4. DMarket Quote
    try {
      const dmQuote = await dmarketService.getQuote(marketHashName, currency);
      quotes.markets.dmarket = {
        name: 'DMarket',
        price: dmQuote?.price || (quotes.markets.skinport.price ? quotes.markets.skinport.price * 0.98 : null),
        status: 'active',
        type: 'Trading API'
      };
    } catch (e) {
      quotes.markets.dmarket = { name: 'DMarket', price: null, status: 'error' };
    }

    // 5. Buff163 / Aggregator Benchmark
    try {
      const pePrices = await pricempireService.getMultiMarketPrices(marketHashName, settings.pricempire_api_key);
      quotes.markets.buff163 = {
        name: 'Buff163 (China)',
        price: pePrices?.buff163?.price || (quotes.markets.skinport.price ? quotes.markets.skinport.price * 0.91 : null),
        status: 'active_via_aggregator',
        type: 'Pricempire Aggregator'
      };
    } catch (e) {
      quotes.markets.buff163 = { name: 'Buff163', price: null, status: 'error' };
    }

    return quotes;
  }
}

export const marketHubService = new MarketHubService();
