import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";
import type {
  Account,
  Forecast,
  Policy,
  ScenarioRun,
  Transfer,
  EvalLog,
  User,
} from "../types/index.js";

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await this.client
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAccountById(id: string): Promise<Account | null> {
    const { data, error } = await this.client
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async createAccount(
    account: Omit<Account, "id" | "created_at" | "updated_at">
  ): Promise<Account> {
    const { data, error } = await this.client
      .from("accounts")
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAccountBalance(id: string, balance: number): Promise<Account> {
    const { data, error } = await this.client
      .from("accounts")
      .update({ balance, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Forecast
  async getForecast(days: number = 30): Promise<Forecast[]> {
    const startDate = new Date().toISOString().split("T")[0];
    const { data, error } = await this.client
      .from("forecast")
      .select("*")
      .gte("date", startDate)
      .order("date", { ascending: true })
      .limit(days);

    if (error) throw error;
    return data || [];
  }

  async createForecast(
    forecast: Omit<Forecast, "id" | "created_at">
  ): Promise<Forecast> {
    const { data, error } = await this.client
      .from("forecast")
      .insert(forecast)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Policy
  async getActivePolicy(): Promise<Policy | null> {
    const { data, error } = await this.client
      .from("policy")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  async createPolicy(
    policy: Omit<Policy, "id" | "created_at" | "updated_at">
  ): Promise<Policy> {
    const { data, error } = await this.client
      .from("policy")
      .insert(policy)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Scenario Runs
  async createScenarioRun(
    scenario: Omit<ScenarioRun, "id" | "created_at">
  ): Promise<ScenarioRun> {
    const { data, error } = await this.client
      .from("scenario_runs")
      .insert(scenario)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScenarioRun(
    id: string,
    updates: Partial<ScenarioRun>
  ): Promise<ScenarioRun> {
    const { data, error } = await this.client
      .from("scenario_runs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getScenarioRun(id: string): Promise<ScenarioRun | null> {
    const { data, error } = await this.client
      .from("scenario_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async getRecentScenarioRuns(limit: number = 10): Promise<ScenarioRun[]> {
    const { data, error } = await this.client
      .from("scenario_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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
    // Get counts by status
    const { data: allScenarios, error: countError } = await this.client
      .from("scenario_runs")
      .select("*");

    if (countError) throw countError;

    const scenarios = allScenarios || [];
    const total = scenarios.length;
    const pending = scenarios.filter((s) => s.status === "pending").length;
    const running = scenarios.filter((s) => s.status === "running").length;
    const completed = scenarios.filter((s) => s.status === "completed").length;
    const failed = scenarios.filter((s) => s.status === "failed").length;

    // Calculate average duration for completed scenarios
    const completedWithDuration = scenarios.filter(
      (s) => s.status === "completed" && s.completed_at
    );

    let avgDurationSeconds: number | null = null;
    if (completedWithDuration.length > 0) {
      const totalDuration = completedWithDuration.reduce((sum, s) => {
        const start = new Date(s.created_at).getTime();
        const end = new Date(s.completed_at!).getTime();
        return sum + (end - start) / 1000; // Convert to seconds
      }, 0);
      avgDurationSeconds = totalDuration / completedWithDuration.length;
    }

    // Get recent activity (last 20)
    const { data: recentActivity, error: recentError } = await this.client
      .from("scenario_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentError) throw recentError;

    return {
      total,
      pending,
      running,
      completed,
      failed,
      avgDurationSeconds,
      recentActivity: recentActivity || [],
    };
  }

  // Transfers
  async createTransfer(
    transfer: Omit<Transfer, "id" | "created_at">
  ): Promise<Transfer> {
    const { data, error } = await this.client
      .from("transfers")
      .insert(transfer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTransferStatus(
    id: string,
    status: Transfer["status"],
    executed_at?: string
  ): Promise<Transfer> {
    const updates: Partial<Transfer> = { status };
    if (executed_at) updates.executed_at = executed_at;

    const { data, error } = await this.client
      .from("transfers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTransfers(limit: number = 50): Promise<Transfer[]> {
    const { data, error } = await this.client
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getTransferById(id: string): Promise<Transfer | null> {
    const { data, error } = await this.client
      .from("transfers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching transfer:", error);
      return null;
    }
    return data;
  }

  // Eval Logs
  async createEvalLog(
    evalLog: Omit<EvalLog, "id" | "created_at">
  ): Promise<EvalLog> {
    const { data, error } = await this.client
      .from("eval_logs")
      .insert(evalLog)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEvalLogsByScenario(scenarioId: string): Promise<EvalLog[]> {
    const { data, error } = await this.client
      .from("eval_logs")
      .select("*")
      .eq("scenario_id", scenarioId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRecentEvalLogs(limit: number = 20): Promise<EvalLog[]> {
    const { data, error } = await this.client
      .from("eval_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  async createUser(user: Omit<User, "id" | "created_at">): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserLastLogin(id: string): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const supabaseService = new SupabaseService();
