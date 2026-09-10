import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  Bell, 
  Database, 
  RefreshCw,
  Check
} from 'lucide-react';

export default function Settings({ currency, setCurrency, onSync }) {
  const [settings, setSettings] = useState({
    currency: 'EUR',
    refresh_interval: '15',
    drop_alert_threshold: '10',
    desktop_notifications: 'true',
    sound_alerts: 'true'
  });
  const [stats, setStats] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [loadedSettings, appStats] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getStats()
        ]);
        if (loadedSettings) setSettings(s => ({ ...s, ...loadedSettings }));
        if (appStats) setStats(appStats);
      } catch (e) {
        console.warn('Error loading settings:', e);
      }
    };
    loadSettings();
  }, []);

  const handleChange = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await window.electronAPI.setSetting(key, value);
    if (key === 'currency' && setCurrency) {
      setCurrency(value);
    }
    setSavedMsg('Settings updated automatically');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleForceCatalogSync = async () => {
    setSyncingCatalog(true);
    try {
      await window.electronAPI.syncCatalog(true);
      const appStats = await window.electronAPI.getStats();
      if (appStats) setStats(appStats);
      setSavedMsg('Skin catalog re-synchronized!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingCatalog(false);
    }
  };

  return (
    <div className="page-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
          Application Settings & Feeds
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Configure currency valuation, scanning frequencies, and price drop radar
        </p>
      </div>

      {savedMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '20px',
          color: 'var(--signal-buy)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          {savedMsg}
        </div>
      )}

      {/* Preferences Card */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          Market & Currency Preferences
        </h3>

        {/* Currency Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Primary Valuation Currency</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              All prices, moving averages, and portfolio ledgers will display in this currency.
            </div>
          </div>
          <select 
            className="select-input"
            value={settings.currency || 'EUR'}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="EUR">EUR (€) - European Euro (Default)</option>
            <option value="USD">USD ($) - US Dollar</option>
            <option value="GBP">GBP (£) - British Pound</option>
          </select>
        </div>

        {/* Price Drop Threshold */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Price Crash Alert Sensitivity</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Minimum price drop percentage required to trigger notifications and alert logs.
            </div>
          </div>
          <select 
            className="select-input"
            value={settings.drop_alert_threshold || '10'}
            onChange={(e) => handleChange('drop_alert_threshold', e.target.value)}
          >
            <option value="5">-5% Sudden Dip</option>
            <option value="10">-10% Flash Drop (Recommended)</option>
            <option value="15">-15% Sharp Drop</option>
            <option value="20">-20% Severe Crash</option>
            <option value="25">-25% Extreme Liquidation</option>
          </select>
        </div>

        {/* Refresh Interval */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Background Refresh Frequency</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Interval between automated market scanner synchronization cycles.
            </div>
          </div>
          <select 
            className="select-input"
            value={settings.refresh_interval || '15'}
            onChange={(e) => handleChange('refresh_interval', e.target.value)}
          >
            <option value="5">Every 5 minutes</option>
            <option value="15">Every 15 minutes (Standard)</option>
            <option value="30">Every 30 minutes</option>
            <option value="60">Every 1 hour</option>
          </select>
        </div>
      </div>

      {/* Data Management & Sync */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          Standalone Local Database & Cache
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Catalog Records</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {stats?.skinsCount || 0}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cached Live Quotes</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {stats?.pricesCount || 0}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archived Alerts</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {stats?.alertsCount || 0}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleForceCatalogSync}
            disabled={syncingCatalog}
          >
            <RefreshCw size={14} className={syncingCatalog ? 'animate-spin' : ''} />
            {syncingCatalog ? 'Syncing Catalog...' : 'Force Resync Skins Catalog'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onSync}
          >
            <RefreshCw size={14} />
            Force Resync Market Prices
          </button>
        </div>
      </div>
    </div>
  );
}
