# CS2 Market Analyzer — Beta Tester Guide

Welcome to the **CS2 Market Analyzer & Trend Engine** beta! This guide contains everything you need to know to run the application, test its features, and provide feedback.

---

## 🚀 Quick Start (For Testers)

### System Requirements
* **Operating System**: Windows 10 or Windows 11 (64-bit).
* **Dependencies**: **None!** (No Node.js, Python, or external software required).
* **Disk Space**: ~350 MB.

### How to Run
1. Unzip `cs-win32-x64-1.0.0.zip` anywhere on your computer (e.g. Desktop or Downloads).
2. Open the extracted folder `cs-win32-x64`.
3. Double-click **`cs.exe`**.
4. The application will launch instantly with the full database pre-loaded!

---

## ⚡ What Makes This Build Special?

* **Instant Offline Catalog**: The app includes a pre-seeded offline catalog of **20,502 items** (weapons, wear variants, stickers, and agents) and **25,000+ cached prices**.
* **Zero Initial Setup**: You don't have to wait for any multi-minute downloads on first launch—everything opens in milliseconds.
* **Auto-Refreshing Background Engine**: If connected to the internet, market prices will automatically refresh periodically in the background.

---

## 🎯 Features to Test

### 1. Item Types Navigation
At the top of the **Skin Explorer**, switch between:
* 🔫 **Weapons & Knives**: Explore all CS2 weapon skins with wear conditions.
* ✨ **Stickers**: Browse over 11,000 tournament, autograph, and team stickers. Filter by effects (**Holo**, **Foil**, **Gold**, **Glitter**, **Paper**).
* 👤 **Agents / Player Skins**: Inspect all 63 player agents with high-resolution model renders, classified by **Terrorist (T)** and **Counter-Terrorist (CT)** teams.

### 2. Wear Search & Float Matrix
* **Smart Search**: Try searching with natural wear abbreviations:
  * `redline ft` $\rightarrow$ AK-47 | Redline (Field-Tested)
  * `asiimov fn` $\rightarrow$ AWP | Asiimov (Factory New)
  * `howl mw` $\rightarrow$ M4A4 | Howl (Minimal Wear)
* **Multi-Wear Comparison Matrix**: Click on any weapon skin to open the **Skin Detail Modal**. You'll see a side-by-side pricing matrix comparing **Factory New (FN)**, **Minimal Wear (MW)**, **Field-Tested (FT)**, **Well-Worn (WW)**, and **Battle-Scarred (BS)** with visual wear bars and available drop pool checks.
* **StatTrak™ Toggle**: Toggle StatTrak on/off to compare standard vs. StatTrak prices across all wears simultaneously.

### 3. Rare Pattern & Seed Valuation Engine
* Click **🔍 Pattern & Seed Lab** in the navigation header or inside any pattern-dependent skin modal.
* **Seed Lookup**: Enter any paint seed from `1` to `1000` to inspect its valuation:
  * **AK-47 Case Hardened**: Seed `#661` ("The Scar" - Tier 0), `#151`, `#670` ("Reverse Scar").
  * **Karambit Case Hardened**: Seed `#387` (100% Playside Blue Gem Tier 0), `#776`, `#888`.
  * **Marble Fade Knives**: Seed `#412` (1st Max Fire & Ice), `#16`, `#146` (2nd Max).
  * **Fade Skins**: Full 100% Fade vs. 90/10 vs. baseline 80%.
  * **Doppler & Gamma Doppler**: Phase 1, Phase 2 ("Pink Galaxy"), Phase 3, Phase 4 ("Max Blue"), and Gemstones (Ruby, Sapphire, Black Pearl, Emerald).
* **Tier Guide**: Browse the searchable tier reference table directly inside the modal.

### 4. Cross-Market Price Aggregation
Inside any skin detail modal, explore the **Multi-Market Comparison** panel:
* Compare prices across **Skinport**, **Steam Community Market**, **CSFloat**, **DMarket**, and **Buff163**.
* Identify arbitrage margins and lowest available listings.

### 5. API Key Sandbox & Custom Integrations
* Go to **Settings $\rightarrow$ API Integrations**.
* Click the **"Load Sandbox / Demo Keys"** button to immediately populate test credentials.
* Click **"Test Connection"** on any market to verify live API connectivity.

### 6. Portfolio & Price Alerts
* **Portfolio**: Track your personal CS2 inventory, purchase prices, current market values, and total profit/loss.
* **Alerts**: Set custom thresholds (e.g. alert me if AK Redline drops below €12.00 or rises above €18.00).

---

## 🛠️ Data Storage & Reset

* Your settings, portfolio, and alerts are stored in:
  `%APPDATA%\cs\data\`
* To perform a complete factory reset, simply close `cs.exe`, delete `%APPDATA%\cs\data`, and re-launch `cs.exe`. The app will auto-seed a fresh database on start.

---

## 📝 Reporting Feedback & Bugs

When reporting an issue, please include:
1. What page or modal you were on.
2. The item name or seed number you were inspecting.
3. A screenshot or brief description of what happened.
