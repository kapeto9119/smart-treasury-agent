import { Router } from "express";
import { accountsController } from "../controllers/accountsController.js";
import { forecastController } from "../controllers/forecastController.js";
import { policyController } from "../controllers/policyController.js";
import { scenariosController } from "../controllers/scenariosController.js";
import { transfersController } from "../controllers/transfersController.js";
import { marketDataController } from "../controllers/marketDataController.js";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Smart Treasury API is running" });
});

// Public routes (with optional auth in dev mode)
// In production, you'd want stricter auth

// Accounts routes
router.get("/accounts", accountsController.getAll);
router.get("/accounts/:id", accountsController.getById);
router.post("/accounts", accountsController.create);
router.patch("/accounts/:id/balance", accountsController.updateBalance);

// Forecast routes
router.get("/forecast", forecastController.getAll);
router.post("/forecast", forecastController.create);

// Policy routes
router.get("/policy", policyController.getActive);
router.post("/policy", policyController.create);

// Scenarios routes
router.post("/scenarios/run", scenariosController.runScenarios);
router.get("/scenarios/stats", scenariosController.getStats);
router.get("/scenarios/:id", scenariosController.getScenario);
router.get("/scenarios", scenariosController.getRecent);

// Transfers routes
router.get("/transfers", transfersController.getAll);
router.post("/transfers", transfersController.create);
router.post("/transfers/:id/execute", transfersController.execute);

// Evaluation routes - removed for now (add evalController if needed)

// Market data routes
router.get("/fx-rates", marketDataController.getFXRates);
router.get("/market-yields", marketDataController.getMarketYields);
router.get("/economic-indicators", marketDataController.getEconomicIndicators);

export default router;
