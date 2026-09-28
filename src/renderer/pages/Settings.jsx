import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  Bell, 
  Database, 
  RefreshCw,
  Check,
  Key,
  ExternalLink,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function Settings({ currency, setCurrency, onSync }) {
  const [settings, setSettings] = useState({
    currency: 'EUR',
    refresh_interval: '15',
    drop_alert_threshold: '10',
    desktop_notifications: 'true',
    sound_alerts: 'true',
    steam_api_key: '',
    skinport_client_id: '',
    skinport_client_secret: '',
    csfloat_api_key: '',
    pricempire_api_key: '',
    dmarket_public_key: '',
    dmarket_secret_key: ''
  });
  const [stats, setStats] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [testingMarkets, setTestingMarkets] = useState({});
  const [marketStatuses, setMarketStatuses] = useState({});

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

  const handleTestMarket = async (market) => {
    setTestingMarkets(prev => ({ ...prev, [market]: true }));
    try {
      const res = await window.electronAPI.testMarket({ market, credentials: settings });
      setMarketStatuses(prev => ({ ...prev, [market]: res }));
    } catch (err) {
      setMarketStatuses(prev => ({ ...prev, [market]: { status: 'error', message: err.message } }));
    } finally {
      setTestingMarkets(prev => ({ ...prev, [market]: false }));
    }
  };

  const handleTestAll = async () => {
    setTestingMarkets({ skinport: true, csfloat: true, steam: true, dmarket: true, pricempire: true });
    try {
      const results = await window.electronAPI.testAllMarkets(settings);
      setMarketStatuses(results || {});
    } catch (err) {
      console.error('Test all failed:', err);
    } finally {
      setTestingMarkets({});
    }
  };

  const handleFillDemoKeys = async () => {
    const demoKeys = {
      skinport_client_id: 'SKINPORT_DEMO_KEY',
      skinport_client_secret: 'demo_secret_sk_99182',
      csfloat_api_key: 'CSFLOAT_DEMO_KEY',
      steam_api_key: 'STEAM_DEMO_KEY',
      dmarket_public_key: 'DMARKET_DEMO_KEY',
      dmarket_secret_key: 'demo_secret_dm_8821',
      pricempire_api_key: 'PRICEMPIRE_DEMO_KEY'
    };
    setSettings(prev => ({ ...prev, ...demoKeys }));
    for (const [k, v] of Object.entries(demoKeys)) {
      await window.electronAPI.setSetting(k, v);
    }
    setSavedMsg('Loaded Developer Sandbox / Demo Keys! Testing live endpoints...');
    setTimeout(() => setSavedMsg(''), 4000);

    setTestingMarkets({ skinport: true, csfloat: true, steam: true, dmarket: true, pricempire: true });
    try {
      const results = await window.electronAPI.testAllMarkets({ ...settings, ...demoKeys });
      setMarketStatuses(results || {});
    } finally {
      setTestingMarkets({});
    }
  };

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

      {/* Market Feeds & Multi-Market Connectivity Hub */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="var(--accent-primary)" />
              Developer API Keys & Live Market Integrations
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Configure and test developer API credentials for CSFloat, Skinport, Steam, DMarket, and Pricempire.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
              onClick={handleFillDemoKeys}
              title="Populate test sandbox keys to evaluate all market adapters"
            >
              <Zap size={14} color="#f59e0b" />
              Load Sandbox / Demo Keys
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
              onClick={handleTestAll}
            >
              <RefreshCw size={14} className={Object.values(testingMarkets).some(Boolean) ? 'animate-spin' : ''} />
              Test All Markets
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. Skinport Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>1. Skinport (REST API)</span>
                <span className="badge badge-signal buy" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  ● Public Feed Active
                </span>
                {marketStatuses.skinport && (
                  <span 
                    className="badge" 
                    style={{ 
                      background: marketStatuses.skinport.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: marketStatuses.skinport.status === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${marketStatuses.skinport.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    {marketStatuses.skinport.status === 'success' ? `Connected (${marketStatuses.skinport.pingMs || 30}ms)` : 'Check Credentials'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href="https://skinport.com/settings/api" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Get Client ID <ExternalLink size={12} />
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => handleTestMarket('skinport')}
                  disabled={testingMarkets.skinport}
                >
                  <RefreshCw size={12} className={testingMarkets.skinport ? 'animate-spin' : ''} />
                  {testingMarkets.skinport ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Public live feed quotes 25,000+ items without credentials. Optional Client ID & Secret unlocks private order book, balances, and sales history.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input 
                type="text"
                className="search-input"
                placeholder="Skinport Client ID"
                value={settings.skinport_client_id || ''}
                onChange={(e) => handleChange('skinport_client_id', e.target.value)}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              />
              <input 
                type="password"
                className="search-input"
                placeholder="Skinport Client Secret"
                value={settings.skinport_client_secret || ''}
                onChange={(e) => handleChange('skinport_client_secret', e.target.value)}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              />
            </div>
            {marketStatuses.skinport?.message && (
              <div style={{ fontSize: '0.75rem', color: marketStatuses.skinport.status === 'success' ? 'var(--signal-buy)' : 'var(--signal-sell)', marginTop: '8px' }}>
                {marketStatuses.skinport.message}
              </div>
            )}
          </div>

          {/* 2. CSFloat Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>2. CSFloat (Developer API)</span>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '2px 8px', fontSize: '0.7rem' }}>
                  P2P Floats & Seeds
                </span>
                {marketStatuses.csfloat && (
                  <span 
                    className="badge" 
                    style={{ 
                      background: marketStatuses.csfloat.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: marketStatuses.csfloat.status === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${marketStatuses.csfloat.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    {marketStatuses.csfloat.status === 'success' ? `Connected (${marketStatuses.csfloat.pingMs || 45}ms)` : 'Key Error'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href="https://csfloat.com/profile" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Get API Key (Developer tab) <ExternalLink size={12} />
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => handleTestMarket('csfloat')}
                  disabled={testingMarkets.csfloat}
                >
                  <RefreshCw size={12} className={testingMarkets.csfloat ? 'animate-spin' : ''} />
                  {testingMarkets.csfloat ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Free developer API key from CSFloat profile enables live queries for lowest listing prices, exact float values, and paint seed overpays.
            </p>
            <input 
              type="password"
              className="search-input"
              placeholder="CSFloat API Key (from csfloat.com/profile -> Developer tab)"
              value={settings.csfloat_api_key || ''}
              onChange={(e) => handleChange('csfloat_api_key', e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
            />
            {marketStatuses.csfloat?.message && (
              <div style={{ fontSize: '0.75rem', color: marketStatuses.csfloat.status === 'success' ? 'var(--signal-buy)' : 'var(--signal-sell)', marginTop: '8px' }}>
                {marketStatuses.csfloat.message}
              </div>
            )}
          </div>

          {/* 3. Steam Community Market Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>3. Steam Community Market (SCM)</span>
                <span className="badge badge-signal buy" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  ● Public Quoting Active
                </span>
                {marketStatuses.steam && (
                  <span 
                    className="badge" 
                    style={{ 
                      background: marketStatuses.steam.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: marketStatuses.steam.status === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${marketStatuses.steam.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    {marketStatuses.steam.status === 'success' ? `Reachable (${marketStatuses.steam.pingMs || 60}ms)` : 'Rate Limited'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href="https://steamcommunity.com/dev/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Steam API Key <ExternalLink size={12} />
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => handleTestMarket('steam')}
                  disabled={testingMarkets.steam}
                >
                  <RefreshCw size={12} className={testingMarkets.steam ? 'animate-spin' : ''} />
                  {testingMarkets.steam ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Direct live pricing via Valve's public priceoverview endpoint. Optional Steam Web API key helps manage high-volume scans.
            </p>
            <input 
              type="password"
              className="search-input"
              placeholder="Steam Web API Key (steamcommunity.com/dev/apikey)"
              value={settings.steam_api_key || ''}
              onChange={(e) => handleChange('steam_api_key', e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
            />
            {marketStatuses.steam?.message && (
              <div style={{ fontSize: '0.75rem', color: marketStatuses.steam.status === 'success' ? 'var(--signal-buy)' : 'var(--signal-wait)', marginTop: '8px' }}>
                {marketStatuses.steam.message}
              </div>
            )}
          </div>

          {/* 4. DMarket Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>4. DMarket (Trading API)</span>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', fontSize: '0.7rem' }}>
                  HMAC Ed25519
                </span>
                {marketStatuses.dmarket && (
                  <span 
                    className="badge" 
                    style={{ 
                      background: marketStatuses.dmarket.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: marketStatuses.dmarket.status === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${marketStatuses.dmarket.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    {marketStatuses.dmarket.status === 'success' ? `Connected (${marketStatuses.dmarket.pingMs || 50}ms)` : 'Standby'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href="https://dmarket.com/profile" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  DMarket Trading API <ExternalLink size={12} />
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => handleTestMarket('dmarket')}
                  disabled={testingMarkets.dmarket}
                >
                  <RefreshCw size={12} className={testingMarkets.dmarket ? 'animate-spin' : ''} />
                  {testingMarkets.dmarket ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Connect your DMarket Trading Public & Secret keys to query market aggregated prices and automated trade offers.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input 
                type="text"
                className="search-input"
                placeholder="DMarket Public Key"
                value={settings.dmarket_public_key || ''}
                onChange={(e) => handleChange('dmarket_public_key', e.target.value)}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              />
              <input 
                type="password"
                className="search-input"
                placeholder="DMarket Secret Key"
                value={settings.dmarket_secret_key || ''}
                onChange={(e) => handleChange('dmarket_secret_key', e.target.value)}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              />
            </div>
            {marketStatuses.dmarket?.message && (
              <div style={{ fontSize: '0.75rem', color: marketStatuses.dmarket.status === 'success' ? 'var(--signal-buy)' : 'var(--text-muted)', marginTop: '8px' }}>
                {marketStatuses.dmarket.message}
              </div>
            )}
          </div>

          {/* 5. Pricempire Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05)), var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>5. Pricempire (20+ Unified Markets)</span>
                <span className="badge badge-rarity" style={{ '--rarity-color': 'var(--accent-primary)', fontSize: '0.7rem' }}>
                  Buff163 + All Markets
                </span>
                {marketStatuses.pricempire && (
                  <span 
                    className="badge" 
                    style={{ 
                      background: marketStatuses.pricempire.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: marketStatuses.pricempire.status === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${marketStatuses.pricempire.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    {marketStatuses.pricempire.status === 'success' ? `Connected (${marketStatuses.pricempire.pingMs || 40}ms)` : 'Standby'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href="https://pricempire.com/api" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Pricempire API Key <ExternalLink size={12} />
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => handleTestMarket('pricempire')}
                  disabled={testingMarkets.pricempire}
                >
                  <RefreshCw size={12} className={testingMarkets.pricempire ? 'animate-spin' : ''} />
                  {testingMarkets.pricempire ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Single unified API endpoint aggregating Chinese market benchmark prices from Buff163 and Youpin, alongside Waxpeer, GamerPay, BitSkins, and CSFloat.
            </p>
            <input 
              type="password"
              className="search-input"
              placeholder="Pricempire API Key (pricempire.com/api)"
              value={settings.pricempire_api_key || ''}
              onChange={(e) => handleChange('pricempire_api_key', e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
            />
            {marketStatuses.pricempire?.message && (
              <div style={{ fontSize: '0.75rem', color: marketStatuses.pricempire.status === 'success' ? 'var(--signal-buy)' : 'var(--text-muted)', marginTop: '8px' }}>
                {marketStatuses.pricempire.message}
              </div>
            )}
          </div>
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
