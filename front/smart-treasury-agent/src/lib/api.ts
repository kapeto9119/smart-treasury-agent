import axios, { AxiosInstance } from "axios";
import type {
  Account,
  Forecast,
  Policy,
  ScenarioRun,
  Transfer,
  EvalLog,
  FXRate,
  MarketYields,
  APIResponse,
  ScenarioConfig,
} from "@/types";

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      // In production, add auth token from WorkOS
      // const token = getAuthToken();
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const { data } = await this.client.get<APIResponse<Account[]>>("/accounts");
    return data.data || [];
  }

  async getAccount(id: string): Promise<Account> {
    const { data } = await this.client.get<APIResponse<Account>>(
      `/accounts/${id}`
    );
    if (!data.data) throw new Error("Account not found");
    return data.data;
  }

  async createAccount(
    account: Omit<Account, "id" | "created_at" | "updated_at">
  ): Promise<Account> {
    const { data } = await this.client.post<APIResponse<Account>>(
      "/accounts",
      account
    );
    if (!data.data) throw new Error("Failed to create account");
    return data.data;
  }

  // Forecast
  async getForecast(days: number = 30): Promise<Forecast[]> {
    const { data } = await this.client.get<APIResponse<Forecast[]>>(
      "/forecast",
      {
        params: { days },
      }
    );
    return data.data || [];
  }

  async createForecast(
    forecast: Omit<Forecast, "id" | "created_at">
  ): Promise<Forecast> {
    const { data } = await this.client.post<APIResponse<Forecast>>(
      "/forecast",
      forecast
    );
    if (!data.data) throw new Error("Failed to create forecast");
    return data.data;
  }

  // Policy
  async getActivePolicy(): Promise<Policy> {
    const { data } = await this.client.get<APIResponse<Policy>>("/policy");
    if (!data.data) throw new Error("No active policy found");
    return data.data;
  }

  async createPolicy(
    policy: Omit<Policy, "id" | "created_at" | "updated_at">
  ): Promise<Policy> {
    const { data } = await this.client.post<APIResponse<Policy>>(
      "/policy",
      policy
    );
    if (!data.data) throw new Error("Failed to create policy");
    return data.data;
  }

  // Scenarios
  async runScenarios(
    modes?: string[]
  ): Promise<{ scenarioIds: string[]; message: string }> {
    const { data } = await this.client.post<
      APIResponse<{ scenarioIds: string[]; message: string }>
    >("/scenarios/run", { modes });
    if (!data.data) throw new Error("Failed to run scenarios");
    return data.data;
  }

  async runScenariosWithConfig(
    config: ScenarioConfig
  ): Promise<{ scenarioIds: string[]; message: string }> {
    const { data } = await this.client.post<
      APIResponse<{ scenarioIds: string[]; message: string }>
    >("/scenarios/run", config);
    if (!data.data) throw new Error("Failed to run scenarios");
    return data.data;
  }

  async getScenario(id: string): Promise<ScenarioRun> {
    const { data } = await this.client.get<APIResponse<ScenarioRun>>(
      `/scenarios/${id}`
    );
    if (!data.data) throw new Error("Scenario not found");
    return data.data;
  }

  async getRecentScenarios(limit: number = 10): Promise<ScenarioRun[]> {
    const { data } = await this.client.get<APIResponse<ScenarioRun[]>>(
      "/scenarios",
      {
        params: { limit },
      }
    );
    return data.data || [];
  }

  async getScenarioStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    avgDurationSeconds: number | null;
    recentActivity: ScenarioRun[];
  }> {
    const { data } = await this.client.get<
      APIResponse<{
        total: number;
        pending: number;
        running: number;
        completed: number;
        failed: number;
        avgDurationSeconds: number | null;
        recentActivity: ScenarioRun[];
      }>
    >("/scenarios/stats");
    if (!data.data) throw new Error("Failed to fetch scenario stats");
    return data.data;
  }

  // Transfers
  async getTransfers(limit: number = 50): Promise<Transfer[]> {
    const { data } = await this.client.get<APIResponse<Transfer[]>>(
      "/transfers",
      {
        params: { limit },
      }
    );
    return data.data || [];
  }

  async createTransfer(
    transfer: Omit<Transfer, "id" | "created_at" | "status">
  ): Promise<Transfer> {
    const { data } = await this.client.post<APIResponse<Transfer>>(
      "/transfers",
      transfer
    );
    if (!data.data) throw new Error("Failed to create transfer");
    return data.data;
  }

  async executeTransfer(id: string): Promise<Transfer> {
    const { data } = await this.client.post<APIResponse<Transfer>>(
      `/transfers/${id}/execute`
    );
    if (!data.data) throw new Error("Failed to execute transfer");
    return data.data;
  }

  // Evaluation
  async getEvalLogs(limit: number = 20): Promise<EvalLog[]> {
    const { data } = await this.client.get<APIResponse<EvalLog[]>>("/eval", {
      params: { limit },
    });
    return data.data || [];
  }

  async getEvalLogsByScenario(scenarioId: string): Promise<EvalLog[]> {
    const { data } = await this.client.get<APIResponse<EvalLog[]>>(
      `/eval/scenario/${scenarioId}`
    );
    return data.data || [];
  }

  // Market Data
  async getFXRates(baseCurrency: string = "USD"): Promise<FXRate[]> {
    const { data } = await this.client.get<APIResponse<FXRate[]>>("/fx-rates", {
      params: { base: baseCurrency },
    });
    return data.data || [];
  }

  async getMarketYields(): Promise<MarketYields> {
    const { data } = await this.client.get<APIResponse<MarketYields>>(
      "/market-yields"
    );
    if (!data.data) throw new Error("Failed to fetch market yields");
    return data.data;
  }
}

export const api = new APIClient();
