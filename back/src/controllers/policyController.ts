import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";

export const policyController = {
  async getActive(_req: Request, res: Response) {
    try {
      const policy = await supabaseService.getActivePolicy();

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: "No active policy found",
        });
      }

      res.json({ success: true, data: policy });
    } catch (error: any) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async create(req: Request, res: Response) {
    try {
      const policy = await supabaseService.createPolicy(req.body);
      res.status(201).json({ success: true, data: policy });
    } catch (error: any) {
      console.error("Error creating policy:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },
};
