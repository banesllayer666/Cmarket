import { getDb } from '../database.js';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const SKINS_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const STICKERS_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json';
const AGENTS_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json';

export class CatalogService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = 0;
  }

  getCachePath(filename = 'skins_cache.json') {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    return path.join(userDataPath, 'data', filename);
  }

  async syncCatalog(force = false) {
    if (this.isSyncing) return { status: 'in_progress' };

    const db = getDb();
    if (db.skins.length > 0 && !force) {
      return { status: 'ready', count: db.skins.length };
    }

    this.isSyncing = true;
    try {
      console.log('[CatalogService] Fetching skin, sticker, and agent catalogs from ByMykel CSGO-API...');
      let skinsData = null;
      let stickersData = null;
      let agentsData = null;

      const skinsCachePath = this.getCachePath('skins_cache.json');
      const stickersCachePath = this.getCachePath('stickers_cache.json');
      const agentsCachePath = this.getCachePath('agents_cache.json');

      // 1. Fetch or load skins
      try {
        const response = await fetch(SKINS_API_URL, { headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' } });
        if (response.ok) {
          skinsData = await response.json();
          try { fs.writeFileSync(skinsCachePath, JSON.stringify(skinsData)); } catch (err) {}
        }
      } catch (netErr) {
        if (fs.existsSync(skinsCachePath)) {
          skinsData = JSON.parse(fs.readFileSync(skinsCachePath, 'utf8'));
        }
      }

      // 2. Fetch or load stickers
      try {
        const response = await fetch(STICKERS_API_URL, { headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' } });
        if (response.ok) {
          stickersData = await response.json();
          try { fs.writeFileSync(stickersCachePath, JSON.stringify(stickersData)); } catch (err) {}
        }
      } catch (netErr) {
        if (fs.existsSync(stickersCachePath)) {
          stickersData = JSON.parse(fs.readFileSync(stickersCachePath, 'utf8'));
        }
      }

      // 3. Fetch or load agents
      try {
        const response = await fetch(AGENTS_API_URL, { headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' } });
        if (response.ok) {
          agentsData = await response.json();
          try { fs.writeFileSync(agentsCachePath, JSON.stringify(agentsData)); } catch (err) {}
        }
      } catch (netErr) {
        if (fs.existsSync(agentsCachePath)) {
          agentsData = JSON.parse(fs.readFileSync(agentsCachePath, 'utf8'));
        }
      }

      const processed = [];

      // Process weapon skins into wear variants
      if (skinsData && Array.isArray(skinsData)) {
        console.log(`[CatalogService] Processing ${skinsData.length} skins into wear variants...`);
        for (const item of skinsData) {
          const collectionName = item.collections && item.collections.length > 0 ? item.collections[0].name : '';
          const crateName = item.crates && item.crates.length > 0 ? item.crates[0].name : '';
          const availableWears = item.wears && item.wears.length > 0 ? item.wears.map(w => w.name) : [];

          if (availableWears.length > 0) {
            for (const wear of item.wears) {
              const wearName = wear.name;
              const marketHashName = `${item.name} (${wearName})`;
              const wearSlug = wearName.toLowerCase().replace(/[^a-z0-9]/g, '-');

              processed.push({
                id: `${item.id || 'skin'}-${wearSlug}`,
                base_id: item.id || `base-${Math.random().toString(36).substr(2, 9)}`,
                base_name: item.name || 'Unknown Skin',
                name: `${item.name} (${wearName})`,
                display_name: item.name || 'Unknown Skin',
                market_hash_name: marketHashName,
                weapon: item.weapon ? item.weapon.name : '',
                pattern: item.pattern ? item.pattern.name : '',
                category: item.category ? item.category.name : '',
                item_type: 'weapon',
                rarity_id: item.rarity ? item.rarity.id : '',
                rarity_name: item.rarity ? item.rarity.name : 'Common',
                rarity_color: item.rarity ? item.rarity.color : '#b0c3d9',
                wear_name: wearName,
                available_wears: availableWears,
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
          } else {
            processed.push({
              id: item.id || `skin-${Math.random().toString(36).substr(2, 9)}`,
              base_id: item.id || `base-${Math.random().toString(36).substr(2, 9)}`,
              base_name: item.name || 'Unknown Item',
              name: item.name || 'Unknown Item',
              display_name: item.name || 'Unknown Item',
              market_hash_name: item.name,
              weapon: item.weapon ? item.weapon.name : '',
              pattern: item.pattern ? item.pattern.name : '',
              category: item.category ? item.category.name : '',
              item_type: 'weapon',
              rarity_id: item.rarity ? item.rarity.id : '',
              rarity_name: item.rarity ? item.rarity.name : 'Common',
              rarity_color: item.rarity ? item.rarity.color : '#b0c3d9',
              wear_name: 'Standard',
              available_wears: [],
              min_float: 0,
              max_float: 1,
              stattrak: item.stattrak ? 1 : 0,
              souvenir: item.souvenir ? 1 : 0,
              image: item.image || '',
              collection: collectionName,
              crate: crateName,
              description: item.description || '',
              raw_json: JSON.stringify(item)
            });
          }
        }
      }

      // Process stickers
      if (stickersData && Array.isArray(stickersData)) {
        console.log(`[CatalogService] Processing ${stickersData.length} stickers...`);
        for (const item of stickersData) {
          let effect = 'Paper';
          if (item.effect && item.effect !== 'Other') {
            effect = item.effect;
          } else if (item.name.includes('(Holo)')) {
            effect = 'Holo';
          } else if (item.name.includes('(Foil)')) {
            effect = 'Foil';
          } else if (item.name.includes('(Gold)')) {
            effect = 'Gold';
          } else if (item.name.includes('(Glitter)')) {
            effect = 'Glitter';
          } else if (item.name.includes('(Lenticular)')) {
            effect = 'Lenticular';
          }

          const tournamentName = item.tournament ? item.tournament.name : '';

          processed.push({
            id: item.id || `sticker-${Math.random().toString(36).substr(2, 9)}`,
            base_id: item.id,
            base_name: item.name,
            name: item.name,
            display_name: item.name,
            market_hash_name: item.name,
            weapon: 'Sticker',
            pattern: effect,
            category: 'Stickers',
            item_type: 'sticker',
            effect,
            tournament: tournamentName,
            rarity_id: item.rarity ? item.rarity.id : '',
            rarity_name: item.rarity ? item.rarity.name : 'High Grade',
            rarity_color: item.rarity ? item.rarity.color : '#4b69ff',
            wear_name: effect,
            available_wears: [],
            min_float: 0,
            max_float: 1,
            stattrak: 0,
            souvenir: 0,
            image: item.image || '',
            collection: tournamentName || (item.collections && item.collections.length > 0 ? item.collections[0].name : 'Stickers'),
            crate: item.crates && item.crates.length > 0 ? item.crates[0].name : '',
            description: item.description || ''
          });
        }
      }

      // Process player agents
      if (agentsData && Array.isArray(agentsData)) {
        console.log(`[CatalogService] Processing ${agentsData.length} player agents...`);
        for (const item of agentsData) {
          const teamName = item.team ? item.team.name : 'Allies';
          const collectionName = item.collections && item.collections.length > 0 ? item.collections[0].name : '';

          processed.push({
            id: item.id || `agent-${Math.random().toString(36).substr(2, 9)}`,
            base_id: item.id,
            base_name: item.name,
            name: item.name,
            display_name: item.name,
            market_hash_name: item.market_hash_name || item.name,
            weapon: teamName === 'Terrorist' ? 'Terrorist Agent' : 'Counter-Terrorist Agent',
            pattern: teamName,
            category: 'Agents',
            item_type: 'agent',
            team: teamName,
            rarity_id: item.rarity ? item.rarity.id : '',
            rarity_name: item.rarity ? item.rarity.name : 'Master Agent',
            rarity_color: item.rarity ? item.rarity.color : '#eb4b4b',
            wear_name: teamName === 'Terrorist' ? 'T Side' : 'CT Side',
            available_wears: [],
            min_float: 0,
            max_float: 1,
            stattrak: 0,
            souvenir: 0,
            image: item.image || '',
            collection: collectionName,
            crate: '',
            description: item.description || ''
          });
        }
      }

      db.skins = processed;
      db.save('skins');
      this.lastSyncTime = Date.now();
      console.log(`[CatalogService] Catalog sync complete! Total items: ${db.skins.length}`);
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
      wear = '',
      itemType = 'all', // 'all', 'weapons', 'stickers', 'agents'
      stickerEffect = '',
      agentTeam = '',
      stattrak = null,
      page = 1,
      limit = 48,
      sortBy = 'price',
      sortOrder = 'DESC'
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

    // Filter Item Type (Weapons, Stickers, Agents)
    if (itemType === 'weapons') {
      items = items.filter(s => s.item_type === 'weapon' || (!s.item_type && s.category !== 'Stickers' && s.category !== 'Agents'));
    } else if (itemType === 'stickers') {
      items = items.filter(s => s.item_type === 'sticker' || s.category === 'Stickers');
    } else if (itemType === 'agents') {
      items = items.filter(s => s.item_type === 'agent' || s.category === 'Agents');
    }

    // Filter Sticker Effect (Holo, Foil, Gold, Glitter, Paper)
    if (stickerEffect) {
      items = items.filter(s => s.effect === stickerEffect || (s.name && s.name.includes(`(${stickerEffect})`)));
    }

    // Filter Agent Team (Terrorist / Counter-Terrorist)
    if (agentTeam) {
      items = items.filter(s => s.team === agentTeam || (s.weapon && s.weapon.includes(agentTeam)));
    }

    // Filter Search with smart abbreviation resolution (e.g. "redline ft" -> Field-Tested)
    if (search.trim()) {
      const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const abbrevMap = {
        'fn': 'factory new',
        'mw': 'minimal wear',
        'ft': 'field-tested',
        'ww': 'well-worn',
        'bs': 'battle-scarred'
      };

      items = items.filter(s => {
        const searchable = `${s.name} ${s.display_name || ''} ${s.weapon} ${s.pattern || ''} ${s.wear_name || ''} ${s.category || ''} ${s.market_hash_name} ${s.tournament || ''}`.toLowerCase();
        return terms.every(t => {
          if (searchable.includes(t)) return true;
          const mapped = abbrevMap[t];
          if (mapped && (searchable.includes(mapped) || (s.wear_name && s.wear_name.toLowerCase().includes(mapped)))) {
            return true;
          }
          return false;
        });
      });
    }

    // Filter Wear Condition
    if (wear) {
      items = items.filter(s => s.wear_name === wear);
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
        diff = (a.weapon || '').localeCompare(b.weapon || '');
      } else {
        diff = (a.display_name || a.name).localeCompare(b.display_name || b.name);
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
    const skin = db.skins.find(s => s.id === id || s.market_hash_name === id);
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
      if (key.startsWith(copy.market_hash_name) || key.startsWith(copy.base_name || copy.name)) {
        copy.prices.push(p);
      }
    }

    return copy;
  }

  getWearPrices(baseName, isStatTrak = false, currency = 'EUR') {
    const db = getDb();
    const cleanBase = (baseName || '')
      .replace(/\s*\([^)]*\)\s*$/, '') // strip existing (Wear) if passed
      .replace(/^StatTrak™\s+/, '')    // strip StatTrak™ prefix if passed
      .replace(/^★\s+StatTrak™\s+/, '★ ')
      .trim();

    const WEAR_CONFIG = [
      { name: 'Factory New', abbrev: 'FN', minFloat: 0.00, maxFloat: 0.07, color: '#10b981' },
      { name: 'Minimal Wear', abbrev: 'MW', minFloat: 0.07, maxFloat: 0.15, color: '#06b6d4' },
      { name: 'Field-Tested', abbrev: 'FT', minFloat: 0.15, maxFloat: 0.38, color: '#f59e0b' },
      { name: 'Well-Worn', abbrev: 'WW', minFloat: 0.38, maxFloat: 0.45, color: '#f97316' },
      { name: 'Battle-Scarred', abbrev: 'BS', minFloat: 0.45, maxFloat: 1.00, color: '#ef4444' }
    ];

    // Find any skin representation to verify min_float / max_float and available_wears
    const skinSample = db.skins.find(s => s.base_name === cleanBase || s.name.startsWith(cleanBase));
    const minFloat = skinSample ? skinSample.min_float : 0;
    const maxFloat = skinSample ? skinSample.max_float : 1;
    const availableWears = skinSample?.available_wears || [];

    const isKnifeOrGlove = cleanBase.startsWith('★');

    const wearsResult = WEAR_CONFIG.map(w => {
      // Build market hash name
      let hashName = '';
      if (isStatTrak) {
        if (isKnifeOrGlove) {
          hashName = `★ StatTrak™ ${cleanBase.replace(/^★\s*/, '')} (${w.name})`;
        } else {
          hashName = `StatTrak™ ${cleanBase} (${w.name})`;
        }
      } else {
        hashName = `${cleanBase} (${w.name})`;
      }

      // Check float compatibility
      let isAvailable = true;
      let unavailableReason = null;

      if (availableWears.length > 0 && !availableWears.includes(w.name)) {
        isAvailable = false;
        unavailableReason = 'Not in drop pool';
      } else if (w.minFloat >= maxFloat) {
        isAvailable = false;
        unavailableReason = `Max float capped at ${maxFloat.toFixed(2)}`;
      } else if (w.maxFloat <= minFloat) {
        isAvailable = false;
        unavailableReason = `Min float capped at ${minFloat.toFixed(2)}`;
      }

      // Fetch Skinport & Steam prices
      const skinportRow = db.prices.get(`${hashName}__skinport`);
      const steamRow = db.prices.get(`${hashName}__steam`);

      return {
        wearName: w.name,
        abbrev: w.abbrev,
        color: w.color,
        minFloat: w.minFloat,
        maxFloat: w.maxFloat,
        isAvailable,
        unavailableReason,
        marketHashName: hashName,
        skinportPrice: skinportRow?.price || skinportRow?.lowest_price || null,
        skinportMedian: skinportRow?.median_price || null,
        skinportVolume: skinportRow?.volume || 0,
        steamPrice: steamRow?.price || steamRow?.lowest_price || null,
        steamVolume: steamRow?.volume || 0,
        updatedAt: skinportRow?.updated_at || steamRow?.updated_at || null
      };
    });

    return {
      baseName: cleanBase,
      isStatTrak: !!isStatTrak,
      minFloat,
      maxFloat,
      wears: wearsResult
    };
  }

  getFilterOptions() {
    const db = getDb();
    const weaponSet = new Set();
    const rarityMap = new Map();
    const categorySet = new Set();
    const wearSet = new Set([
      'Factory New',
      'Minimal Wear',
      'Field-Tested',
      'Well-Worn',
      'Battle-Scarred'
    ]);

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
    const wears = Array.from(wearSet);
    const stickerEffects = ['Holo', 'Foil', 'Gold', 'Glitter', 'Lenticular', 'Paper'];
    const agentTeams = ['Terrorist', 'Counter-Terrorist'];

    return { weapons, rarities, categories, wears, stickerEffects, agentTeams };
  }
}

export const catalogService = new CatalogService();
