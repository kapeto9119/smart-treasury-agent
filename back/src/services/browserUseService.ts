import { config } from "../config/env.js";
import type { FXRate } from "../types/index.js";

class BrowserUseService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.browserUse.apiKey;
  }

  async getFXRates(baseCurrency: string = "USD"): Promise<FXRate[]> {
    // For demo purposes, return mock data if no API key
    if (!this.apiKey) {
      return this.getMockFXRates(baseCurrency);
    }

    try {
      // Browser Use Cloud API integration would go here
      // For now, using mock data
      return this.getMockFXRates(baseCurrency);
    } catch (error) {
      console.error("Browser Use API error:", error);
      return this.getMockFXRates(baseCurrency);
    }
  }

  private getMockFXRates(baseCurrency: string): FXRate[] {
    const timestamp = new Date().toISOString();

    const rates: Record<string, Record<string, number>> = {
      USD: {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CHF: 0.88,
      },
      EUR: {
        USD: 1.09,
        GBP: 0.86,
        JPY: 162.8,
        CHF: 0.96,
      },
      GBP: {
        USD: 1.27,
        EUR: 1.16,
        JPY: 189.2,
        CHF: 1.12,
      },
    };

    const baseRates = rates[baseCurrency] || rates.USD;

    return Object.entries(baseRates).map(([to, rate]) => ({
      from: baseCurrency,
      to,
      rate,
      timestamp,
    }));
  }

  async getMarketYields(): Promise<{
    treasuryYield: number;
    mmfYield: number;
    hysa: number;
  }> {
    // Mock market yield data
    return {
      treasuryYield: 4.25, // 10-year Treasury
      mmfYield: 5.1, // Money Market Fund
      hysa: 5.0, // High-Yield Savings
    };
  }

  async scrapeEconomicIndicators(): Promise<{
    fedRate: number;
    inflation: number;
    gdpGrowth: number;
  }> {
    // Mock economic indicators
    return {
      fedRate: 5.25,
      inflation: 3.2,
      gdpGrowth: 2.4,
    };
  }
}

export const browserUseService = new BrowserUseService();
