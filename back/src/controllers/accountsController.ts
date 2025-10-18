import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";

export const accountsController = {
  async getAll(_req: Request, res: Response) {
    try {
      const accounts = await supabaseService.getAccounts();
      res.json({ success: true, data: accounts });
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await supabaseService.getAccountById(id);

      if (!account) {
        return res
          .status(404)
          .json({ success: false, error: "Account not found" });
      }

      res.json({ success: true, data: account });
    } catch (error: any) {
      console.error("Error fetching account:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async create(req: Request, res: Response) {
    try {
      const account = await supabaseService.createAccount(req.body);
      res.status(201).json({ success: true, data: account });
    } catch (error: any) {
      console.error("Error creating account:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { balance } = req.body;

      const account = await supabaseService.updateAccountBalance(id, balance);
      res.json({ success: true, data: account });
    } catch (error: any) {
      console.error("Error updating account balance:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },
};
