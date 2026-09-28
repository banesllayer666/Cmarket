// DMarket Trading API Client Service
// Official API docs: https://dmarket.com/trading-api

export class DMarketService {
  constructor() {
    this.baseUrl = 'https://api.dmarket.com';
  }

  /**
   * Test connection using provided API keys or check public readiness
   */
  async testConnection(publicKey, secretKey) {
    const startTime = Date.now();

    if (publicKey === 'DEMO_KEY' || publicKey === 'DMARKET_DEMO_KEY') {
      return {
        status: 'success',
        isDemo: true,
        pingMs: 55,
        message: 'Connected to DMarket Sandbox (Demo Mode)',
        balance: { EUR: '245.50', USD: '270.00' }
      };
    }

    if (!publicKey || publicKey.trim() === '') {
      return {
        status: 'standby',
        message: 'No DMarket Key configured. Generate Public + Secret key at dmarket.com/profile -> Trading API.'
      };
    }

    try {
      // Test the public aggregated-prices endpoint
      const res = await fetch(`${this.baseUrl}/marketplace-api/v1/aggregated-prices?limit=1`, {
        headers: {
          'X-Api-Key': publicKey.trim(),
          'User-Agent': 'CS2-Market-Analyzer/1.0'
        }
      });

      const pingMs = Date.now() - startTime;

      if (res.status === 200) {
        return {
          status: 'success',
          pingMs,
          message: 'Connected to DMarket Marketplace API'
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'error',
          pingMs,
          statusCode: res.status,
          message: 'Invalid DMarket API Key or missing signature header.'
        };
      }

      return {
        status: 'success', // If status is 200 or 400 (validation), endpoint is reachable
        pingMs,
        message: `DMarket API reachable (HTTP ${res.status})`
      };
    } catch (err) {
      return {
        status: 'error',
        pingMs: Date.now() - startTime,
        message: `Network error reaching DMarket: ${err.message}`
      };
    }
  }

  /**
   * Fetch estimated price quote from DMarket
   */
  async getQuote(title, currency = 'EUR') {
    try {
      const url = `${this.baseUrl}/marketplace-api/v1/aggregated-prices?titles=${encodeURIComponent(title)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CS2-Market-Analyzer/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        const item = data?.aggregatedPrices?.[0];
        if (item) {
          return {
            price: item.price ? (item.price / 100) : null,
            currency,
            volume: item.orderCount || 0,
            status: 'active'
          };
        }
      }
    } catch (e) {
      // Return null on failure
    }
    return null;
  }
}

export const dmarketService = new DMarketService();
