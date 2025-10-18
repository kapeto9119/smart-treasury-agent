import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";

export const transfersController = {
  async getAll(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transfers = await supabaseService.getTransfers(limit);
      res.json({ success: true, data: transfers });
    } catch (error: any) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async create(req: Request, res: Response) {
    try {
      const {
        from_account_id,
        to_account_id,
        amount,
        currency,
        scenario_id,
        notes,
      } = req.body;

      // Validate accounts exist
      const fromAccount = await supabaseService.getAccountById(from_account_id);
      const toAccount = await supabaseService.getAccountById(to_account_id);

      if (!fromAccount || !toAccount) {
        return res.status(404).json({
          success: false,
          error: "Account not found",
        });
      }

      // Check sufficient balance
      if (fromAccount.balance < amount) {
        return res.status(400).json({
          success: false,
          error: "Insufficient balance",
        });
      }

      // Create transfer
      const transfer = await supabaseService.createTransfer({
        from_account_id,
        to_account_id,
        amount,
        currency: currency || fromAccount.currency,
        status: "pending",
        scenario_id,
        notes,
      });

      res.status(201).json({ success: true, data: transfer });
    } catch (error: any) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async execute(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get transfer directly by ID
      const transfer = await supabaseService.getTransferById(id);

      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: "Transfer not found",
        });
      }

      if (transfer.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Transfer already processed",
        });
      }

      // Get accounts
      const fromAccount = await supabaseService.getAccountById(
        transfer.from_account_id
      );
      const toAccount = await supabaseService.getAccountById(
        transfer.to_account_id
      );

      if (!fromAccount || !toAccount) {
        return res.status(404).json({
          success: false,
          error: "Account not found",
        });
      }

      // Check balance again
      if (fromAccount.balance < transfer.amount) {
        await supabaseService.updateTransferStatus(id, "failed");
        return res.status(400).json({
          success: false,
          error: "Insufficient balance",
        });
      }

      // Execute transfer
      await supabaseService.updateAccountBalance(
        fromAccount.id,
        fromAccount.balance - transfer.amount
      );

      await supabaseService.updateAccountBalance(
        toAccount.id,
        toAccount.balance + transfer.amount
      );

      // Update transfer status
      const updatedTransfer = await supabaseService.updateTransferStatus(
        id,
        "executed",
        new Date().toISOString()
      );

      res.json({ success: true, data: updatedTransfer });
    } catch (error: any) {
      console.error("Error executing transfer:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },
};
