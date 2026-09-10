import { getDb } from '../database.js';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const SKINS_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';

export class CatalogService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = 0;
  }

  getCachePath() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    return path.join(userDataPath, 'data', 'skins_cache.json');
  }

  async syncCatalog(force = false) {
    if (this.isSyncing) return { status: 'in_progress' };

    const db = getDb();
    if (db.skins.length > 0 && !force) {
      return { status: 'ready', count: db.skins.length };
    }

    this.isSyncing = true;
    try {
      console.log('[CatalogService] Fetching skin catalog from ByMykel CSGO-API...');
      let skinsData = null;

      const cachePath = this.getCachePath();
      try {
        const response = await fetch(SKINS_API_URL, {
          headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' }
        });
        if (response.ok) {
          skinsData = await response.json();
          try {
            fs.writeFileSync(cachePath, JSON.stringify(skinsData));
          } catch (err) {
            console.warn('[CatalogService] Could not write cache file:', err.message);
          }
        }
      } catch (netErr) {
        console.warn('[CatalogService] Network fetch failed, checking local cache:', netErr.message);
        if (fs.existsSync(cachePath)) {
          skinsData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
      }

      if (!skinsData || !Array.isArray(skinsData)) {
        throw new Error('Unable to retrieve skins catalog data');
      }

      console.log(`[CatalogService] Processing ${skinsData.length} skins...`);
      const processed = [];

      for (const item of skinsData) {
        const defaultWear = item.wears && item.wears.length > 0 ? item.wears[0].name : 'Factory New';
        const defaultMarketHashName = `${item.name} (${defaultWear})`;
        const collectionName = item.collections && item.collections.length > 0 ? item.collections[0].name : '';
        const crateName = item.crates && item.crates.length > 0 ? item.crates[0].name : '';

        processed.push({
          id: item.id || `skin-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || 'Unknown Skin',
          market_hash_name: defaultMarketHashName,
          weapon: item.weapon ? item.weapon.name : '',
          pattern: item.pattern ? item.pattern.name : '',
          category: item.category ? item.category.name : '',
          rarity_id: item.rarity ? item.rarity.id : '',
          rarity_name: item.rarity ? item.rarity.name : 'Common',
          rarity_color: item.rarity ? item.rarity.color : '#b0c3d9',
          wear_name: defaultWear,
          min_float: item.min_float !== undefined ? item.min_float : 0,
          max_float: item.max_float !== undefined ? item.max_float : 1,
          stattrak: item.stattrak ? 1 : 0,
          souvenir: item.souvenir ? 1 : 0,
          image: item.image || '',
          collection: collectionName,
          crate: crateName,
          description: item.description || '',
          raw_json: JSON.stringify(item)
        });
      }

      db.skins = processed;
      db.save('skins');
      this.lastSyncTime = Date.now();
      console.log(`[CatalogService] Catalog sync complete! Total skins: ${db.skins.length}`);
      return { status: 'success', count: db.skins.length };
    } catch (err) {
      console.error('[CatalogService] Catalog sync error:', err);
      return { status: 'error', message: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  getSkins(params = {}) {
    const db = getDb();
    const {
      search = '',
      weapon = '',
      rarity = '',
      category = '',
      stattrak = null,
      page = 1,
      limit = 48,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = params;

    let items = db.skins.map(s => {
      // Find latest price if cached
      const priceKey = `${s.market_hash_name}__skinport`;
      const p = db.prices.get(priceKey);
      return {
        ...s,
        current_price: p?.price || null,
        lowest_price: p?.lowest_price || null,
        median_price: p?.median_price || null,
        volume: p?.volume || 0,
        price_updated_at: p?.updated_at || null
      };
    });

    // Filter Search
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.weapon.toLowerCase().includes(term) ||
        s.pattern.toLowerCase().includes(term)
      );
    }

    // Filter Weapon
    if (weapon) {
      items = items.filter(s => s.weapon === weapon);
    }

    // Filter Rarity
    if (rarity) {
      items = items.filter(s => s.rarity_name === rarity);
    }

    // Filter Category
    if (category) {
      items = items.filter(s => s.category === category);
    }

    // Filter StatTrak
    if (stattrak !== null && stattrak !== undefined && stattrak !== '') {
      const wantSt = stattrak ? 1 : 0;
      items = items.filter(s => s.stattrak === wantSt);
    }

    const total = items.length;

    // Sorting
    const rarityRank = {
      'Contraband': 7,
      'Covert': 6,
      'Classified': 5,
      'Restricted': 4,
      'Mil-Spec Grade': 3,
      'Industrial Grade': 2,
      'Consumer Grade': 1
    };

    items.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'price') {
        const pa = a.current_price || a.lowest_price || 0;
        const pb = b.current_price || b.lowest_price || 0;
        diff = pa - pb;
      } else if (sortBy === 'rarity') {
        const ra = rarityRank[a.rarity_name] || 0;
        const rb = rarityRank[b.rarity_name] || 0;
        diff = ra - rb;
      } else if (sortBy === 'weapon') {
        diff = a.weapon.localeCompare(b.weapon);
      } else {
        diff = a.name.localeCompare(b.name);
      }
      return sortOrder.toUpperCase() === 'DESC' ? -diff : diff;
    });

    // Pagination
    const offset = (Math.max(1, page) - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  getSkinById(id) {
    const db = getDb();
    const skin = db.skins.find(s => s.id === id);
    if (!skin) return null;

    const copy = { ...skin };
    if (copy.raw_json) {
      try {
        copy.details = JSON.parse(copy.raw_json);
      } catch (e) {}
    }

    // Attach prices
    copy.prices = [];
    for (const [key, p] of db.prices.entries()) {
      if (key.startsWith(copy.market_hash_name) || key.startsWith(copy.name)) {
        copy.prices.push(p);
      }
    }

    return copy;
  }

  getFilterOptions() {
    const db = getDb();
    const weaponSet = new Set();
    const rarityMap = new Map();
    const categorySet = new Set();

    for (const s of db.skins) {
      if (s.weapon) weaponSet.add(s.weapon);
      if (s.rarity_name) rarityMap.set(s.rarity_name, s.rarity_color);
      if (s.category) categorySet.add(s.category);
    }

    const weapons = Array.from(weaponSet).sort();
    const rarities = Array.from(rarityMap.entries()).map(([rarity_name, rarity_color]) => ({
      rarity_name,
      rarity_color
    })).sort((a, b) => a.rarity_name.localeCompare(b.rarity_name));
    const categories = Array.from(categorySet).sort();

    return { weapons, rarities, categories };
  }
}

export const catalogService = new CatalogService();
