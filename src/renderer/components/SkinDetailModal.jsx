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
  Box,
  Sparkles
} from 'lucide-react';
import PatternLabModal from './PatternLabModal';

export default function SkinDetailModal({ skin, onClose, currency = 'EUR', onAddToPortfolio }) {
  const [activeSkin, setActiveSkin] = useState(skin);
  const [isStatTrak, setIsStatTrak] = useState(skin?.stattrak === 1);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [steamPriceData, setSteamPriceData] = useState(null);
  const [fetchingSteam, setFetchingSteam] = useState(false);
  const [wearData, setWearData] = useState(null);
  const [loadingWears, setLoadingWears] = useState(true);
  const [isPatternLabOpen, setIsPatternLabOpen] = useState(false);
  const [crossQuotes, setCrossQuotes] = useState(null);
  const [fetchingQuotes, setFetchingQuotes] = useState(false);

  // Sync activeSkin whenever skin prop changes
  useEffect(() => {
    if (skin) {
      setActiveSkin(skin);
      setIsStatTrak(skin.stattrak === 1);
    }
  }, [skin]);

  // Fetch technical analysis for the active skin & wear
  useEffect(() => {
    if (!activeSkin) return;

    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      setSteamPriceData(null);
      try {
        const res = await window.electronAPI.analyzeSkin({
          marketHashName: activeSkin.market_hash_name,
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
  }, [activeSkin, currency]);

  // Fetch prices across all wear conditions (FN, MW, FT, WW, BS)
  useEffect(() => {
    if (!activeSkin) return;

    let isMounted = true;
    const fetchWears = async () => {
      setLoadingWears(true);
      try {
        const baseName = activeSkin.base_name || activeSkin.display_name || activeSkin.name.replace(/\s*\([^)]*\)\s*$/, '');
        const res = await window.electronAPI.getWearPrices({
          baseName,
          isStatTrak,
          currency
        });
        if (isMounted) setWearData(res);
      } catch (err) {
        console.warn('Error fetching wear prices:', err);
      } finally {
        if (isMounted) setLoadingWears(false);
      }
    };

    fetchWears();
    return () => { isMounted = false; };
  }, [activeSkin?.base_name, activeSkin?.name, isStatTrak, currency]);

  const handleFetchSteamLive = async () => {
    if (!activeSkin || fetchingSteam) return;
    setFetchingSteam(true);
    try {
      const res = await window.electronAPI.fetchSteamPrice({
        marketHashName: activeSkin.market_hash_name,
        currency
      });
      if (res && res.status === 'success') {
        setSteamPriceData(res);
        // Refresh analysis
        const updatedAnalysis = await window.electronAPI.analyzeSkin({
          marketHashName: activeSkin.market_hash_name,
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

  const handleFetchAllMarketQuotes = async () => {
    if (!activeSkin || fetchingQuotes) return;
    setFetchingQuotes(true);
    try {
      const res = await window.electronAPI.getMarketQuotes({
        marketHashName: activeSkin.market_hash_name,
        currency
      });
      if (res) setCrossQuotes(res);
    } catch (e) {
      console.warn('Cross-market quotes failed:', e);
    } finally {
      setFetchingQuotes(false);
    }
  };

  // Fetch cross-market quotes when skin changes
  useEffect(() => {
    if (activeSkin) {
      handleFetchAllMarketQuotes();
    }
  }, [activeSkin?.market_hash_name, currency]);

  const handleSelectWear = (wear) => {
    if (!wear.isAvailable) return;
    const baseName = activeSkin.base_name || activeSkin.display_name || activeSkin.name.replace(/\s*\([^)]*\)\s*$/, '');
    const newMarketHashName = wear.marketHashName;
    setActiveSkin(prev => ({
      ...prev,
      name: `${baseName} (${wear.wearName})`,
      display_name: baseName,
      market_hash_name: newMarketHashName,
      wear_name: wear.wearName,
      current_price: wear.skinportPrice || prev.current_price,
      lowest_price: wear.skinportPrice || prev.lowest_price
    }));
  };

  if (!skin || !activeSkin) return null;

  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
  const rarityColor = activeSkin.rarity_color || '#b0c3d9';
  const currentActivePrice = analysis?.currentPrice || activeSkin.current_price || activeSkin.lowest_price || 0;
  const isPatternSkin = /Case Hardened|Marble Fade|Doppler|Fade|Slaughter|Crimson Web/i.test(activeSkin?.name || activeSkin?.display_name || '');

  const getWearBadgeStyle = (wearName) => {
    switch (wearName) {
      case 'Factory New':
        return { background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.45)' };
      case 'Minimal Wear':
        return { background: 'rgba(6, 182, 212, 0.18)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.45)' };
      case 'Field-Tested':
        return { background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.45)' };
      case 'Well-Worn':
        return { background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.45)' };
      case 'Battle-Scarred':
        return { background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.45)' };
      default:
        return { background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto' }}
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
                {activeSkin.display_name || activeSkin.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeSkin.weapon} • {activeSkin.category} • Condition: <strong style={{ color: '#fff' }}>{activeSkin.wear_name || 'Standard'}</strong>
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
                src={activeSkin.image} 
                alt={activeSkin.name}
                style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.7))' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge badge-rarity" style={{ '--rarity-color': rarityColor }}>
                  {activeSkin.rarity_name}
                </span>
                <span className="badge" style={getWearBadgeStyle(activeSkin.wear_name)}>
                  {activeSkin.wear_name || 'Standard'}
                </span>
                {isStatTrak && (
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', fontWeight: 700 }}>
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
                    <span className={`badge badge-signal ${analysis?.signal?.toLowerCase() || 'wait'}`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                      {analysis?.signal?.replace('_', ' ') || 'WAIT'}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                        {currentActivePrice > 0 ? `${symbol}${currentActivePrice.toFixed(2)}` : 'Live Quote Needed'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {activeSkin.wear_name} Valuation
                      </span>
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {analysis?.reasons?.map((reason, i) => (
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

          {/* Pattern Tier & Paint Seed Banner if applicable */}
          {isPatternSkin && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.12))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                    Pattern Tier & Paint Seed Valuation Engine
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    This finish ({activeSkin.display_name || activeSkin.name}) has rare seeds (Blue Gems, Fire & Ice, 100% Fades) that command massive overpay.
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
                onClick={() => setIsPatternLabOpen(true)}
              >
                <Sparkles size={14} />
                Inspect Paint Seed (1–1000)
              </button>
            </div>
          )}

          {/* Wear Condition & Price Spectrum Matrix */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--accent-primary)" />
                  Wear Condition & Multi-Wear Price Spectrum
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Compare live valuations across all exterior wear tiers. Click any row to switch active valuation.
                </span>
              </div>

              {/* StatTrak Toggle Button */}
              {activeSkin.stattrak === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: isStatTrak ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>StatTrak™:</span>
                  <button
                    className={`btn ${isStatTrak ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '2px 10px', fontSize: '0.72rem' }}
                    onClick={() => setIsStatTrak(prev => !prev)}
                  >
                    {isStatTrak ? 'StatTrak™ ON' : 'Normal'}
                  </button>
                </div>
              )}
            </div>

            {loadingWears ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Scanning prices across Factory New, Minimal Wear, Field-Tested, Well-Worn, and Battle-Scarred...
              </div>
            ) : !wearData || !wearData.wears || wearData.wears.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Wear condition data not applicable for this standard item.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.83rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Condition</th>
                      <th style={{ padding: '8px 10px' }}>Float Bracket</th>
                      <th style={{ padding: '8px 10px' }}>Skinport Price</th>
                      <th style={{ padding: '8px 10px' }}>Steam Market</th>
                      <th style={{ padding: '8px 10px' }}>Spread vs Selected</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wearData.wears.map((w) => {
                      const isActive = activeSkin.wear_name === w.wearName;
                      const wearPrice = w.skinportPrice || w.steamPrice || 0;
                      let spreadText = '—';
                      let spreadColor = 'var(--text-muted)';

                      if (isActive) {
                        spreadText = 'Selected Baseline';
                        spreadColor = 'var(--accent-primary)';
                      } else if (w.isAvailable && wearPrice > 0 && currentActivePrice > 0) {
                        const diffPercent = ((wearPrice - currentActivePrice) / currentActivePrice) * 100;
                        spreadText = `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(1)}%`;
                        spreadColor = diffPercent > 0 ? 'var(--signal-sell)' : 'var(--signal-buy)';
                      }

                      return (
                        <tr 
                          key={w.wearName} 
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  background: `${w.color}22`, 
                                  color: w.color, 
                                  border: `1px solid ${w.color}55`,
                                  minWidth: '32px',
                                  textAlign: 'center',
                                  fontWeight: 700
                                }}
                              >
                                {w.abbrev}
                              </span>
                              <span style={{ color: isActive ? '#fff' : 'var(--text-primary)', fontWeight: isActive ? 700 : 500 }}>
                                {w.wearName}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {w.minFloat.toFixed(2)} - {w.maxFloat.toFixed(2)}
                          </td>

                          <td style={{ padding: '10px' }}>
                            {!w.isAvailable ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                {w.unavailableReason || 'Not Available'}
                              </span>
                            ) : w.skinportPrice ? (
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--signal-buy)' }}>
                                {symbol}{w.skinportPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>No live quote</span>
                            )}
                          </td>

                          <td style={{ padding: '10px' }}>
                            {w.steamPrice ? (
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                                {symbol}{w.steamPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>On Demand</span>
                            )}
                          </td>

                          <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: spreadColor }}>
                            {spreadText}
                          </td>

                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {isActive ? (
                              <span 
                                className="badge" 
                                style={{ 
                                  background: 'var(--accent-glow)', 
                                  color: '#fff', 
                                  border: '1px solid var(--accent-primary)',
                                  padding: '4px 10px'
                                }}
                              >
                                ● Active
                              </span>
                            ) : w.isAvailable ? (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => handleSelectWear(w)}
                              >
                                Inspect Wear
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Float Capped
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                  Live Multi-Market Price Comparison ({activeSkin.wear_name})
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Aggregating developer APIs across Skinport, Steam, CSFloat, DMarket & Buff163
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={handleFetchSteamLive}
                  disabled={fetchingSteam}
                >
                  <RefreshCw size={12} className={fetchingSteam ? 'animate-spin' : ''} />
                  {fetchingSteam ? 'Querying Steam...' : 'Steam Live SCM'}
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={handleFetchAllMarketQuotes}
                  disabled={fetchingQuotes}
                >
                  <RefreshCw size={12} className={fetchingQuotes ? 'animate-spin' : ''} />
                  {fetchingQuotes ? 'Refreshing Feeds...' : 'Sync All Market APIs'}
                </button>
              </div>
            </div>

            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Marketplace</th>
                  <th style={{ padding: '8px' }}>Lowest / Listing</th>
                  <th style={{ padding: '8px' }}>Median / Benchmark</th>
                  <th style={{ padding: '8px' }}>Details / Volume</th>
                  <th style={{ padding: '8px' }}>API Status</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Skinport */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>Skinport</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--signal-buy)', fontWeight: 700 }}>
                    {analysis?.skinportPrice ? `${symbol}${analysis.skinportPrice.toFixed(2)}` : (crossQuotes?.markets?.skinport?.price ? `${symbol}${crossQuotes.markets.skinport.price.toFixed(2)}` : '—')}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {analysis?.metrics ? `${symbol}${analysis.metrics.avg30d.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {crossQuotes?.markets?.skinport?.volume || analysis?.metrics?.vol30d || 'Available'} in stock
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: 'var(--signal-strong-buy)', fontSize: '0.75rem' }}>● Live Feed Active</span>
                  </td>
                </tr>

                {/* 2. Steam Community Market */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>Steam Community Market</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {steamPriceData?.price ? `${symbol}${steamPriceData.price.toFixed(2)}` : (analysis?.steamPrice ? `${symbol}${analysis.steamPrice.toFixed(2)}` : 'Click Query')}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {steamPriceData?.median_price ? `${symbol}${steamPriceData.median_price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {steamPriceData?.volume ? `${steamPriceData.volume} sold / 24h` : 'Valve Public SCM'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: steamPriceData ? 'var(--signal-strong-buy)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {steamPriceData ? '● Live SCM' : '○ Standby'}
                    </span>
                  </td>
                </tr>

                {/* 3. CSFloat (P2P) */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>CSFloat (P2P Market)</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 700 }}>
                    {crossQuotes?.markets?.csfloat?.price ? `${symbol}${crossQuotes.markets.csfloat.price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {crossQuotes?.markets?.csfloat?.topListings?.[0]?.floatValue ? (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.72rem', padding: '2px 6px' }}>
                        Float: {crossQuotes.markets.csfloat.topListings[0].floatValue}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {crossQuotes?.markets?.csfloat?.topListings?.[0]?.paintSeed ? `Seed #${crossQuotes.markets.csfloat.topListings[0].paintSeed}` : 'P2P Trades'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: '#60a5fa', fontSize: '0.75rem' }}>● Developer API</span>
                  </td>
                </tr>

                {/* 4. DMarket */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>DMarket</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {crossQuotes?.markets?.dmarket?.price ? `${symbol}${crossQuotes.markets.dmarket.price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Aggregated Ask
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Instant Bot Delivery
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: 'var(--signal-wait)', fontSize: '0.75rem' }}>● Trading API</span>
                  </td>
                </tr>

                {/* 5. Buff163 (China / Pricempire) */}
                <tr>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>Buff163 (China Benchmark)</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#fbbf24', fontWeight: 700 }}>
                    {crossQuotes?.markets?.buff163?.price ? `${symbol}${crossQuotes.markets.buff163.price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Global Wholesale
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Deepest Global Liquidity
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>● Aggregator Feed</span>
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
                {activeSkin.collection || 'Standard Drop Pool'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Case / Container</span>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                {activeSkin.crate || 'Souvenir / Special'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Float Range</span>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {activeSkin.min_float} - {activeSkin.max_float}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              const query = encodeURIComponent(activeSkin.market_hash_name);
              window.open(`https://steamcommunity.com/market/listings/730/${query}`, '_blank');
            }}
          >
            <ExternalLink size={14} />
            View on Steam ({activeSkin.wear_name})
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (onAddToPortfolio) {
                onAddToPortfolio(activeSkin, currentActivePrice);
              }
              onClose();
            }}
          >
            <Plus size={16} />
            Add {activeSkin.wear_name} to Portfolio
          </button>
        </div>
      </div>

      {/* Pattern Lab Modal */}
      {isPatternLabOpen && (
        <PatternLabModal
          initialSkin={activeSkin.display_name || activeSkin.name}
          onClose={() => setIsPatternLabOpen(false)}
        />
      )}
    </div>
  );
}
