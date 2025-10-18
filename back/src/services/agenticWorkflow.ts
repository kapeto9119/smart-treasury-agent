import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import { browserUseService } from "./browserUseService.js";
import { historicalLearningService } from "./historicalLearningService.js";
import type {
  Account,
  Forecast,
  Policy,
  SimulationOutput,
} from "../types/index.js";

interface WorkflowStep {
  agent: string;
  action: string;
  reasoning: string;
  output: any;
  timestamp: string;
}

interface WorkflowResult {
  finalRecommendation: string;
  confidence: number;
  workflow: WorkflowStep[];
  rationale: string;
}

class AgenticWorkflowService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  async executeWorkflow(
    accounts: Account[],
    forecast: Forecast[],
    policy: Policy,
    simulationResults: Map<string, SimulationOutput>
  ): Promise<WorkflowResult> {
    console.log("🤖 Starting 4-Agent Agentic Workflow...");
    const workflow: WorkflowStep[] = [];

    // AGENT 1: Data Collector
    const marketData = await this.runDataCollectorAgent(workflow);

    // AGENT 2: Historical Analyzer
    const historicalInsights = await this.runHistoricalAnalyzerAgent(workflow);

    // AGENT 3: Scenario Evaluator
    const evaluation = await this.runScenarioEvaluatorAgent(
      accounts,
      forecast,
      policy,
      simulationResults,
      marketData,
      historicalInsights,
      workflow
    );

    // AGENT 4: Decision Maker
    const finalDecision = await this.runDecisionMakerAgent(
      accounts,
      evaluation,
      simulationResults,
      workflow
    );

    console.log("✅ Agentic workflow completed");

    return {
      finalRecommendation: finalDecision.recommendation,
      confidence: finalDecision.confidence,
      rationale: finalDecision.rationale,
      workflow,
    };
  }

  private async runDataCollectorAgent(workflow: WorkflowStep[]): Promise<any> {
    console.log("🤖 Agent 1: Data Collector - Gathering market data...");

    const [fxRates, yields] = await Promise.all([
      browserUseService.getFXRates("USD"),
      browserUseService.getMarketYields(),
    ]);

    const marketData = { fxRates, yields };

    workflow.push({
      agent: "Data Collector",
      action: "gather_market_data",
      reasoning:
        "Collecting current market conditions (FX rates, yields) to provide context for treasury decisions",
      output: marketData,
      timestamp: new Date().toISOString(),
    });

    return marketData;
  }

  private async runHistoricalAnalyzerAgent(
    workflow: WorkflowStep[]
  ): Promise<any> {
    console.log(
      "🤖 Agent 2: Historical Analyzer - Analyzing past performance..."
    );

    const insights = await historicalLearningService.getInsights();

    // Use Claude to interpret the historical data
    const prompt = `You are a historical pattern analyzer for treasury recommendations. Analyze these outcomes:

**Historical Data:**
- Total Recommendations: ${insights.totalRecommendations}
- Execution Rate: ${(insights.executionRate * 100).toFixed(1)}%
- Avg Confidence (Executed): ${insights.avgConfidenceWhenExecuted.toFixed(2)}
- Avg Confidence (Ignored): ${insights.avgConfidenceWhenIgnored.toFixed(2)}
- Yield Prediction Accuracy: ${insights.accuracyMetrics.avgYieldError.toFixed(
      1
    )} bps average error

**Detected Patterns:**
${insights.patterns.map((p) => `- ${p}`).join("\n")}

Based on this historical performance, what lessons should we apply to the current recommendation? What confidence adjustments are warranted? What patterns suggest we should be more or less aggressive?

Respond in 80 words with specific lessons learned.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const analysis =
        response.content[0].type === "text" ? response.content[0].text : "";

      workflow.push({
        agent: "Historical Analyzer",
        action: "analyze_past_outcomes",
        reasoning:
          "Learning from historical execution patterns to inform current decision",
        output: { insights, analysis },
        timestamp: new Date().toISOString(),
      });

      return { insights, analysis };
    } catch (error) {
      console.error("Historical analyzer error:", error);
      workflow.push({
        agent: "Historical Analyzer",
        action: "analyze_past_outcomes",
        reasoning: "Attempted historical analysis",
        output: { insights, analysis: "Insufficient data for analysis" },
        timestamp: new Date().toISOString(),
      });
      return { insights, analysis: "No historical analysis available" };
    }
  }

  private async runScenarioEvaluatorAgent(
    _accounts: Account[],
    _forecast: Forecast[],
    _policy: Policy,
    simulationResults: Map<string, SimulationOutput>,
    marketData: any,
    historicalInsights: any,
    workflow: WorkflowStep[]
  ): Promise<any> {
    console.log("🤖 Agent 3: Scenario Evaluator - Analyzing simulations...");

    const conservative = simulationResults.get("conservative");
    const balanced = simulationResults.get("balanced");
    const aggressive = simulationResults.get("aggressive");

    const prompt = `You are a scenario evaluation specialist. Compare these three treasury simulation modes and recommend the optimal approach:

**CONSERVATIVE MODE:**
- Idle Cash: ${conservative?.idleCashPct.toFixed(1)}%
- Liquidity: ${conservative?.liquidityCoverageDays.toFixed(1)} days
- Yield: ${conservative?.estYieldBps} bps
- Risk: ${conservative?.shortfallRiskPct.toFixed(1)}%

**BALANCED MODE:**
- Idle Cash: ${balanced?.idleCashPct.toFixed(1)}%
- Liquidity: ${balanced?.liquidityCoverageDays.toFixed(1)} days
- Yield: ${balanced?.estYieldBps} bps
- Risk: ${balanced?.shortfallRiskPct.toFixed(1)}%

**AGGRESSIVE MODE:**
- Idle Cash: ${aggressive?.idleCashPct.toFixed(1)}%
- Liquidity: ${aggressive?.liquidityCoverageDays.toFixed(1)} days
- Yield: ${aggressive?.estYieldBps} bps
- Risk: ${aggressive?.shortfallRiskPct.toFixed(1)}%

**Market Context:**
- Current HYSA Yield: ${marketData.yields.hysa}%
- Treasury Yield: ${marketData.yields.treasuryYield}%
- MMF Yield: ${marketData.yields.mmfYield}%

**Historical Context:**
${historicalInsights.analysis}

Which mode is optimal given current market conditions and historical performance? Consider opportunity cost, risk tolerance, and yield potential.

Respond with:
RECOMMENDED_MODE: [conservative/balanced/aggressive]
REASONING: [150 words explaining your choice with specific numbers]
CONFIDENCE: [0-1]`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const modeMatch = text.match(/RECOMMENDED_MODE:\s*(\w+)/);
      const reasoningMatch = text.match(/REASONING:\s*(.+?)(?=CONFIDENCE:|$)/s);
      const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/);

      const evaluation = {
        recommendedMode: modeMatch?.[1] || "balanced",
        reasoning:
          reasoningMatch?.[1]?.trim() || "Balanced approach recommended",
        confidence: parseFloat(confidenceMatch?.[1] || "0.8"),
      };

      workflow.push({
        agent: "Scenario Evaluator",
        action: "evaluate_simulation_modes",
        reasoning:
          "Comparing all three simulation modes against market and historical context",
        output: evaluation,
        timestamp: new Date().toISOString(),
      });

      return evaluation;
    } catch (error) {
      console.error("Scenario evaluator error:", error);
      const fallback = {
        recommendedMode: "balanced",
        reasoning: "Defaulting to balanced approach",
        confidence: 0.7,
      };
      workflow.push({
        agent: "Scenario Evaluator",
        action: "evaluate_simulation_modes",
        reasoning: "Evaluation attempted with fallback",
        output: fallback,
        timestamp: new Date().toISOString(),
      });
      return fallback;
    }
  }

  private async runDecisionMakerAgent(
    accounts: Account[],
    evaluation: any,
    simulationResults: Map<string, SimulationOutput>,
    workflow: WorkflowStep[]
  ): Promise<{
    recommendation: string;
    confidence: number;
    rationale: string;
  }> {
    console.log("🤖 Agent 4: Decision Maker - Final recommendation...");

    const selectedMode = evaluation.recommendedMode;
    const selectedMetrics = simulationResults.get(selectedMode);

    const workflowSummary = workflow
      .map((step) => `**${step.agent}:** ${step.action}\n${step.reasoning}`)
      .join("\n\n");

    const prompt = `You are the FINAL DECISION MAKER for treasury operations. Based on the complete workflow, make your authoritative recommendation:

**WORKFLOW SUMMARY:**
${workflowSummary}

**SCENARIO EVALUATOR'S RECOMMENDATION:**
Mode: ${evaluation.recommendedMode}
Reasoning: ${evaluation.reasoning}
Confidence: ${evaluation.confidence}

**SELECTED MODE METRICS (${selectedMode}):**
- Idle Cash: ${selectedMetrics?.idleCashPct.toFixed(1)}%
- Liquidity: ${selectedMetrics?.liquidityCoverageDays.toFixed(1)} days
- Yield: ${selectedMetrics?.estYieldBps} bps
- Risk: ${selectedMetrics?.shortfallRiskPct.toFixed(1)}%
- Transfer Details: ${
      selectedMetrics?.transferDetails?.amount
        ? `$${selectedMetrics.transferDetails.amount.toLocaleString()} from ${
            selectedMetrics.transferDetails.fromAccount
          } to ${selectedMetrics.transferDetails.toAccount}`
        : "No transfer recommended"
    }

**AVAILABLE ACCOUNTS:**
${accounts
  .map((acc) => `- ${acc.name}: $${acc.balance.toLocaleString()}`)
  .join("\n")}

Make your FINAL EXECUTIVE DECISION. Be specific with dollar amounts, account names, and timing.

Respond with:
RECOMMENDATION: [specific action with exact dollar amounts and account names]
RATIONALE: [100 words explaining the decision with data points]
CONFIDENCE: [0-1]`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const recommendationMatch = text.match(
        /RECOMMENDATION:\s*(.+?)(?=RATIONALE:|$)/s
      );
      const rationaleMatch = text.match(/RATIONALE:\s*(.+?)(?=CONFIDENCE:|$)/s);
      const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/);

      const decision = {
        recommendation:
          recommendationMatch?.[1]?.trim() ||
          selectedMetrics?.recommendation ||
          "Maintain current positions",
        rationale:
          rationaleMatch?.[1]?.trim() ||
          "Based on multi-agent workflow analysis",
        confidence: parseFloat(confidenceMatch?.[1] || "0.8"),
      };

      workflow.push({
        agent: "Decision Maker",
        action: "make_final_decision",
        reasoning:
          "Synthesizing all agent outputs into authoritative final recommendation",
        output: decision,
        timestamp: new Date().toISOString(),
      });

      return decision;
    } catch (error) {
      console.error("Decision maker error:", error);
      const fallback = {
        recommendation:
          selectedMetrics?.recommendation || "Maintain current positions",
        rationale: "Based on simulation results",
        confidence: 0.75,
      };
      workflow.push({
        agent: "Decision Maker",
        action: "make_final_decision",
        reasoning: "Final decision with fallback",
        output: fallback,
        timestamp: new Date().toISOString(),
      });
      return fallback;
    }
  }
}

export const agenticWorkflowService = new AgenticWorkflowService();
