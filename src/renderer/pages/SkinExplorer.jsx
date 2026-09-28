import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles, Tag, Users, Crosshair, Grid } from 'lucide-react';
import SkinCard from '../components/SkinCard';
import PatternLabModal from '../components/PatternLabModal';

export default function SkinExplorer({ onSelectSkin, currency = 'EUR' }) {
  const [skins, setSkins] = useState([]);
  const [filters, setFilters] = useState({ weapons: [], rarities: [], categories: [], stickerEffects: [], agentTeams: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Type & Filter States
  const [itemType, setItemType] = useState('weapons'); // 'weapons', 'stickers', 'agents', 'all'
  const [search, setSearch] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWear, setSelectedWear] = useState('');
  const [selectedEffect, setSelectedEffect] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [stattrakOnly, setStattrakOnly] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [isPatternLabOpen, setIsPatternLabOpen] = useState(false);

  // Load filter options once
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await window.electronAPI.getFilters();
        if (res) setFilters(res);
      } catch (e) {
        console.warn('Error loading filter options:', e);
      }
    };
    loadFilters();
  }, []);

  // Load items whenever filters or page change
  useEffect(() => {
    let isMounted = true;
    const fetchSkins = async () => {
      setLoading(true);
      try {
        const res = await window.electronAPI.getSkins({
          itemType,
          search,
          weapon: selectedWeapon,
          rarity: selectedRarity,
          category: selectedCategory,
          wear: selectedWear,
          stickerEffect: selectedEffect,
          agentTeam: selectedTeam,
          stattrak: stattrakOnly === '1' ? true : stattrakOnly === '0' ? false : null,
          sortBy,
          sortOrder,
          page,
          limit: 36
        });

        if (isMounted && res) {
          setSkins(res.items || []);
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to query catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSkins();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [itemType, search, selectedWeapon, selectedRarity, selectedCategory, selectedWear, selectedEffect, selectedTeam, stattrakOnly, sortBy, sortOrder, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedWeapon('');
    setSelectedRarity('');
    setSelectedCategory('');
    setSelectedWear('');
    setSelectedEffect('');
    setSelectedTeam('');
    setStattrakOnly('');
    setPage(1);
  };

  const WEAR_OPTIONS = [
    { label: 'All Wears', value: '' },
    { label: 'Factory New (FN)', value: 'Factory New', color: '#10b981' },
    { label: 'Minimal Wear (MW)', value: 'Minimal Wear', color: '#06b6d4' },
    { label: 'Field-Tested (FT)', value: 'Field-Tested', color: '#f59e0b' },
    { label: 'Well-Worn (WW)', value: 'Well-Worn', color: '#f97316' },
    { label: 'Battle-Scarred (BS)', value: 'Battle-Scarred', color: '#ef4444' }
  ];

  const STICKER_EFFECTS = [
    { label: 'All Effects', value: '' },
    { label: 'Holo', value: 'Holo', color: '#38bdf8' },
    { label: 'Gold', value: 'Gold', color: '#fbbf24' },
    { label: 'Foil', value: 'Foil', color: '#94a3b8' },
    { label: 'Glitter', value: 'Glitter', color: '#c084fc' },
    { label: 'Paper', value: 'Paper', color: '#ded6cc' }
  ];

  const AGENT_TEAMS = [
    { label: 'All Teams', value: '' },
    { label: 'Terrorists (T)', value: 'Terrorist', color: '#fbbf24' },
    { label: 'Counter-Terrorists (CT)', value: 'Counter-Terrorist', color: '#60a5fa' }
  ];

  return (
    <div className="page-body">
      {/* Top Type Selector & Pattern Engine CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Category Tabs */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: '4px' }}>
          <button
            onClick={() => { setItemType('weapons'); setPage(1); }}
            className={`btn ${itemType === 'weapons' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Crosshair size={15} />
            Weapons & Knives
          </button>
          <button
            onClick={() => { setItemType('stickers'); setPage(1); }}
            className={`btn ${itemType === 'stickers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Tag size={15} />
            Stickers ({filters?.stickerEffects?.length ? '11k+' : 'All'})
          </button>
          <button
            onClick={() => { setItemType('agents'); setPage(1); }}
            className={`btn ${itemType === 'agents' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Users size={15} />
            Agents & Characters
          </button>
          <button
            onClick={() => { setItemType('all'); setPage(1); }}
            className={`btn ${itemType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Grid size={15} />
            All Items
          </button>
        </div>

        {/* Pattern & Seed Lab button */}
        <button
          onClick={() => setIsPatternLabOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>Pattern & Seed Lab (Blue Gems & Fades)</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder={
              itemType === 'stickers'
                ? "Search stickers (e.g. Titan Holo, Cloud9 Foil, Crown, Katowice)..."
                : itemType === 'agents'
                ? "Search agents (e.g. Darryl, Ava, Romanov, The Professionals)..."
                : itemType === 'weapons'
                ? "Search weapons & wears (e.g. Redline FT, Asiimov BS, Vulcan FN, Case Hardened)..."
                : "Search all items (skins, stickers, agents)..."
            }
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Contextual Dropdowns */}
        {(itemType === 'weapons' || itemType === 'all') && (
          <>
            {/* Wear Condition Dropdown */}
            <select 
              className="select-input"
              value={selectedWear}
              onChange={(e) => { setSelectedWear(e.target.value); setPage(1); }}
              style={{ minWidth: '150px', borderColor: selectedWear ? 'var(--accent-primary)' : undefined }}
            >
              <option value="">All Wears / Conditions</option>
              <option value="Factory New">Factory New (FN)</option>
              <option value="Minimal Wear">Minimal Wear (MW)</option>
              <option value="Field-Tested">Field-Tested (FT)</option>
              <option value="Well-Worn">Well-Worn (WW)</option>
              <option value="Battle-Scarred">Battle-Scarred (BS)</option>
            </select>

            {/* Weapon Dropdown */}
            <select 
              className="select-input"
              value={selectedWeapon}
              onChange={(e) => { setSelectedWeapon(e.target.value); setPage(1); }}
            >
              <option value="">All Weapons</option>
              {(filters?.weapons || []).map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select 
              className="select-input"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {(filters?.categories || []).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* StatTrak Filter */}
            <select 
              className="select-input"
              value={stattrakOnly}
              onChange={(e) => { setStattrakOnly(e.target.value); setPage(1); }}
            >
              <option value="">StatTrak / Normal</option>
              <option value="1">StatTrak™ Available</option>
            </select>
          </>
        )}

        {/* Sticker Effect Dropdown */}
        {itemType === 'stickers' && (
          <select
            className="select-input"
            value={selectedEffect}
            onChange={(e) => { setSelectedEffect(e.target.value); setPage(1); }}
            style={{ minWidth: '150px', borderColor: selectedEffect ? 'var(--accent-primary)' : undefined }}
          >
            <option value="">All Sticker Effects</option>
            <option value="Holo">Holo</option>
            <option value="Gold">Gold</option>
            <option value="Foil">Foil</option>
            <option value="Glitter">Glitter</option>
            <option value="Paper">Paper</option>
          </select>
        )}

        {/* Agent Team Dropdown */}
        {itemType === 'agents' && (
          <select
            className="select-input"
            value={selectedTeam}
            onChange={(e) => { setSelectedTeam(e.target.value); setPage(1); }}
            style={{ minWidth: '160px', borderColor: selectedTeam ? 'var(--accent-primary)' : undefined }}
          >
            <option value="">All Factions / Teams</option>
            <option value="Terrorist">Terrorist (T)</option>
            <option value="Counter-Terrorist">Counter-Terrorist (CT)</option>
          </select>
        )}

        {/* Rarity Dropdown (Universal) */}
        <select 
          className="select-input"
          value={selectedRarity}
          onChange={(e) => { setSelectedRarity(e.target.value); setPage(1); }}
        >
          <option value="">All Rarities</option>
          {(filters?.rarities || []).map(r => (
            <option key={r.rarity_name} value={r.rarity_name}>{r.rarity_name}</option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select 
          className="select-input"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by);
            setSortOrder(order);
            setPage(1);
          }}
        >
          <option value="price-DESC">Price: High to Low</option>
          <option value="price-ASC">Price: Low to High</option>
          <option value="rarity-DESC">Rarity: High to Low</option>
          <option value="name-ASC">Name: A to Z</option>
        </select>

        {(search || selectedWeapon || selectedRarity || selectedCategory || selectedWear || selectedEffect || selectedTeam || stattrakOnly) && (
          <button className="btn btn-secondary" onClick={handleResetFilters} style={{ padding: '8px 12px' }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Contextual Quick Filter Chips */}
      {(itemType === 'weapons' || itemType === 'all') && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '4px' }}>
            Condition Filter:
          </span>
          {WEAR_OPTIONS.map(opt => {
            const isActive = selectedWear === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSelectedWear(opt.value); setPage(1); }}
                style={{
                  background: isActive ? (opt.color ? `${opt.color}26` : 'var(--accent-glow)') : 'var(--bg-surface)',
                  color: isActive ? (opt.color || '#fff') : 'var(--text-secondary)',
                  border: isActive ? `1px solid ${opt.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.color && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color }} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {itemType === 'stickers' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '4px' }}>
            Sticker Effect:
          </span>
          {STICKER_EFFECTS.map(opt => {
            const isActive = selectedEffect === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSelectedEffect(opt.value); setPage(1); }}
                style={{
                  background: isActive ? (opt.color ? `${opt.color}26` : 'var(--accent-glow)') : 'var(--bg-surface)',
                  color: isActive ? (opt.color || '#fff') : 'var(--text-secondary)',
                  border: isActive ? `1px solid ${opt.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.color && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color }} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {itemType === 'agents' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '4px' }}>
            Faction / Side:
          </span>
          {AGENT_TEAMS.map(opt => {
            const isActive = selectedTeam === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSelectedTeam(opt.value); setPage(1); }}
                style={{
                  background: isActive ? (opt.color ? `${opt.color}26` : 'var(--accent-glow)') : 'var(--bg-surface)',
                  color: isActive ? (opt.color || '#fff') : 'var(--text-secondary)',
                  border: isActive ? `1px solid ${opt.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.color && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color }} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{skins.length}</strong> of <strong>{total.toLocaleString()}</strong> {
            itemType === 'stickers' ? 'stickers' : itemType === 'agents' ? 'agents' : itemType === 'weapons' ? 'skins' : 'items'
          } matching criteria
        </span>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 10px' }}
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 10px' }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading CS2 catalog...
        </div>
      ) : skins.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No items found matching your filters. Try clearing some criteria.
        </div>
      ) : (
        <div className="skins-grid">
          {skins.map((skin) => (
            <SkinCard 
              key={skin.id}
              skin={skin}
              currency={currency}
              onClick={onSelectSkin}
            />
          ))}
        </div>
      )}

      {/* Pattern & Paint Seed Valuation Engine Modal */}
      {isPatternLabOpen && (
        <PatternLabModal onClose={() => setIsPatternLabOpen(false)} />
      )}
    </div>
  );
}
