import { getDb } from '../database.js';

export class SteamInventoryService {
  extractSteamId(input) {
    if (!input) return null;
    const clean = input.trim();
    if (/^\d{17}$/.test(clean)) {
      return clean;
    }
    const profileMatch = clean.match(/profiles\/(\d{17})/);
    if (profileMatch) return profileMatch[1];

    const vanityMatch = clean.match(/id\/([a-zA-Z0-9_-]+)/);
    if (vanityMatch) return vanityMatch[1];

    return clean;
  }

  async fetchSteamInventory(steamId) {
    const cleanId = this.extractSteamId(steamId);
    if (!cleanId) {
      throw new Error('Invalid Steam ID or profile URL provided');
    }

    const url = `https://steamcommunity.com/inventory/${cleanId}/730/2?l=english&count=5000`;
    console.log(`[SteamInventory] Fetching inventory for ${cleanId}...`);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (res.status === 403 || res.status === 401) {
      throw new Error('This Steam inventory is set to Private or Friends Only. Please set your CS2 Inventory to Public in Steam Privacy Settings.');
    }

    if (!res.ok) {
      throw new Error(`Steam inventory request failed with HTTP ${res.status}. Make sure your inventory is set to Public.`);
    }

    const data = await res.json();
    if (!data || !data.descriptions) {
      return [];
    }

    const descriptionsMap = new Map();
    for (const desc of data.descriptions) {
      const key = `${desc.classid}_${desc.instanceid}`;
      descriptionsMap.set(key, desc);
    }

    const parsedItems = [];
    const assets = data.assets || [];

    for (const asset of assets) {
      const key = `${asset.classid}_${asset.instanceid}`;
      const desc = descriptionsMap.get(key);
      if (!desc) continue;

      const marketHashName = desc.market_hash_name || desc.market_name || desc.name;
      const imageUrl = desc.icon_url ? `https://community.akamai.steamstatic.com/economy/image/${desc.icon_url}` : '';

      let rarityName = 'Common';
      let rarityColor = '#b0c3d9';
      let wearName = '';
      let weaponName = '';
      let itemType = '';

      if (desc.tags) {
        const rarityTag = desc.tags.find(t => t.category === 'Rarity');
        if (rarityTag) {
          rarityName = rarityTag.localized_tag_name || rarityTag.name;
          rarityColor = rarityTag.color ? `#${rarityTag.color}` : '#b0c3d9';
        }
        const wearTag = desc.tags.find(t => t.category === 'Exterior');
        if (wearTag) wearName = wearTag.localized_tag_name || wearTag.name;

        const weaponTag = desc.tags.find(t => t.category === 'Weapon');
        if (weaponTag) weaponName = weaponTag.localized_tag_name || weaponTag.name;

        const typeTag = desc.tags.find(t => t.category === 'Type');
        if (typeTag) itemType = typeTag.localized_tag_name || typeTag.name;
      }

      const isStatTrak = marketHashName.includes('StatTrak');

      parsedItems.push({
        asset_id: asset.assetid,
        market_hash_name: marketHashName,
        skin_name: desc.name,
        weapon: weaponName,
        item_type: itemType,
        wear_name: wearName,
        rarity_name: rarityName,
        rarity_color: rarityColor,
        image: imageUrl,
        stattrak: isStatTrak ? 1 : 0
      });
    }

    return parsedItems;
  }

  async importToPortfolio(steamId) {
    const items = await this.fetchSteamInventory(steamId);
    if (!items || items.length === 0) {
      throw new Error('No CS2 items found in this inventory. The inventory may be empty or private.');
    }

    const db = getDb();
    const now = Date.now();
    const existingAssetIds = new Set(db.portfolio.map(i => i.asset_id));

    let inserted = 0;
    for (const item of items) {
      if (existingAssetIds.has(item.asset_id)) continue;
      db.portfolio.unshift({
        id: now + Math.random(),
        ...item,
        buy_price: 0,
        buy_date: new Date().toISOString().split('T')[0],
        float_value: null,
        notes: 'Imported from Steam',
        source: 'steam_import',
        added_at: now
      });
      inserted++;
    }

    db.save('portfolio');
    return { totalFound: items.length, importedCount: inserted };
  }

  // Resolve current price from all sources: skinport first, then steam
  _resolvePrice(db, marketHashName) {
    const sp = db.prices.get(`${marketHashName}__skinport`);
    if (sp && sp.price > 0) return { price: sp.price, source: 'skinport', updated_at: sp.updated_at };

    const st = db.prices.get(`${marketHashName}__steam`);
    if (st && st.price > 0) return { price: st.price, source: 'steam', updated_at: st.updated_at };

    return { price: 0, source: null, updated_at: null };
  }

