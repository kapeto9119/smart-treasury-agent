import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";

export const evalController = {
  async getRecent(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const evalLogs = await supabaseService.getRecentEvalLogs(limit);
      res.json({ success: true, data: evalLogs });
    } catch (error: any) {
      console.error("Error fetching eval logs:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByScenario(req: Request, res: Response) {
    try {
      const { scenarioId } = req.params;
      const evalLogs = await supabaseService.getEvalLogsByScenario(scenarioId);
      res.json({ success: true, data: evalLogs });
    } catch (error: any) {
      console.error("Error fetching eval logs for scenario:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const evalLog = await supabaseService.createEvalLog(req.body);
      res.status(201).json({ success: true, data: evalLog });
    } catch (error: any) {
      console.error("Error creating eval log:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
