import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SkinExplorer from './pages/SkinExplorer';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import SkinDetailModal from './components/SkinDetailModal';
import { Bell } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tab render error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>⚠️</div>
          <h2 style={{ color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            Error Loading This Tab
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px', fontFamily: 'var(--font-mono)' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('EUR');
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Load initial settings and alert stats
  useEffect(() => {
    const initApp = async () => {
      try {
        const [settings, stats] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getStats()
        ]);
        if (settings?.currency) setCurrency(settings.currency);
        if (stats?.unreadAlerts !== undefined) setUnreadAlerts(stats.unreadAlerts);
      } catch (err) {
        console.warn('Init app error:', err);
      }
    };

    initApp();

    // Listen for live drop alerts broadcast from backend
    const unsubscribe = window.electronAPI.onNewAlerts((newDrops) => {
      if (newDrops && newDrops.length > 0) {
        setUnreadAlerts(prev => prev + newDrops.length);
        const first = newDrops[0];
        setToast({
          title: `⚠️ Price Crash: -${first.drop_percent}%`,
          message: `${first.skin_name || first.market_hash_name} dropped on ${first.source.toUpperCase()}!`
        });
        setTimeout(() => setToast(null), 5000);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSyncPrices = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await window.electronAPI.syncPrices(currency);
      setToast({
        title: '✅ Market Synced',
        message: `Updated ${res.count || 0} skin prices in ${currency}.`
      });
      setTimeout(() => setToast(null), 4000);
      // Update unread count if drops occurred
      const stats = await window.electronAPI.getStats();
      if (stats) setUnreadAlerts(stats.unreadAlerts);
    } catch (err) {
      setToast({
        title: '❌ Sync Failed',
        message: err.message
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddToPortfolio = async (skin, price) => {
    try {
      await window.electronAPI.addManualPortfolioItem({
        market_hash_name: skin.market_hash_name,
        skin_name: skin.name,
        weapon: skin.weapon,
        rarity_name: skin.rarity_name,
        rarity_color: skin.rarity_color,
        wear_name: skin.wear_name,
        image: skin.image,
        buy_price: price || 0,
        notes: 'Added from Skin Explorer'
      });
      setToast({
        title: '💼 Added to Portfolio',
        message: `${skin.name} saved to your asset ledger.`
      });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slide-in 0.3s ease-out'
        }}>
          <Bell size={18} color="var(--accent-primary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{toast.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadAlerts={unreadAlerts}
        isSyncing={isSyncing}
        onSync={handleSyncPrices}
      />

      {/* Main App Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title-area">
            <h1>
              {activeTab === 'dashboard' && 'Market Overview & Analytics'}
              {activeTab === 'explorer' && 'CS2 Skin Explorer & Valuations'}
              {activeTab === 'portfolio' && 'Inventory Asset Portfolio'}
              {activeTab === 'alerts' && 'Price Crash & Flash Drop Radar'}
              {activeTab === 'settings' && 'System Settings & Market Feeds'}
            </h1>
          </div>

          <div className="header-actions">
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Valuation:</span>
              <strong style={{ color: '#fff' }}>{currency}</strong>
            </div>
          </div>
        </header>

        {/* Tab Views with Error Boundary Protection */}
        <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              onSelectSkin={setSelectedSkin} 
              currency={currency} 
              onNavigateExplorer={() => setActiveTab('explorer')}
            />
          )}
          {activeTab === 'explorer' && (
            <SkinExplorer 
              onSelectSkin={setSelectedSkin} 
              currency={currency} 
            />
          )}
          {activeTab === 'portfolio' && (
            <Portfolio 
              onSelectSkin={setSelectedSkin} 
              currency={currency} 
            />
          )}
          {activeTab === 'alerts' && (
            <Alerts 
              onSelectSkin={setSelectedSkin} 
              currency={currency}
              onAlertsUpdated={async () => {
                const stats = await window.electronAPI.getStats();
                if (stats) setUnreadAlerts(stats.unreadAlerts);
              }}
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              currency={currency} 
              setCurrency={setCurrency}
              onSync={handleSyncPrices}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Detailed Analysis Modal */}
      {selectedSkin && (
        <SkinDetailModal 
          skin={selectedSkin} 
          currency={currency}
          onClose={() => setSelectedSkin(null)}
          onAddToPortfolio={handleAddToPortfolio}
        />
      )}
    </div>
  );
}
