import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Package
} from "lucide-react";

export default function Portfolio({ onSelectSkin, currency = "EUR" }) {
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [steamInput, setSteamInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  // Manual Add Form State
  const [manualName, setManualName] = useState("");
  const [manualBuyPrice, setManualBuyPrice] = useState("");
  const [manualWear, setManualWear] = useState("Field-Tested");
  const [manualNotes, setManualNotes] = useState("");
  const [manualStatTrak, setManualStatTrak] = useState(false);

  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await window.electronAPI.getPortfolio();
      if (res) setPortfolio(res);
    } catch (err) {
      console.error("Error loading portfolio:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await window.electronAPI.refreshPortfolioPrices(currency);
      await loadPortfolio();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleImportSteam = async (e) => {
    e.preventDefault();
    const val = steamInput.trim();
    if (!val) return;
    setImporting(true);
    setImportError("");
    setImportSuccess("");

    try {
      const result = await window.electronAPI.importSteamInventory(val);
      setImportSuccess(
        `Imported ${result.importedCount} new skin${result.importedCount !== 1 ? "s" : ""} from ${result.totalFound} found in inventory!`
      );
      loadPortfolio();
      setTimeout(() => {
        setShowImportModal(false);
        setSteamInput("");
        setImportSuccess("");
      }, 2000);
    } catch (err) {
      setImportError(err.message || "Failed to import Steam inventory.");
    } finally {
      setImporting(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const baseName = manualName.trim();
    if (!baseName) return;

    try {
      await window.electronAPI.addManualPortfolioItem({
        skin_name: baseName,
        market_hash_name: baseName,   // service will append wear if needed
        wear_name: manualWear,
        buy_price: parseFloat(manualBuyPrice) || 0,
        stattrak: manualStatTrak ? 1 : 0,
        notes: manualNotes.trim()
      });

      setShowManualModal(false);
      setManualName("");
      setManualBuyPrice("");
      setManualNotes("");
      setManualStatTrak(false);
      loadPortfolio();
    } catch (err) {
      console.error("Error adding manual item:", err);
    }
  };

  const handleRemove = async (id, e) => {
    e.stopPropagation();
    if (confirm("Remove this item from your portfolio?")) {
      await window.electronAPI.removePortfolioItem(id);
      loadPortfolio();
    }
  };

  const summary = portfolio.summary || {
    totalItems: 0,
    totalInvested: 0,
    totalCurrentValue: 0,
    netProfit: 0,
    netReturnPercent: 0,
    totalChange24h: 0,
    totalChange24hPercent: 0
  };

  const fmt = (n) => {
    if (n == null) return "—";
    return `${sym}${Math.abs(n).toFixed(2)}`;
  };

  const Change24hBadge = ({ change, pct, size = "sm" }) => {
    if (change === null || change === undefined) return <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>;
    const up = change >= 0;
    const color = up ? "var(--signal-buy)" : "var(--signal-sell)";
    const Arrow = up ? ArrowUpRight : ArrowDownRight;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "2px",
        color, fontSize: size === "lg" ? "0.9rem" : "0.75rem", fontWeight: 600
      }}>
        <Arrow size={size === "lg" ? 15 : 12} />
        {up ? "+" : "-"}{sym}{Math.abs(change).toFixed(2)}
        {pct !== null && pct !== undefined && (
          <span style={{ opacity: 0.75 }}>({up ? "+" : ""}{pct.toFixed(1)}%)</span>
        )}
      </span>
    );
  };

  return (
    <div className="page-body">
      {/* Summary Stats */}
      <div className="stats-grid">
        {/* Portfolio Value */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Portfolio Value</span>
            <DollarSign size={16} />
          </div>
          <div className="stat-value">
            {sym}{summary.totalCurrentValue?.toFixed(2) || "0.00"}
          </div>
          <div className="stat-change neutral" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{summary.totalItems || 0} skins tracked</span>
            {summary.totalChange24h !== undefined && summary.totalChange24h !== 0 && (
              <Change24hBadge change={summary.totalChange24h} pct={summary.totalChange24hPercent} />
            )}
          </div>
        </div>

        {/* Total Invested */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Invested</span>
            <Briefcase size={16} />
          </div>
          <div className="stat-value">
            {sym}{summary.totalInvested?.toFixed(2) || "0.00"}
          </div>
          <div className="stat-change neutral">
            <span>Cost basis</span>
          </div>
        </div>

        {/* P&L */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Unrealized P&amp;L</span>
            {(summary.netProfit || 0) >= 0 ? (
              <TrendingUp size={16} color="var(--signal-buy)" />
            ) : (
              <TrendingDown size={16} color="var(--signal-sell)" />
            )}
          </div>
          <div
            className="stat-value"
            style={{ color: (summary.netProfit || 0) >= 0 ? "var(--signal-buy)" : "var(--signal-sell)" }}
          >
            {(summary.netProfit || 0) >= 0 ? "+" : ""}{sym}{Math.abs(summary.netProfit || 0).toFixed(2)}
          </div>
          <div className={`stat-change ${(summary.netProfit || 0) >= 0 ? "positive" : "negative"}`}>
            <span>
              {(summary.netProfit || 0) >= 0 ? "+" : ""}{summary.netReturnPercent?.toFixed(1) || "0.0"}% ROI
            </span>
          </div>
        </div>

        {/* 24h Change */}
        <div className="stat-card">
          <div className="stat-header">
            <span>24h Change</span>
            <Clock size={16} />
          </div>
          <div
            className="stat-value"
            style={{
              color: (summary.totalChange24h || 0) > 0
                ? "var(--signal-buy)"
                : (summary.totalChange24h || 0) < 0
                ? "var(--signal-sell)"
                : "var(--text-secondary)"
            }}
          >
            {(summary.totalChange24h || 0) > 0 ? "+" : ""}{sym}{(summary.totalChange24h || 0).toFixed(2)}
          </div>
          <div className={`stat-change ${(summary.totalChange24h || 0) >= 0 ? "positive" : "negative"}`}>
            <span>
              {(summary.totalChange24hPercent || 0) >= 0 ? "+" : ""}
              {(summary.totalChange24hPercent || 0).toFixed(1)}% vs yesterday
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "#fff" }}>
            Inventory Asset Ledger
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Real-time skin valuations &amp; unrealized capital gains
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {portfolio.items.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleRefreshPrices}
              disabled={refreshing}
              title="Snapshot current prices for 24h tracking"
            >
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              {refreshing ? "Refreshing..." : "Refresh Prices"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Download size={14} />
            Import Steam
          </button>
          <button className="btn btn-primary" onClick={() => setShowManualModal(true)}>
            <Plus size={14} />
            Add Manually
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
          <div>Loading your portfolio...</div>
        </div>
      ) : portfolio.items.length === 0 ? (
        <div style={{
          background: "var(--bg-glass)",
          border: "1px dashed var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "60px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px"
        }}>
          <Package size={40} color="var(--text-muted)" />
          <h3 style={{ color: "#fff", margin: 0 }}>No Skins in Portfolio Yet</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.88rem", margin: 0 }}>
            Import your public CS2 inventory by pasting your SteamID64 or profile URL, or add skins manually with purchase price.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
              <Download size={14} /> Import Steam Inventory
            </button>
            <button className="btn btn-secondary" onClick={() => setShowManualModal(true)}>
              <Plus size={14} /> Add Manually
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
                <th>Current Value</th>
                <th>24h Change</th>
                <th>Unrealized P&amp;L</th>
                <th>Source</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.items.map((item) => {
                const hasBuyPrice = item.buy_price > 0;
                const plColor = item.profit_loss >= 0 ? "var(--signal-buy)" : "var(--signal-sell)";

                return (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      onSelectSkin &&
                      onSelectSkin({
                        market_hash_name: item.market_hash_name,
                        name: item.skin_name,
                        image: item.image,
                        rarity_name: item.rarity_name,
                        wear_name: item.wear_name
                      })
                    }
                  >
                    {/* Item name + image */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.skin_name}
                            style={{ width: "48px", height: "36px", objectFit: "contain" }}
                          />
                        ) : (
                          <div style={{
                            width: "48px", height: "36px",
                            background: "var(--bg-glass)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <Package size={16} color="var(--text-muted)" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{item.skin_name}</div>
                          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                            {item.weapon || item.item_type || ""}
                            {item.stattrak ? " • StatTrak™" : ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Wear / Rarity */}
                    <td>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {item.wear_name && (
                          <span className="badge badge-wear">{item.wear_name}</span>
                        )}
                        {item.rarity_name && (
                          <span
                            className="badge badge-rarity"
                            style={{ "--rarity-color": item.rarity_color || "#b0c3d9" }}
                          >
                            {item.rarity_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Buy Price */}
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {hasBuyPrice ? `${sym}${item.buy_price.toFixed(2)}` : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Not set</span>}
                    </td>

                    {/* Current Market Value */}
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      <div style={{ fontWeight: 700, color: "#fff" }}>
                        {item.current_price > 0 ? `${sym}${item.current_price.toFixed(2)}` : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No price data</span>
                        )}
                      </div>
                      {item.price_source && (
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                          via {item.price_source}
                        </div>
                      )}
                    </td>

                    {/* 24h Change */}
                    <td>
                      <Change24hBadge change={item.change_24h} pct={item.change_24h_percent} />
                    </td>

                    {/* Unrealized P&L */}
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {hasBuyPrice ? (
                        <span style={{ color: plColor, fontWeight: 600 }}>
                          {item.profit_loss >= 0 ? "+" : ""}{sym}{Math.abs(item.profit_loss).toFixed(2)}
                          <span style={{ opacity: 0.75, fontSize: "0.8em" }}>
                            {" "}({item.profit_loss >= 0 ? "+" : ""}{item.profit_percent}%)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Set buy price</span>
                      )}
                    </td>

                    {/* Source */}
                    <td>
                      <span style={{
                        fontSize: "0.73rem",
                        textTransform: "capitalize",
                        color: "var(--text-secondary)"
                      }}>
                        {item.source === "steam_import" ? "Steam Sync" : "Manual"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={(e) => handleRemove(item.id, e)}
                        title="Remove from portfolio"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* === Import Steam Inventory Modal === */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 style={{ color: "#fff" }}>Import CS2 Steam Inventory</h3>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <form onSubmit={handleImportSteam}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Enter your 17-digit <strong>SteamID64</strong> (e.g.{" "}
                  <code>76561198000000000</code>) or your Steam profile URL.
                </p>

                <div style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  fontSize: "0.78rem",
                  color: "#a5b4fc"
                }}>
                  💡 <strong>Note:</strong> Your CS2 inventory must be set to{" "}
                  <strong>Public</strong> in Steam Privacy Settings. No password required.
                </div>

                <input
                  type="text"
                  className="search-input"
                  placeholder="https://steamcommunity.com/id/yourname  or  76561198..."
                  value={steamInput}
                  onChange={(e) => setSteamInput(e.target.value)}
                  style={{ paddingLeft: "14px" }}
                  required
                  autoFocus
                />

                {importError && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: "8px",
                    color: "var(--signal-sell)", fontSize: "0.82rem",
                    padding: "10px 12px",
                    background: "rgba(239,68,68,0.1)",
                    borderRadius: "var(--radius-sm)"
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                    {importError}
                  </div>
                )}
                {importSuccess && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    color: "var(--signal-buy)", fontSize: "0.82rem",
                    padding: "10px 12px",
                    background: "rgba(16,185,129,0.1)",
                    borderRadius: "var(--radius-sm)"
                  }}>
                    <CheckCircle2 size={15} />
                    {importSuccess}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? (
                    <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Importing...</>
                  ) : (
                    <><Download size={13} /> Fetch Inventory</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Manual Add Skin Modal === */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ color: "#fff" }}>Add Skin to Portfolio</h3>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowManualModal(false)}>✕</button>
            </div>
            <form onSubmit={handleManualAdd}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Skin Full Name *
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="e.g. AK-47 | Redline"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={{ paddingLeft: "14px" }}
                    required
                    autoFocus
                  />
                  <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Use the exact market name. Wear will be appended automatically.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Wear Exterior
                    </label>
                    <select
                      className="select-input"
                      style={{ width: "100%" }}
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
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Buy Price ({sym})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="search-input"
                      placeholder="e.g. 24.50"
                      value={manualBuyPrice}
                      onChange={(e) => setManualBuyPrice(e.target.value)}
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Notes / Float / Stickers
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="e.g. 4x MOUZ Holo, 0.16 float"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    style={{ paddingLeft: "14px" }}
                  />
                </div>

                <label style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  fontSize: "0.84rem", color: "var(--text-secondary)", cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={manualStatTrak}
                    onChange={(e) => setManualStatTrak(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }}
                  />
                  StatTrak™ version
                </label>

                {manualName.trim() && (
                  <div style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "#a5b4fc"
                  }}>
                    Market key: <strong>
                      {manualStatTrak ? "StatTrak™ " : ""}{manualName.trim()}{!manualName.trim().includes("(") ? ` (${manualWear})` : ""}
                    </strong>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={13} /> Save to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}