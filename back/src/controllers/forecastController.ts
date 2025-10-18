import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";

export const forecastController = {
  async getAll(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const forecast = await supabaseService.getForecast(days);
      res.json({ success: true, data: forecast });
    } catch (error: any) {
      console.error("Error fetching forecast:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const forecast = await supabaseService.createForecast(req.body);
      res.status(201).json({ success: true, data: forecast });
    } catch (error: any) {
      console.error("Error creating forecast:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
