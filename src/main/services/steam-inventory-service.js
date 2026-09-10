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
      throw new Error(`Steam inventory request failed with HTTP ${res.status}`);
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
      if (desc.tags) {
        const rarityTag = desc.tags.find(t => t.category === 'Rarity');
        if (rarityTag) {
          rarityName = rarityTag.localized_tag_name || rarityTag.name;
          rarityColor = `#${rarityTag.color}`;
        }
      }

      let wearName = '';
      if (desc.tags) {
        const wearTag = desc.tags.find(t => t.category === 'Exterior');
        if (wearTag) wearName = wearTag.localized_tag_name || wearTag.name;
      }

      let weaponName = '';
      if (desc.tags) {
        const weaponTag = desc.tags.find(t => t.category === 'Weapon');
        if (weaponTag) weaponName = weaponTag.localized_tag_name || weaponTag.name;
      }

      const isStatTrak = marketHashName.includes('StatTrak™');

      parsedItems.push({
        asset_id: asset.assetid,
        market_hash_name: marketHashName,
        skin_name: desc.name,
        weapon: weaponName,
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
    if (!items || items.length === 0) return { count: 0 };

    const db = getDb();
    const now = Date.now();
    const existingIds = new Set(db.portfolio.map(i => i.asset_id));

    let inserted = 0;
    for (const item of items) {
      if (existingIds.has(item.asset_id)) continue;
      db.portfolio.unshift({
        id: Date.now() + Math.random(),
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

  getPortfolio() {
    const db = getDb();
    let totalInvested = 0;
    let totalCurrentValue = 0;

    const enriched = db.portfolio.map(item => {
      const priceKey = `${item.market_hash_name}__skinport`;
      const p = db.prices.get(priceKey);

      const buyPrice = item.buy_price || 0;
      const currentPrice = p?.price || p?.lowest_price || buyPrice;
      const profitLoss = currentPrice - buyPrice;
      const profitPercent = buyPrice > 0 ? (profitLoss / buyPrice) * 100 : 0;

      totalInvested += buyPrice;
      totalCurrentValue += currentPrice;

      return {
        ...item,
        current_price: Math.round(currentPrice * 100) / 100,
        profit_loss: Math.round(profitLoss * 100) / 100,
        profit_percent: Math.round(profitPercent * 10) / 10
      };
    });

    const netProfit = totalCurrentValue - totalInvested;
    const netReturnPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    return {
      items: enriched,
      summary: {
        totalItems: enriched.length,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netReturnPercent: Math.round(netReturnPercent * 10) / 10
      }
    };
  }

  addManualItem(data) {
    const db = getDb();
    const id = Date.now() + Math.random();

    db.portfolio.unshift({
      id,
      asset_id: `manual-${Date.now()}`,
      market_hash_name: data.market_hash_name,
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
}

export const steamInventoryService = new SteamInventoryService();
