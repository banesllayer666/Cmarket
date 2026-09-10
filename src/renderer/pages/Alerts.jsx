import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  TrendingDown, 
  CheckCheck, 
  Trash2, 
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function Alerts({ onSelectSkin, currency = 'EUR', onAlertsUpdated }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getAlerts(100);
      if (res) setAlerts(res);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async () => {
    await window.electronAPI.markAlertsRead();
    loadAlerts();
    if (onAlertsUpdated) onAlertsUpdated();
  };

  const handleClear = async () => {
    if (confirm('Clear all price crash alerts history?')) {
      await window.electronAPI.clearAlerts();
      loadAlerts();
      if (onAlertsUpdated) onAlertsUpdated();
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
            Sudden Price Crash Monitor
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time radar alerting when skins drop sharply across market feeds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleMarkRead} disabled={alerts.length === 0}>
            <CheckCheck size={14} />
            Mark Read
          </button>
          <button className="btn btn-danger" onClick={handleClear} disabled={alerts.length === 0}>
            <Trash2 size={14} />
            Clear Log
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading price crash telemetry...
        </div>
      ) : alerts.length === 0 ? (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={36} color="var(--signal-buy)" />
          <h3 style={{ color: '#fff' }}>All Markets Stable</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.88rem' }}>
            No sharp price drops above your configured threshold have occurred recently. The scanner is actively monitoring in the background.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              style={{
                background: alert.is_read === 0 
                  ? 'linear-gradient(90deg, rgba(239,68,68,0.12), var(--bg-surface))' 
                  : 'var(--bg-surface)',
                border: alert.is_read === 0 
                  ? '1px solid rgba(239,68,68,0.35)' 
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onSelectSkin && onSelectSkin({
                market_hash_name: alert.market_hash_name,
                name: alert.skin_name,
                image: alert.skin_image
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {alert.skin_image && (
                  <img 
                    src={alert.skin_image} 
                    alt={alert.skin_name} 
                    style={{ width: '56px', height: '42px', objectFit: 'contain' }}
                  />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      {alert.skin_name || alert.market_hash_name}
                    </span>
                    <span className="badge badge-signal strong_sell" style={{ fontSize: '0.7rem' }}>
                      -{alert.drop_percent}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Platform: <strong style={{ color: '#fff' }}>{alert.source.toUpperCase()}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {symbol}{alert.old_price.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--signal-buy)' }}>
                    {symbol}{alert.new_price.toFixed(2)}
                  </div>
                </div>
                <div className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                  Inspect Dip <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
