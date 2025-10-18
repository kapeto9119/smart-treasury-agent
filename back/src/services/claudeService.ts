import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import type {
  Account,
  Forecast,
  Policy,
  SimulationMetrics,
} from "../types/index.js";

class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  async generateRecommendation(
    accounts: Account[],
    forecast: Forecast[],
    policy: Policy,
    metrics: SimulationMetrics,
    mode: string
  ): Promise<{
    recommendation: string;
    rationale: string;
    confidence: number;
  }> {
    const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const next7DaysForecast = forecast.slice(0, 7);
    const totalInflow = next7DaysForecast.reduce((sum, f) => sum + f.inflow, 0);
    const totalOutflow = next7DaysForecast.reduce(
      (sum, f) => sum + f.outflow,
      0
    );

    const systemPrompt = `You are an expert treasury analyst with deep knowledge of corporate cash management, liquidity optimization, and risk management. Your role is to provide precise, data-driven recommendations for treasury operations.`;

    const userPrompt = `Analyze this treasury scenario and provide a concise recommendation:

**Current Accounts:**
${accounts
  .map(
    (acc) =>
      `- ${acc.name} (${acc.account_type}): ${
        acc.currency
      } ${acc.balance.toLocaleString()}`
  )
  .join("\n")}
Total Cash: ${totalCash.toLocaleString()}

**Treasury Policy:**
- Minimum Liquidity: ${policy.min_liquidity.toLocaleString()}
- Invest Above: ${policy.invest_above.toLocaleString()}
- Risk Profile: ${policy.risk_profile}

**7-Day Forecast:**
- Expected Inflows: ${totalInflow.toLocaleString()}
- Expected Outflows: ${totalOutflow.toLocaleString()}
- Net Position: ${(totalInflow - totalOutflow).toLocaleString()}

**Simulation Results (${mode} mode):**
- Idle Cash: ${metrics.idleCashPct.toFixed(1)}%
- Liquidity Coverage: ${metrics.liquidityCoverageDays.toFixed(1)} days
- Estimated Yield: ${metrics.estYieldBps} basis points
- Shortfall Risk: ${metrics.shortfallRiskPct.toFixed(1)}%

Provide:
1. A specific action recommendation (transfer amount, from/to accounts) in under 80 words
2. Brief rationale explaining the numeric reasoning
3. Confidence score (0-1) for this recommendation

Format your response as:
RECOMMENDATION: [your recommendation]
RATIONALE: [your rationale]
CONFIDENCE: [score between 0 and 1]`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const content = response.content[0];
      const text = content.type === "text" ? content.text : "";

      // Parse the response
      const recommendationMatch = text.match(
        /RECOMMENDATION:\s*(.+?)(?=RATIONALE:|$)/s
      );
      const rationaleMatch = text.match(/RATIONALE:\s*(.+?)(?=CONFIDENCE:|$)/s);
      const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/);

      return {
        recommendation:
          recommendationMatch?.[1]?.trim() || metrics.recommendation,
        rationale:
          rationaleMatch?.[1]?.trim() ||
          "Analysis based on simulation metrics.",
        confidence: parseFloat(confidenceMatch?.[1] || "0.85"),
      };
    } catch (error) {
      console.error("Claude API error:", error);
      // Fallback to simulation recommendation
      return {
        recommendation: metrics.recommendation,
        rationale: `Based on ${mode} simulation: ${metrics.idleCashPct.toFixed(
          1
        )}% idle cash with ${metrics.liquidityCoverageDays.toFixed(
          1
        )} days coverage.`,
        confidence: 0.7,
      };
    }
  }

  async evaluateScenarioRisk(
    metrics: SimulationMetrics,
    _policy: Policy
  ): Promise<{ riskFlag: "low" | "medium" | "high"; notes: string }> {
    let riskFlag: "low" | "medium" | "high" = "low";
    const notes: string[] = [];

    // Check liquidity coverage
    if (metrics.liquidityCoverageDays < 7) {
      riskFlag = "high";
      notes.push("Liquidity coverage below 7 days");
    } else if (metrics.liquidityCoverageDays < 14) {
      riskFlag = "medium";
      notes.push("Liquidity coverage below 14 days");
    }

    // Check shortfall risk
    if (metrics.shortfallRiskPct > 15) {
      riskFlag = "high";
      notes.push(
        `High shortfall risk: ${metrics.shortfallRiskPct.toFixed(1)}%`
      );
    } else if (metrics.shortfallRiskPct > 10) {
      if (riskFlag === "low") riskFlag = "medium";
      notes.push(
        `Moderate shortfall risk: ${metrics.shortfallRiskPct.toFixed(1)}%`
      );
    }

    // Check idle cash
    if (metrics.idleCashPct > 30) {
      if (riskFlag === "low") riskFlag = "medium";
      notes.push(`High idle cash: ${metrics.idleCashPct.toFixed(1)}%`);
    }

    if (notes.length === 0) {
      notes.push("All metrics within acceptable ranges");
    }

    return {
      riskFlag,
      notes: notes.join("; "),
    };
  }
}

export const claudeService = new ClaudeService();
