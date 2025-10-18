import { supabaseService } from "./supabaseService.js";

interface OutcomeData {
  scenarioId: string;
  transferId?: string;
  recommendedAmount: number;
  recommendedFrom: string;
  recommendedTo: string;
  confidenceScore: number;
  predictedYieldBps: number;
  predictedRiskPct: number;
}

interface HistoricalInsights {
  totalRecommendations: number;
  executionRate: number;
  avgConfidenceWhenExecuted: number;
  avgConfidenceWhenIgnored: number;
  accuracyMetrics: {
    avgYieldError: number;
    avgRiskError: number;
  };
  patterns: string[];
}

class HistoricalLearningService {
  // Track when a recommendation is made
  async recordRecommendation(outcome: OutcomeData): Promise<string> {
    try {
      const { data, error } = await (supabaseService as any).client
        .from("recommendation_outcomes")
        .insert({
          scenario_id: outcome.scenarioId,
          transfer_id: outcome.transferId,
          recommended_transfer_amount: outcome.recommendedAmount,
          recommended_from_account: outcome.recommendedFrom,
          recommended_to_account: outcome.recommendedTo,
          confidence_score: outcome.confidenceScore,
          predicted_yield_bps: outcome.predictedYieldBps,
          predicted_risk_pct: outcome.predictedRiskPct,
        })
        .select()
        .single();

      if (error) {
        console.error("Error recording recommendation:", error);
        // Don't throw - learning is optional
        return "";
      }

      console.log("📚 Recorded recommendation for learning:", data.id);
      return data.id;
    } catch (error) {
      console.error("Failed to record recommendation:", error);
      return "";
    }
  }

  // Track when a recommendation is executed
  async recordExecution(
    outcomeId: string,
    executedAmount: number,
    transferId: string
  ): Promise<void> {
    try {
      await (supabaseService as any).client
        .from("recommendation_outcomes")
        .update({
          was_executed: true,
          executed_transfer_amount: executedAmount,
          execution_timestamp: new Date().toISOString(),
          transfer_id: transferId,
        })
        .eq("id", outcomeId);

      console.log("✅ Recorded execution for learning:", outcomeId);
    } catch (error) {
      console.error("Failed to record execution:", error);
    }
  }

  // Record follow-up metrics 7 days later
  async recordFollowup(
    outcomeId: string,
    actualYieldBps: number,
    actualRiskPct: number,
    currentIdleCash: number,
    currentLiquidity: number
  ): Promise<void> {
    try {
      await (supabaseService as any).client
        .from("recommendation_outcomes")
        .update({
          actual_yield_bps: actualYieldBps,
          actual_risk_pct: actualRiskPct,
          followup_idle_cash_pct: currentIdleCash,
          followup_liquidity_days: currentLiquidity,
          followup_collected_at: new Date().toISOString(),
        })
        .eq("id", outcomeId);

      console.log("📊 Recorded follow-up metrics:", outcomeId);
    } catch (error) {
      console.error("Failed to record follow-up:", error);
    }
  }

