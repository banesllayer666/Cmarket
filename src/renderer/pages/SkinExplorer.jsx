import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import SkinCard from '../components/SkinCard';

export default function SkinExplorer({ onSelectSkin, currency = 'EUR' }) {
  const [skins, setSkins] = useState([]);
  const [filters, setFilters] = useState({ weapons: [], rarities: [], categories: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stattrakOnly, setStattrakOnly] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('DESC');

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

  // Load skins whenever filters or page change
  useEffect(() => {
    let isMounted = true;
    const fetchSkins = async () => {
      setLoading(true);
      try {
        const res = await window.electronAPI.getSkins({
          search,
          weapon: selectedWeapon,
          rarity: selectedRarity,
          category: selectedCategory,
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
        console.error('Failed to query skins:', err);
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
  }, [search, selectedWeapon, selectedRarity, selectedCategory, stattrakOnly, sortBy, sortOrder, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedWeapon('');
    setSelectedRarity('');
    setSelectedCategory('');
    setStattrakOnly('');
    setPage(1);
  };

  return (
    <div className="page-body">
      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search by skin name, pattern, or weapon (e.g. Redline, AWP, Asiimov)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Weapon Dropdown */}
        <select 
          className="select-input"
          value={selectedWeapon}
          onChange={(e) => { setSelectedWeapon(e.target.value); setPage(1); }}
        >
          <option value="">All Weapons</option>
          {filters.weapons.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        {/* Rarity Dropdown */}
        <select 
          className="select-input"
          value={selectedRarity}
          onChange={(e) => { setSelectedRarity(e.target.value); setPage(1); }}
        >
          <option value="">All Rarities</option>
          {filters.rarities.map(r => (
            <option key={r.rarity_name} value={r.rarity_name}>{r.rarity_name}</option>
          ))}
        </select>

        {/* Category Dropdown */}
        <select 
          className="select-input"
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {filters.categories.map(c => (
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

        {(search || selectedWeapon || selectedRarity || selectedCategory || stattrakOnly) && (
          <button className="btn btn-secondary" onClick={handleResetFilters} style={{ padding: '8px 12px' }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{skins.length}</strong> of <strong>{total.toLocaleString()}</strong> skins matching criteria
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
          Loading CS2 skins catalog...
        </div>
      ) : skins.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No skins found matching your filters. Try clearing some criteria.
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
    </div>
  );
}