  // Get price ~24h ago from history
  _get24hAgoPrice(db, marketHashName) {
    const hist = db.priceHistory.get(marketHashName);
    if (!hist || hist.length === 0) return null;

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let best = null;
    for (const point of hist) {
      if (point.timestamp <= cutoff) {
        if (!best || point.timestamp > best.timestamp) best = point;
      }
    }
    // Fall back to oldest available if nothing older than 24h yet
    if (!best && hist.length > 0) best = hist[0];
    return best ? best.price : null;
  }

  getPortfolio() {
    const db = getDb();
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalValue24hAgo = 0;

    const enriched = db.portfolio.map(item => {
      const buyPrice = item.buy_price || 0;
      const { price: currentPrice, source: priceSource } = this._resolvePrice(db, item.market_hash_name);
      const price24hAgo = this._get24hAgoPrice(db, item.market_hash_name);

      const effectivePrice = currentPrice > 0 ? currentPrice : buyPrice;
      const profitLoss = buyPrice > 0 ? (effectivePrice - buyPrice) : 0;
      const profitPercent = buyPrice > 0 ? (profitLoss / buyPrice) * 100 : 0;

      let change24h = null;
      let change24hPercent = null;
      if (price24hAgo && price24hAgo > 0 && effectivePrice > 0) {
        change24h = effectivePrice - price24hAgo;
        change24hPercent = (change24h / price24hAgo) * 100;
      }

      totalInvested += buyPrice;
      totalCurrentValue += effectivePrice;
      totalValue24hAgo += (price24hAgo && price24hAgo > 0) ? price24hAgo : effectivePrice;

      return {
        ...item,
        current_price: Math.round(effectivePrice * 100) / 100,
        price_source: priceSource,
        profit_loss: Math.round(profitLoss * 100) / 100,
        profit_percent: Math.round(profitPercent * 10) / 10,
        change_24h: change24h !== null ? Math.round(change24h * 100) / 100 : null,
        change_24h_percent: change24hPercent !== null ? Math.round(change24hPercent * 10) / 10 : null
      };
    });

    const netProfit = totalCurrentValue - totalInvested;
    const netReturnPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const totalChange24h = totalCurrentValue - totalValue24hAgo;
    const totalChange24hPercent = totalValue24hAgo > 0 ? (totalChange24h / totalValue24hAgo) * 100 : 0;

    return {
      items: enriched,
      summary: {
        totalItems: enriched.length,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netReturnPercent: Math.round(netReturnPercent * 10) / 10,
        totalChange24h: Math.round(totalChange24h * 100) / 100,
        totalChange24hPercent: Math.round(totalChange24hPercent * 10) / 10
      }
    };
  }

  addManualItem(data) {
    const db = getDb();
    const id = Date.now() + Math.random();

    // Build correct market_hash_name: Skinport/Steam uses "Weapon | Skin (Wear)"
    let marketHashName = (data.market_hash_name || data.skin_name || '').trim();
    if (data.wear_name && marketHashName && !marketHashName.includes('(')) {
      marketHashName = `${marketHashName} (${data.wear_name})`;
    }

    db.portfolio.unshift({
      id,
      asset_id: `manual-${Date.now()}`,
      market_hash_name: marketHashName,
      skin_name: data.skin_name || data.market_hash_name,
      weapon: data.weapon || '',
      rarity_name: data.rarity_name || 'Classified',
      rarity_color: data.rarity_color || '#d32ce6',
      wear_name: data.wear_name || 'Field-Tested',
      image: data.image || '',
      buy_price: parseFloat(data.buy_price) || 0,
      buy_date: data.buy_date || new Date().toISOString().split('T')[0],
      float_value: data.float_value ? parseFloat(data.float_value) : null,
      stattrak: data.stattrak ? 1 : 0,
      notes: data.notes || '',
      source: 'manual',
      added_at: Date.now()
    });

    db.save('portfolio');
    return { success: true, id };
  }

  removeItem(id) {
    const db = getDb();
    db.portfolio = db.portfolio.filter(p => p.id !== id);
    db.save('portfolio');
    return { success: true };
  }

  // Snapshot current prices into history for 24h tracking
  refreshPortfolioPrices(currency = 'EUR') {
    const db = getDb();
    if (db.portfolio.length === 0) return { snapshotted: 0 };

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    let snapshotted = 0;

    for (const item of db.portfolio) {
      const { price, source } = this._resolvePrice(db, item.market_hash_name);
      if (price <= 0) continue;

      if (!db.priceHistory.has(item.market_hash_name)) {
        db.priceHistory.set(item.market_hash_name, []);
      }
      const hist = db.priceHistory.get(item.market_hash_name);
      const lastEntry = hist[hist.length - 1];

      if (!lastEntry || now - lastEntry.timestamp > ONE_HOUR) {
        hist.push({ source: source || 'portfolio', price, currency, timestamp: now });
        if (hist.length > 100) hist.shift();
        snapshotted++;
      }
    }

    db.save('history');
    return { snapshotted };
  }
}

export const steamInventoryService = new SteamInventoryService();