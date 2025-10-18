import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import type {
  Account,
  Forecast,
  Policy,
  SimulationOutput,
} from "../types/index.js";

interface AgentOpinion {
  agent: string;
  stance: string;
  reasoning: string;
  confidence: number;
  proposedTransfer: number;
}

interface DebateResult {
  finalRecommendation: string;
  rationale: string;
  confidence: number;
  debate: {
    conservative: AgentOpinion;
    aggressive: AgentOpinion;
    mediatorSynthesis: string;
  };
}

class MultiAgentDebateService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  async conductDebate(
    accounts: Account[],
    forecast: Forecast[],
    policy: Policy,
    conservativeMetrics: SimulationOutput,
    balancedMetrics: SimulationOutput,
    aggressiveMetrics: SimulationOutput
  ): Promise<DebateResult> {
    console.log("🎭 Starting Multi-Agent Debate...");
    const context = this.buildContext(accounts, forecast, policy);

    // Stage 1: Conservative Agent argues for safety
    console.log("🛡️  Conservative Agent: Arguing for safety...");
    const conservativeOpinion = await this.getConservativeOpinion(
      context,
      conservativeMetrics
    );

    // Stage 2: Aggressive Agent argues for yield optimization
    console.log("🚀 Aggressive Agent: Challenging conservative view...");
    const aggressiveOpinion = await this.getAggressiveOpinion(
      context,
      aggressiveMetrics,
      conservativeOpinion
    );

    // Stage 3: Mediator synthesizes both perspectives
    console.log("⚖️  Mediator: Synthesizing perspectives...");
    const finalDecision = await this.getMediatorSynthesis(
      context,
      balancedMetrics,
      conservativeOpinion,
      aggressiveOpinion
    );

    console.log("✅ Debate concluded with confidence:", finalDecision.confidence);

    return {
      finalRecommendation: finalDecision.recommendation,
      rationale: finalDecision.rationale,
      confidence: finalDecision.confidence,
      debate: {
        conservative: conservativeOpinion,
        aggressive: aggressiveOpinion,
        mediatorSynthesis: finalDecision.synthesis,
      },
    };
  }

  private buildContext(
    accounts: Account[],
    forecast: Forecast[],
    policy: Policy
  ): string {
    const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const next7Days = forecast.slice(0, 7);
    const totalInflow = next7Days.reduce((sum, f) => sum + f.inflow, 0);
    const totalOutflow = next7Days.reduce((sum, f) => sum + f.outflow, 0);

    return `**Current Accounts:**
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
- Net Position: ${(totalInflow - totalOutflow).toLocaleString()}`;
  }

  private async getConservativeOpinion(
    context: string,
    metrics: SimulationOutput
  ): Promise<AgentOpinion> {
    const systemPrompt = `You are a CONSERVATIVE treasury analyst named "Safety Guard". Your primary concern is LIQUIDITY and SAFETY. You believe cash is king and would rather hold excess liquidity than risk shortfalls. You're skeptical of aggressive yield-chasing. You've seen liquidity crises and never want to be caught short.`;

    const userPrompt = `${context}

**Conservative Simulation Results:**
- Idle Cash: ${metrics.idleCashPct.toFixed(1)}%
- Liquidity Coverage: ${metrics.liquidityCoverageDays.toFixed(1)} days
- Estimated Yield: ${metrics.estYieldBps} bps
- Shortfall Risk: ${metrics.shortfallRiskPct.toFixed(1)}%

Argue for a CONSERVATIVE approach. What are the risks of moving too much cash to high-yield accounts? What could go wrong in an unexpected downturn or cash flow disruption?

Provide:
STANCE: [your conservative recommendation in 50 words]
REASONING: [why safety matters more than yield, specific risks]
TRANSFER: [conservative transfer amount or 0]
CONFIDENCE: [0-1]`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return this.parseOpinion(text, "Conservative Agent");
  }

  private async getAggressiveOpinion(
    context: string,
    metrics: SimulationOutput,
    conservativeOpinion: AgentOpinion
  ): Promise<AgentOpinion> {
    const systemPrompt = `You are an AGGRESSIVE treasury analyst named "Yield Maximizer". Your focus is MAXIMIZING YIELD and highlighting OPPORTUNITY COST. You believe excess cash sitting idle is lost money that compounds over time. You challenge overly conservative approaches and believe data shows when risk is acceptable.`;

    const userPrompt = `${context}

**Aggressive Simulation Results:**
- Idle Cash: ${metrics.idleCashPct.toFixed(1)}%
- Liquidity Coverage: ${metrics.liquidityCoverageDays.toFixed(1)} days
- Estimated Yield: ${metrics.estYieldBps} bps
- Shortfall Risk: ${metrics.shortfallRiskPct.toFixed(1)}%

**Conservative Agent's Opinion:**
"${conservativeOpinion.stance}"
Reasoning: ${conservativeOpinion.reasoning}
Transfer Amount: $${conservativeOpinion.proposedTransfer.toLocaleString()}

CHALLENGE this conservative view! What opportunities are we missing? Why is the risk acceptable given the strong liquidity coverage? Calculate the opportunity cost of keeping too much idle cash.

Provide:
STANCE: [your aggressive counter-argument in 50 words]
REASONING: [why yield optimization matters, opportunity cost math]
TRANSFER: [aggressive transfer amount]
CONFIDENCE: [0-1]`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return this.parseOpinion(text, "Aggressive Agent");
  }

  private async getMediatorSynthesis(
    context: string,
    balancedMetrics: SimulationOutput,
    conservative: AgentOpinion,
    aggressive: AgentOpinion
  ): Promise<{
    recommendation: string;
    rationale: string;
    confidence: number;
    synthesis: string;
  }> {
    const systemPrompt = `You are a MEDIATOR and senior treasury strategist named "Balance Master". You've heard both conservative and aggressive viewpoints. Your job is to synthesize the best elements of both arguments and make a BALANCED, data-driven final decision. You acknowledge valid concerns from both sides while finding the optimal middle ground.`;

    const userPrompt = `${context}

**Balanced Simulation Results:**
- Idle Cash: ${balancedMetrics.idleCashPct.toFixed(1)}%
- Liquidity Coverage: ${balancedMetrics.liquidityCoverageDays.toFixed(1)} days
- Estimated Yield: ${balancedMetrics.estYieldBps} bps
- Shortfall Risk: ${balancedMetrics.shortfallRiskPct.toFixed(1)}%

**DEBATE SUMMARY:**

Conservative Agent (Confidence: ${conservative.confidence}):
"${conservative.stance}"
Proposed Transfer: $${conservative.proposedTransfer.toLocaleString()}
Reasoning: ${conservative.reasoning}

Aggressive Agent (Confidence: ${aggressive.confidence}):
"${aggressive.stance}"
Proposed Transfer: $${aggressive.proposedTransfer.toLocaleString()}
Reasoning: ${aggressive.reasoning}

As the mediator, synthesize these perspectives. Where is each agent correct? What's the optimal middle ground that respects liquidity needs while capturing yield opportunities?

Provide:
SYNTHESIS: [how you're balancing both views, acknowledging valid points from each in 100 words]
RECOMMENDATION: [final specific action with dollar amounts and account names]
RATIONALE: [data-driven justification showing the balance]
CONFIDENCE: [0-1]`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const synthesisMatch = text.match(/SYNTHESIS:\s*(.+?)(?=RECOMMENDATION:|$)/s);
    const recommendationMatch = text.match(
      /RECOMMENDATION:\s*(.+?)(?=RATIONALE:|$)/s
    );
    const rationaleMatch = text.match(/RATIONALE:\s*(.+?)(?=CONFIDENCE:|$)/s);
    const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/);

    return {
      synthesis:
        synthesisMatch?.[1]?.trim() || "Balanced approach recommended",
      recommendation:
        recommendationMatch?.[1]?.trim() || balancedMetrics.recommendation,
      rationale:
        rationaleMatch?.[1]?.trim() || "Based on balanced simulation metrics",
      confidence: parseFloat(confidenceMatch?.[1] || "0.85"),
    };
  }

  private parseOpinion(text: string, agentName: string): AgentOpinion {
    const stanceMatch = text.match(/STANCE:\s*(.+?)(?=REASONING:|$)/s);
    const reasoningMatch = text.match(/REASONING:\s*(.+?)(?=TRANSFER:|$)/s);
    const transferMatch = text.match(/TRANSFER:\s*[\$]?([\d,]+)/);
    const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/);

    return {
      agent: agentName,
      stance: stanceMatch?.[1]?.trim() || "No clear stance",
      reasoning: reasoningMatch?.[1]?.trim() || "No reasoning provided",
      confidence: parseFloat(confidenceMatch?.[1] || "0.75"),
      proposedTransfer: parseFloat(
        (transferMatch?.[1] || "0").replace(/,/g, "")
      ),
    };
  }
}

export const multiAgentDebateService = new MultiAgentDebateService();

