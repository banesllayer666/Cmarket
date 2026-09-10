import { getDb } from '../database.js';
import { skinportService } from './skinport-service.js';

export class AnalysisEngine {
  async analyzeSkin(marketHashName, currency = 'EUR') {
    const db = getDb();

    // 1. Get prices from memory store
    const steamKey = `${marketHashName}__steam`;
    const skinportKey = `${marketHashName}__skinport`;

    const steamRow = db.prices.get(steamKey);
    const skinportRow = db.prices.get(skinportKey);

    const historyPoints = db.priceHistory.get(marketHashName) || [];

    // 2. Fetch official multi-period sales history from Skinport (24h, 7d, 30d, 90d)
    const salesData = await skinportService.getSalesHistory(marketHashName, currency);

    let steamPrice = steamRow?.price || null;
    let skinportPrice = skinportRow?.price || null;

    let currentPrice = skinportPrice || steamPrice || 0;

    if (currentPrice === 0 && salesData) {
      currentPrice = salesData.last_24_hours?.avg || salesData.last_7_days?.avg || salesData.last_30_days?.avg || 0;
    }

    const avg24h = salesData?.last_24_hours?.avg || currentPrice;
    const avg7d = salesData?.last_7_days?.avg || avg24h;
    const avg30d = salesData?.last_30_days?.avg || avg7d;
    const avg90d = salesData?.last_90_days?.avg || avg30d;

    const min90d = salesData?.last_90_days?.min || (currentPrice * 0.85);
    const max90d = salesData?.last_90_days?.max || (currentPrice * 1.15);
    const vol90d = salesData?.last_90_days?.volume || 0;
    const vol30d = salesData?.last_30_days?.volume || 0;
    const vol7d = salesData?.last_7_days?.volume || 0;

    let percentile90d = 50;
    if (max90d > min90d && currentPrice >= min90d) {
      percentile90d = Math.min(100, Math.max(0, ((currentPrice - min90d) / (max90d - min90d)) * 100));
    }

    const change7d = avg7d > 0 ? ((currentPrice - avg7d) / avg7d) * 100 : 0;
    const change30d = avg30d > 0 ? ((currentPrice - avg30d) / avg30d) * 100 : 0;
    const change90d = avg90d > 0 ? ((currentPrice - avg90d) / avg90d) * 100 : 0;

    let spreadVsSteam = 0;
    if (steamPrice && skinportPrice && steamPrice > 0) {
      spreadVsSteam = ((steamPrice - skinportPrice) / steamPrice) * 100;
    }

    let signal = 'WAIT';
    let signalColor = '#f59e0b';
    let confidence = 70;
    const reasons = [];

    if (currentPrice > 0) {
      if (change30d <= -15 && percentile90d <= 20) {
        signal = 'STRONG_BUY';
        signalColor = '#10b981';
        confidence = 88;
        reasons.push(`Price is heavily discounted: ${Math.abs(change30d).toFixed(1)}% below 30-day average.`);
        reasons.push(`Sitting at the bottom ${percentile90d.toFixed(0)}% of its 90-day price channel.`);
        if (vol30d > 10) reasons.push(`High liquidity with ${vol30d} confirmed sales in last 30 days.`);
      } else if (change30d < -5 || percentile90d <= 35) {
        signal = 'BUY';
        signalColor = '#34d399';
        confidence = 78;
        reasons.push(`Favorable entry opportunity: ${Math.abs(change30d).toFixed(1)}% below 30-day baseline.`);
        reasons.push(`Near lower bounds of 90-day cycle (${percentile90d.toFixed(0)}th percentile).`);
      } else if (change30d >= 25 && percentile90d >= 90) {
        signal = 'STRONG_SELL';
        signalColor = '#ef4444';
        confidence = 90;
        reasons.push(`Overbought bubble territory: +${change30d.toFixed(1)}% above 30-day average!`);
        reasons.push(`Trading at the extreme peak (${percentile90d.toFixed(0)}th percentile) of 90-day range.`);
        reasons.push('High probability of short-term mean reversion and price pullback.');
      } else if (change30d >= 10 || percentile90d >= 75) {
        signal = 'SELL';
        signalColor = '#f87171';
        confidence = 75;
        reasons.push(`Skin has surged +${change30d.toFixed(1)}% over 30-day average.`);
        reasons.push(`Approaching historical resistance at ${percentile90d.toFixed(0)}th percentile.`);
        reasons.push('Ideal opportunity to lock in profits.');
      } else {
        signal = 'WAIT';
        signalColor = '#f59e0b';
        confidence = 68;
        reasons.push('Market is in consolidation equilibrium within normal moving averages.');
        reasons.push(`Current price is within ${Math.abs(change30d).toFixed(1)}% of 30-day baseline.`);
        reasons.push('Wait for a clear directional breakout or deep dip before entering.');
      }

      if (spreadVsSteam >= 20) {
        reasons.push(`Arbitrage opportunity: Listed ~${spreadVsSteam.toFixed(1)}% cheaper than Steam Community Market.`);
      }
    } else {
      reasons.push('Insufficient current price data to generate conclusive signal.');
      confidence = 30;
    }

    const chartSeries = this.buildTimeline(currentPrice, avg7d, avg30d, avg90d, min90d, max90d, historyPoints);

    return {
      marketHashName,
      currency,
      currentPrice: Math.round(currentPrice * 100) / 100,
      steamPrice: steamPrice ? Math.round(steamPrice * 100) / 100 : null,
      skinportPrice: skinportPrice ? Math.round(skinportPrice * 100) / 100 : null,
      spreadVsSteam: Math.round(spreadVsSteam * 10) / 10,
      signal,
      signalColor,
      confidence,
      reasons,
      metrics: {
        avg24h: Math.round(avg24h * 100) / 100,
        avg7d: Math.round(avg7d * 100) / 100,
        avg30d: Math.round(avg30d * 100) / 100,
        avg90d: Math.round(avg90d * 100) / 100,
        min90d: Math.round(min90d * 100) / 100,
        max90d: Math.round(max90d * 100) / 100,
        change7d: Math.round(change7d * 10) / 10,
        change30d: Math.round(change30d * 10) / 10,
        change90d: Math.round(change90d * 10) / 10,
        percentile90d: Math.round(percentile90d),
        vol7d,
        vol30d,
        vol90d
      },
      chartSeries
    };
  }

  buildTimeline(currentPrice, avg7d, avg30d, avg90d, min90d, max90d, historyPoints) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const points = [];
    if (historyPoints && historyPoints.length >= 2) {
      for (const pt of historyPoints) {
        points.push({
          date: new Date(pt.timestamp).toLocaleDateString(),
          timestamp: pt.timestamp,
          price: pt.price,
          source: pt.source
        });
      }
    } else {
      points.push({ date: new Date(now - 90 * dayMs).toLocaleDateString(), price: avg90d });
      points.push({ date: new Date(now - 60 * dayMs).toLocaleDateString(), price: (avg90d + avg30d) / 2 });
      points.push({ date: new Date(now - 30 * dayMs).toLocaleDateString(), price: avg30d });
      points.push({ date: new Date(now - 14 * dayMs).toLocaleDateString(), price: (avg30d + avg7d) / 2 });
      points.push({ date: new Date(now - 7 * dayMs).toLocaleDateString(), price: avg7d });
      points.push({ date: new Date(now - 1 * dayMs).toLocaleDateString(), price: (avg7d + currentPrice) / 2 });
      points.push({ date: new Date(now).toLocaleDateString(), price: currentPrice });
    }

    return points;
  }
}

export const analysisEngine = new AnalysisEngine();
