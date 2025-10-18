import { Request, Response } from "express";
import { browserUseService } from "../services/browserUseService.js";

export const marketDataController = {
  async getFXRates(req: Request, res: Response) {
    try {
      const baseCurrency = (req.query.base as string) || "USD";
      const rates = await browserUseService.getFXRates(baseCurrency);
      res.json({ success: true, data: rates });
    } catch (error: any) {
      console.error("Error fetching FX rates:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMarketYields(_req: Request, res: Response) {
    try {
      const yields = await browserUseService.getMarketYields();
      res.json({ success: true, data: yields });
    } catch (error: any) {
      console.error("Error fetching market yields:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getEconomicIndicators(_req: Request, res: Response) {
    try {
      const indicators = await browserUseService.scrapeEconomicIndicators();
      res.json({ success: true, data: indicators });
    } catch (error: any) {
      console.error("Error fetching economic indicators:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
