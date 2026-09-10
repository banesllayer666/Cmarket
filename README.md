# CS2 Market Analyzer & Trend Engine 🎯📈

An advanced, standalone desktop application built with **Electron + React + Vite** that tracks Counter-Strike 2 skin markets in real time, computes mathematical trend indicators, provides actionable **Buy / Sell / Wait** recommendations, detects sudden price crashes, and manages user inventories and portfolios with live valuations.

![CS2 Market Analyzer](https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/default_generated/weapon_ak47_cu_ak47_cobra_light_png.png)

---

## ⚡ Key Features

- **🌐 Live Market Feeds (Zero Mock Data)**:
  - **Skinport Public API**: Live pricing for **25,400+ skins in EUR** with official **24h, 7d, 30d, and 90d** sales transaction histories.
  - **Steam Community Market API**: Rate-limited queue for querying real-time lowest price, median price, and 24h volume.
  - **Background Price Scheduler**: Automatically synchronizes live market rates every 15 minutes.
- **🖼️ Authentic Steam CDN Renders**:
  - High-resolution skin renders and case icons pulling directly from the official **Steam Akamai CDN** (`community.akamai.steamstatic.com`), matching `stash.clash.gg`.
- **📊 Technical Trend Analysis & Decision Engine**:
  - Computes 7-day, 30-day, and 90-day Simple Moving Averages.
  - Generates price channel percentiles and cross-platform arbitrage spread calculations.
  - Clear signals: **`STRONG BUY`**, **`BUY`**, **`WAIT`**, **`SELL`**, and **`STRONG SELL`**.
- **🚨 Sudden Price Crash Radar**:
  - Automatic detector for flash dumps (default ≥10% drop).
  - Triggers native **OS Desktop Notifications**, in-app toasts, and alert archive.
- **💼 Steam Inventory & Portfolio Ledger**:
  - **1-Click Steam Import**: Enter any public SteamID64 or vanity profile URL—no password or login needed.
  - Real-time portfolio valuation, total cost basis, and net unrealized Profit & Loss in **EUR (€)**.
- **🖥️ 100% Standalone (No External Server)**:
  - Runs natively on your desktop, bypassing browser CORS restrictions.
  - Sub-millisecond indexed queries with persistent local storage.

---

## 🎨 Design System & Rarity Hierarchy

Full fidelity to Counter-Strike 2's visual identity:
- **Contraband (★)**: `#ffd700`
- **Covert**: `#eb4b4b`
- **Classified**: `#d32ce6`
- **Restricted**: `#8847ff`
- **Mil-Spec Grade**: `#4b69ff`
- **Industrial Grade**: `#5e98d9`
- **Consumer Grade**: `#b0c3d9`

Wear Exterior support with exact float bounds:
- **Factory New** (0.00 – 0.07)
- **Minimal Wear** (0.07 – 0.15)
- **Field-Tested** (0.15 – 0.38)
- **Well-Worn** (0.38 – 0.45)
- **Battle-Scarred** (0.45 – 1.00)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation
```bash
# Clone the repository
git clone https://github.com/banesllayer666/cs2-market-analyzer.git

# Navigate to directory
cd cs2-market-analyzer

# Install dependencies
npm install
```

### Running the Application
```bash
npm start
```
Or double-click `run-app.bat` on Windows.

### Building Standalone Executable
```bash
npm run package
```

---

## 📂 Project Structure

```
├── run-app.bat                 # One-click Windows launcher
├── package.json                # Project configuration & dependencies
├── forge.config.js             # Electron Forge packaging configuration
├── vite.main.config.mjs        # Vite main process build configuration
├── vite.preload.config.mjs     # Vite preload build configuration
├── vite.renderer.config.mjs    # Vite renderer build configuration
├── index.html                  # Main application HTML container
└── src/
    ├── main.js                 # Electron main lifecycle & window manager
    ├── preload.js              # Secure contextBridge IPC bridge
    ├── renderer.jsx            # React root mount script
    ├── index.css               # Design system, glassmorphism tokens & animations
    ├── main/
    │   ├── database.js         # Persistent local storage layer
    │   ├── ipc-handlers.js     # IPC endpoints connecting main to renderer
    │   └── services/
    │       ├── catalog-service.js       # ByMykel CSGO-API catalog ingestion
    │       ├── skinport-service.js      # Skinport live quotes & 90d sales
    │       ├── steam-market-service.js  # Steam market queue & rates
    │       ├── analysis-engine.js       # Moving averages & Buy/Sell signals
    │       ├── alert-engine.js          # Price crash detector & notifications
    │       ├── steam-inventory-service.js # SteamID inventory & portfolio
    │       └── price-scheduler.js       # Background periodic refresher
    └── renderer/
        ├── App.jsx             # Main layout, router & global state
        ├── components/
        │   ├── Sidebar.jsx             # Left navigation & live status
        │   ├── SkinCard.jsx            # Card with hover lifts & rarity glow
        │   └── SkinDetailModal.jsx     # Deep dive analytics & comparison
        └── pages/
            ├── Dashboard.jsx           # Overview, flash drop banner, trending
            ├── SkinExplorer.jsx        # Multi-filter search & pagination
            ├── Portfolio.jsx           # Steam inventory import & P&L ledger
            ├── Alerts.jsx              # Price crash radar log
            └── Settings.jsx            # Currency, refresh interval, thresholds
```

---

## 📄 License
MIT License
