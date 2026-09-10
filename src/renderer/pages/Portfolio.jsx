import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Download, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ExternalLink,
  Search,
  DollarSign
} from 'lucide-react';

export default function Portfolio({ onSelectSkin, currency = 'EUR' }) {
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [steamInput, setSteamInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Manual Add Form State
  const [manualName, setManualName] = useState('');
  const [manualBuyPrice, setManualBuyPrice] = useState('');
  const [manualWear, setManualWear] = useState('Field-Tested');
  const [manualNotes, setManualNotes] = useState('');

  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPortfolio();
      if (res) setPortfolio(res);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleImportSteam = async (e) => {
    e.preventDefault();
    if (!steamInput.trim()) return;
    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const result = await window.electronAPI.importSteamInventory(steamInput.trim());
      setImportSuccess(`Successfully imported ${result.importedCount} CS2 items into your portfolio!`);
      loadPortfolio();
      setTimeout(() => {
        setShowImportModal(false);
        setSteamInput('');
        setImportSuccess('');
      }, 1500);
    } catch (err) {
      setImportError(err.message || 'Failed to import Steam inventory.');
    } finally {
      setImporting(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    try {
      const marketHashName = `${manualName.trim()} (${manualWear})`;
      await window.electronAPI.addManualPortfolioItem({
        market_hash_name: marketHashName,
        skin_name: manualName.trim(),
        wear_name: manualWear,
        buy_price: parseFloat(manualBuyPrice) || 0,
        notes: manualNotes.trim()
      });

      setShowManualModal(false);
      setManualName('');
      setManualBuyPrice('');
      setManualNotes('');
      loadPortfolio();
    } catch (err) {
      console.error('Error adding manual item:', err);
    }
  };

  const handleRemove = async (id, e) => {
    e.stopPropagation();
    if (confirm('Remove this item from your portfolio?')) {
      await window.electronAPI.removePortfolioItem(id);
      loadPortfolio();
    }
  };

  const summary = portfolio.summary || {
    totalItems: 0,
    totalInvested: 0,
    totalCurrentValue: 0,
    netProfit: 0,
    netReturnPercent: 0
  };

  return (
    <div className="page-body">
      {/* Portfolio Financial Header */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Portfolio Value</span>
            <DollarSign size={16} />
          </div>
          <div className="stat-value">
            {symbol}{summary.totalCurrentValue?.toFixed(2) || '0.00'}
          </div>
          <div className="stat-change neutral">
            <span>{summary.totalItems || 0} skins tracked</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Invested</span>
            <Briefcase size={16} />
          </div>
          <div className="stat-value">
            {symbol}{summary.totalInvested?.toFixed(2) || '0.00'}
          </div>
          <div className="stat-change neutral">
            <span>Cost basis</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Profit / Loss</span>
            {summary.netProfit >= 0 ? <TrendingUp size={16} color="var(--signal-buy)" /> : <TrendingDown size={16} color="var(--signal-sell)" />}
          </div>
          <div className="stat-value" style={{ color: summary.netProfit >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)' }}>
            {summary.netProfit >= 0 ? '+' : ''}{symbol}{summary.netProfit?.toFixed(2) || '0.00'}
          </div>
          <div className={`stat-change ${summary.netProfit >= 0 ? 'positive' : 'negative'}`}>
            <span>{summary.netProfit >= 0 ? '+' : ''}{summary.netReturnPercent?.toFixed(1) || '0.0'}% ROI</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
            Inventory Asset Ledger
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time skin valuations & unrealized capital gains
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Download size={14} />
            Import Steam Inventory
          </button>
          <button className="btn btn-primary" onClick={() => setShowManualModal(true)}>
            <Plus size={14} />
            Add Skin Manually
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your portfolio items...
        </div>
      ) : portfolio.items.length === 0 ? (
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
          <Briefcase size={36} color="var(--text-muted)" />
          <h3 style={{ color: '#fff' }}>No Skins in Portfolio Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.88rem' }}>
            Import your public CS2 inventory by pasting your SteamID or custom profile URL, or add skins manually with purchase price.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
              Import Steam Inventory
            </button>
            <button className="btn btn-secondary" onClick={() => setShowManualModal(true)}>
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Wear / Rarity</th>
                <th>Buy Price</th>
                <th>Market Value</th>
                <th>Unrealized P&L</th>
                <th>Source</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.items.map((item) => (
                <tr 
                  key={item.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectSkin && onSelectSkin({ market_hash_name: item.market_hash_name, name: item.skin_name, image: item.image, rarity_name: item.rarity_name, wear_name: item.wear_name })}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.skin_name} 
                          style={{ width: '44px', height: '34px', objectFit: 'contain' }} 
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{item.skin_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.weapon}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="badge badge-wear">{item.wear_name || 'Standard'}</span>
                      {item.rarity_name && (
                        <span className="badge badge-rarity" style={{ '--rarity-color': item.rarity_color }}>
                          {item.rarity_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.buy_price > 0 ? `${symbol}${item.buy_price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                    {symbol}{item.current_price?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.buy_price > 0 ? (
                      <span style={{ color: item.profit_loss >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)', fontWeight: 600 }}>
                        {item.profit_loss >= 0 ? '+' : ''}{symbol}{item.profit_loss.toFixed(2)} ({item.profit_percent}%)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Set Buy Price</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {item.source === 'steam_import' ? 'Steam Sync' : 'Manual'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={(e) => handleRemove(item.id, e)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Steam Inventory Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#fff' }}>Import Steam CS2 Inventory</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <form onSubmit={handleImportSteam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Enter your 17-digit <strong>SteamID64</strong> (e.g. <code>76561198000000000</code>) or your Steam profile link / custom vanity URL.
                </p>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.78rem', color: '#a5b4fc' }}>
                  💡 <strong>Note:</strong> Your CS2 inventory must be set to <strong>Public</strong> in your Steam Privacy Settings. No password or login required.
                </div>

                <input 
                  type="text"
                  className="search-input"
                  placeholder="https://steamcommunity.com/id/yourname or 7656119..."
                  value={steamInput}
                  onChange={(e) => setSteamInput(e.target.value)}
                  style={{ paddingLeft: '14px' }}
                  required
                />

                {importError && (
                  <div style={{ color: 'var(--signal-sell)', fontSize: '0.82rem', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    {importError}
                  </div>
                )}
                {importSuccess && (
                  <div style={{ color: 'var(--signal-buy)', fontSize: '0.82rem', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    {importSuccess}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? 'Importing Inventory...' : 'Fetch Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Skin Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#fff' }}>Add Skin to Portfolio</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowManualModal(false)}>✕</button>
            </div>
            <form onSubmit={handleManualAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Skin Full Name (e.g. AK-47 | Redline)
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    placeholder="AK-47 | Redline"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Wear Exterior
                    </label>
                    <select 
                      className="select-input" 
                      style={{ width: '100%' }}
                      value={manualWear}
                      onChange={(e) => setManualWear(e.target.value)}
                    >
                      <option value="Factory New">Factory New</option>
                      <option value="Minimal Wear">Minimal Wear</option>
                      <option value="Field-Tested">Field-Tested</option>
                      <option value="Well-Worn">Well-Worn</option>
                      <option value="Battle-Scarred">Battle-Scarred</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Buy Price ({symbol})
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      className="search-input"
                      placeholder="e.g. 24.50"
                      value={manualBuyPrice}
                      onChange={(e) => setManualBuyPrice(e.target.value)}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Personal Notes / Stickers / Float
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    placeholder="e.g. 4x MOUZ Holo, 0.16 float"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Portfolio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
