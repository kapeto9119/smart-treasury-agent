// Type definitions for Smart Treasury Agent Frontend

export interface Account {
  id: string;
  name: string;
  bank: string;
  currency: string;
  balance: number;
  account_type:
    | "checking"
    | "savings"
    | "high_yield"
    | "money_market"
    | "reserve";
  created_at: string;
  updated_at: string;
}

export interface Forecast {
  id: string;
  date: string;
  inflow: number;
  outflow: number;
  description?: string;
  created_at: string;
}

export interface Policy {
  id: string;
  name: string;
  min_liquidity: number;
  invest_above: number;
  risk_profile: "conservative" | "balanced" | "aggressive";
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentAnalysis {
  recommendation: string;
  reasoning: string;
  riskAssessment: string;
  confidence: number;
  agentEnabled: boolean;
  rawResponse?: string;
  error?: string;
}

export interface SimulationMetrics {
  idleCashPct: number;
  liquidityCoverageDays: number;
  estYieldBps: number;
  shortfallRiskPct: number;
  recommendation: string;
  transferDetails?: {
    fromAccount: string;
    toAccount: string;
    amount: number;
  };
  agent?: AgentAnalysis; // AI agent analysis from sandbox
}

export interface ScenarioRun {
  id: string;
  mode: "conservative" | "balanced" | "aggressive" | "custom";
  assumptions?: Record<string, any>;
  metrics?: SimulationMetrics;
  recommendation?: string;
  status: "pending" | "running" | "completed" | "failed";
  sandbox_id?: string;
  preview_url?: string;
  claude_response?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface Transfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency: string;
  status: "pending" | "executed" | "failed" | "cancelled";
  scenario_id?: string;
  executed_at?: string;
  notes?: string;
  created_at: string;
}

export interface EvalLog {
  id: string;
  scenario_id: string;
  confidence: number;
  risk_flag: "low" | "medium" | "high";
  notes?: string;
  metrics?: Record<string, any>;
  created_at: string;
}

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export interface MarketYields {
  treasuryYield: number;
  mmfYield: number;
  hysa: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Adjustable scenario parameters for configurable simulations
export interface ScenarioParameters {
  liquidityThresholdPct?: number; // e.g., 10 = maintain 10% cash buffer
  investmentHorizonDays?: number; // 7, 30, 90 days
  riskAppetite?: "low" | "medium" | "high";
  customRiskMultiplier?: number; // Override default multiplier
  customTransferThreshold?: number; // Override transfer threshold
  fxRates?: Record<string, number>; // Custom FX assumptions (e.g., {"EURUSD": 1.05})
}

// Configuration for running scenarios with custom parameters
export interface ScenarioConfig {
  modes: string[];
  parameters?: ScenarioParameters;
}