  // Get historical insights for improving future recommendations
  async getInsights(): Promise<HistoricalInsights> {
    try {
      const { data: outcomes } = await (supabaseService as any).client
        .from("recommendation_outcomes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!outcomes || outcomes.length === 0) {
        return {
          totalRecommendations: 0,
          executionRate: 0,
          avgConfidenceWhenExecuted: 0,
          avgConfidenceWhenIgnored: 0,
          accuracyMetrics: { avgYieldError: 0, avgRiskError: 0 },
          patterns: ["Not enough historical data yet (0 recommendations)"],
        };
      }

      const executed = outcomes.filter((o: any) => o.was_executed);
      const ignored = outcomes.filter((o: any) => !o.was_executed);

      const avgConfidenceWhenExecuted =
        executed.length > 0
          ? executed.reduce(
              (sum: number, o: any) => sum + (o.confidence_score || 0),
              0
            ) / executed.length
          : 0;
      const avgConfidenceWhenIgnored =
        ignored.length > 0
          ? ignored.reduce(
              (sum: number, o: any) => sum + (o.confidence_score || 0),
              0
            ) / ignored.length
          : 0;

      // Calculate prediction accuracy
      const withFollowup = outcomes.filter(
        (o: any) => o.actual_yield_bps !== null && o.actual_risk_pct !== null
      );
      const avgYieldError =
        withFollowup.length > 0
          ? withFollowup.reduce(
              (sum: number, o: any) =>
                sum + Math.abs(o.predicted_yield_bps - o.actual_yield_bps),
              0
            ) / withFollowup.length
          : 0;
      const avgRiskError =
        withFollowup.length > 0
          ? withFollowup.reduce(
              (sum: number, o: any) =>
                sum + Math.abs(o.predicted_risk_pct - o.actual_risk_pct),
              0
            ) / withFollowup.length
          : 0;

      // Detect patterns
      const patterns: string[] = [];

      if (outcomes.length < 5) {
        patterns.push(
          `Building learning dataset (${outcomes.length} recommendations so far)`
        );
      }

      if (
        executed.length > 0 &&
        avgConfidenceWhenExecuted > avgConfidenceWhenIgnored + 0.1
      ) {
        patterns.push(
          `High-confidence recommendations (${(
            avgConfidenceWhenExecuted * 100
          ).toFixed(0)}%) are executed more often`
        );
      }

      if (withFollowup.length > 0 && avgYieldError < 15) {
        patterns.push(
          `Yield predictions are accurate within ${avgYieldError.toFixed(
            1
          )} bps`
        );
      }

      if (executed.length > outcomes.length * 0.7) {
        patterns.push(
          `${((executed.length / outcomes.length) * 100).toFixed(
            0
          )}% execution rate suggests strong trust in recommendations`
        );
      } else if (executed.length < outcomes.length * 0.3) {
        patterns.push(
          `Low execution rate (${(
            (executed.length / outcomes.length) *
            100
          ).toFixed(0)}%) - recommendations may be too aggressive`
        );
      }

      if (patterns.length === 0) {
        patterns.push("Normal execution patterns observed");
      }

      return {
        totalRecommendations: outcomes.length,
        executionRate:
          outcomes.length > 0 ? executed.length / outcomes.length : 0,
        avgConfidenceWhenExecuted: avgConfidenceWhenExecuted,
        avgConfidenceWhenIgnored: avgConfidenceWhenIgnored,
        accuracyMetrics: { avgYieldError, avgRiskError },
        patterns,
      };
    } catch (error) {
      console.error("Failed to get insights:", error);
      return {
        totalRecommendations: 0,
        executionRate: 0,
        avgConfidenceWhenExecuted: 0,
        avgConfidenceWhenIgnored: 0,
        accuracyMetrics: { avgYieldError: 0, avgRiskError: 0 },
        patterns: ["Error fetching historical data"],
      };
    }
  }

  // Adjust confidence based on historical accuracy
  async adjustConfidenceBasedOnHistory(
    baseConfidence: number,
    _predictedYieldBps: number
  ): Promise<{ adjusted: number; reason: string }> {
    const insights = await this.getInsights();

    if (insights.totalRecommendations < 10) {
      return {
        adjusted: baseConfidence,
        reason: `Building historical dataset (${insights.totalRecommendations}/10 recommendations)`,
      };
    }

    // If our predictions are consistently accurate, boost confidence
    if (insights.accuracyMetrics.avgYieldError < 15) {
      const boost = Math.min(
        0.05,
        (15 - insights.accuracyMetrics.avgYieldError) / 200
      );
      return {
        adjusted: Math.min(1.0, baseConfidence + boost),
        reason: `Historical accuracy is high (${insights.accuracyMetrics.avgYieldError.toFixed(
          1
        )} bps avg error) +${(boost * 100).toFixed(1)}% confidence`,
      };
    }

    // If predictions are off, reduce confidence
    if (insights.accuracyMetrics.avgYieldError > 50) {
      const penalty = Math.min(
        0.15,
        (insights.accuracyMetrics.avgYieldError - 50) / 300
      );
      return {
        adjusted: Math.max(0.5, baseConfidence - penalty),
        reason: `Historical accuracy is low (${insights.accuracyMetrics.avgYieldError.toFixed(
          1
        )} bps avg error) -${(penalty * 100).toFixed(1)}% confidence`,
      };
    }

    return {
      adjusted: baseConfidence,
      reason: `Historical accuracy within normal range (${insights.accuracyMetrics.avgYieldError.toFixed(
        1
      )} bps)`,
    };
  }

  // Store outcome ID with scenario for later tracking
  async linkOutcomeToScenario(
    scenarioId: string,
    outcomeId: string
  ): Promise<void> {
    try {
      await (supabaseService as any).client
        .from("scenario_runs")
        .update({ outcome_id: outcomeId })
        .eq("id", scenarioId);
    } catch (error) {
      console.error("Failed to link outcome:", error);
    }
  }
}

export const historicalLearningService = new HistoricalLearningService();
