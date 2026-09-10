import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  ExternalLink, 
  Plus, 
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Box
} from 'lucide-react';

export default function SkinDetailModal({ skin, onClose, currency = 'EUR', onAddToPortfolio }) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [steamPriceData, setSteamPriceData] = useState(null);
  const [fetchingSteam, setFetchingSteam] = useState(false);

  useEffect(() => {
    if (!skin) return;

    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const res = await window.electronAPI.analyzeSkin({
          marketHashName: skin.market_hash_name,
          currency
        });
        if (isMounted) setAnalysis(res);
      } catch (err) {
        console.error('Error analyzing skin:', err);
      } finally {
        if (isMounted) setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [skin, currency]);

  const handleFetchSteamLive = async () => {
    if (!skin || fetchingSteam) return;
    setFetchingSteam(true);
    try {
      const res = await window.electronAPI.fetchSteamPrice({
        marketHashName: skin.market_hash_name,
        currency
      });
      if (res && res.status === 'success') {
        setSteamPriceData(res);
        // Refresh analysis
        const updatedAnalysis = await window.electronAPI.analyzeSkin({
          marketHashName: skin.market_hash_name,
          currency
        });
        setAnalysis(updatedAnalysis);
      }
    } catch (e) {
      console.warn('Steam live fetch failed:', e);
    } finally {
      setFetchingSteam(false);
    }
  };

  if (!skin) return null;

  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
  const rarityColor = skin.rarity_color || '#b0c3d9';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '820px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: `2px solid ${rarityColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: rarityColor,
              boxShadow: `0 0 10px ${rarityColor}`
            }} />
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                {skin.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {skin.weapon} • {skin.category}
              </span>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 10px' }} 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Showcase: Image + Signal Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Skin Render */}
            <div style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.06), transparent 70%), var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}>
              <img 
                src={skin.image} 
                alt={skin.name}
                style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.7))' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <span className="badge badge-rarity" style={{ '--rarity-color': rarityColor }}>
                  {skin.rarity_name}
                </span>
                <span className="badge badge-wear">
                  {skin.wear_name || 'Standard'}
                </span>
                {skin.stattrak === 1 && (
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
                    StatTrak™
                  </span>
                )}
              </div>
            </div>

            {/* AI Market Recommendation Card */}
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Market Recommendation
                </span>
                {analysis && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Confidence: {analysis.confidence}%
                  </span>
                )}
              </div>

              {loadingAnalysis ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Calculating technical trends & 90-day moving averages...
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-signal ${analysis.signal.toLowerCase()}`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                      {analysis.signal.replace('_', ' ')}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                        {analysis.currentPrice > 0 ? `${symbol}${analysis.currentPrice.toFixed(2)}` : 'Live Quote Needed'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Benchmark Price</span>
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {analysis.reasons.map((reason, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-primary)', marginTop: '2px' }}>•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Technical Statistics Grid */}
          {analysis && analysis.metrics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>7-Day Average</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {symbol}{analysis.metrics.avg7d.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: analysis.metrics.change7d >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)' }}>
                  {analysis.metrics.change7d >= 0 ? '+' : ''}{analysis.metrics.change7d}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>30-Day Baseline</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {symbol}{analysis.metrics.avg30d.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: analysis.metrics.change30d >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)' }}>
                  {analysis.metrics.change30d >= 0 ? '+' : ''}{analysis.metrics.change30d}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>90-Day Range</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  {symbol}{analysis.metrics.min90d.toFixed(2)} - {symbol}{analysis.metrics.max90d.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Position: {analysis.metrics.percentile90d}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>90d Sales Volume</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {analysis.metrics.vol90d} items
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {analysis.metrics.vol30d} last 30d
                </div>
              </div>
            </div>
          )}

          {/* Cross-Market Comparison Table */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                Multi-Platform Price Comparison
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={handleFetchSteamLive}
                disabled={fetchingSteam}
              >
                <RefreshCw size={12} className={fetchingSteam ? 'animate-spin' : ''} />
                {fetchingSteam ? 'Querying Steam...' : 'Query Steam Market'}
              </button>
            </div>

            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Marketplace</th>
                  <th style={{ padding: '8px' }}>Lowest / Listing</th>
                  <th style={{ padding: '8px' }}>Median / Benchmark</th>
                  <th style={{ padding: '8px' }}>Liquidity / Volume</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>Skinport</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--signal-buy)', fontWeight: 700 }}>
                    {analysis && analysis.skinportPrice ? `${symbol}${analysis.skinportPrice.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {analysis && analysis.metrics ? `${symbol}${analysis.metrics.avg30d.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px' }}>{analysis?.metrics?.vol30d || 'Available'}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: 'var(--signal-strong-buy)', fontSize: '0.75rem' }}>● Live Feed</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>Steam Community Market</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {analysis && analysis.steamPrice ? `${symbol}${analysis.steamPrice.toFixed(2)}` : 'Click Query'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {steamPriceData?.median_price ? `${symbol}${steamPriceData.median_price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {steamPriceData?.volume ? `${steamPriceData.volume} sold / 24h` : '—'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: steamPriceData ? 'var(--signal-strong-buy)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {steamPriceData ? '● Updated' : '○ Standby'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Collection & Weapon Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Collection</span>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                {skin.collection || 'Standard Drop Pool'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Case / Container</span>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                {skin.crate || 'Souvenir / Special'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Float Range</span>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {skin.min_float} - {skin.max_float}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              const query = encodeURIComponent(skin.market_hash_name);
              window.open(`https://steamcommunity.com/market/listings/730/${query}`, '_blank');
            }}
          >
            <ExternalLink size={14} />
            View on Steam
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (onAddToPortfolio) {
                onAddToPortfolio(skin, analysis?.currentPrice || 0);
              }
              onClose();
            }}
          >
            <Plus size={16} />
            Add to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
