import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Search
} from 'lucide-react';
import SkinCard from '../components/SkinCard';

export default function Dashboard({ onSelectSkin, currency = 'EUR', onNavigateExplorer }) {
  const [stats, setStats] = useState(null);
  const [topSkins, setTopSkins] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [appStats, skinsRes, alertsRes] = await Promise.all([
          window.electronAPI.getStats(),
          window.electronAPI.getSkins({ limit: 8, sortBy: 'price', sortOrder: 'DESC' }),
          window.electronAPI.getAlerts(5)
        ]);

        if (isMounted) {
          setStats(appStats);
          setTopSkins(skinsRes.items || []);
          setRecentAlerts(alertsRes || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="page-body">
      {/* Top Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Tracked Skins</span>
            <Layers size={16} />
          </div>
          <div className="stat-value">
            {stats ? stats.skinsCount.toLocaleString() : '2,100+'}
          </div>
          <div className="stat-change positive">
            <TrendingUp size={14} /> Full CS2 Catalog
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Price Crash Alerts</span>
            <ShieldAlert size={16} style={{ color: 'var(--signal-strong-sell)' }} />
          </div>
          <div className="stat-value" style={{ color: stats?.unreadAlerts > 0 ? 'var(--signal-sell)' : '#fff' }}>
            {stats ? stats.alertsCount : 0}
          </div>
          <div className="stat-change negative">
            <span>{stats?.unreadAlerts || 0} unreviewed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Market Feeds</span>
            <Sparkles size={16} style={{ color: 'var(--signal-buy)' }} />
          </div>
          <div className="stat-value">2 Active</div>
          <div className="stat-change positive">
            <span>Skinport + Steam Market</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Base Currency</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{symbol}</span>
          </div>
          <div className="stat-value">{currency}</div>
          <div className="stat-change neutral">
            <span>Configurable in Settings</span>
          </div>
        </div>
      </div>

      {/* Price Drops Alert Banner (if any) */}
      {recentAlerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <TrendingDown size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                Sudden Price Drop Detected: {recentAlerts[0].skin_name} (-{recentAlerts[0].drop_percent}%)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Dropped from {symbol}{recentAlerts[0].old_price.toFixed(2)} to {symbol}{recentAlerts[0].new_price.toFixed(2)} on {recentAlerts[0].source.toUpperCase()}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => onSelectSkin && onSelectSkin({ market_hash_name: recentAlerts[0].market_hash_name, name: recentAlerts[0].skin_name, image: recentAlerts[0].skin_image })}
          >
            Analyze Drop
          </button>
        </div>
      )}

      {/* Featured Skins Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              High-Tier & Trending CS2 Skins
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live valuations and automated trend signals
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={onNavigateExplorer}
          >
            <Search size={14} />
            Explore All 2,000+ Skins
          </button>
        </div>

        <div className="skins-grid">
          {topSkins.map((skin) => (
            <SkinCard 
              key={skin.id} 
              skin={skin} 
              currency={currency} 
              onClick={onSelectSkin} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
