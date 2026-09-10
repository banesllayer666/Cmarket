import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  BellRing, 
  Settings, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, unreadAlerts = 0, isSyncing = false, onSync }) {
  const navItems = [
    { id: 'dashboard', label: 'Market Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Skin Explorer', icon: Search },
    { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
    { id: 'alerts', label: 'Price Crash Alerts', icon: BellRing, badge: unreadAlerts },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-logo-icon">
          <TrendingUp size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="brand-title">CS2 ANALYZER</span>
            <span className="brand-tag">PRO</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Market Intelligence</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </div>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Syncing...' : 'Sync Market Prices'}
        </button>

        <div className="sidebar-status">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <span className="status-dot"></span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Live Data Connected</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Steam + Skinport feeds active
          </div>
        </div>
      </div>
    </aside>
  );
}
