import { Request, Response } from "express";
import { supabaseService } from "../services/supabaseService.js";
import { pythonMicroserviceClient } from "../services/pythonMicroserviceClient.js";
import { claudeService } from "../services/claudeService.js";
import { galileoService } from "../services/galileoService.js";
import { multiAgentDebateService } from "../services/multiAgentDebate.js";
import { historicalLearningService } from "../services/historicalLearningService.js";
import { agenticWorkflowService } from "../services/agenticWorkflow.js";

// Rate limiting for concurrent scenario runs
const MAX_CONCURRENT_RUNS = parseInt(
  process.env.MAX_CONCURRENT_SCENARIOS || "5"
);
const activeRuns = new Map<string, Date>();

// Cleanup old runs (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  for (const [key, date] of activeRuns.entries()) {
    if (date < fiveMinutesAgo) {
      activeRuns.delete(key);
      console.log(`⏱️  Cleaned up stale run: ${key}`);
    }
  }
}, 60000); // Check every minute

export const scenariosController = {
  async runScenarios(req: Request, res: Response) {
    try {
      const modes = req.body.modes || [
        "conservative",
        "balanced",
        "aggressive",
      ];
      const customParameters = req.body.parameters || {};

      // Rate limiting: Check concurrent runs
      if (activeRuns.size >= MAX_CONCURRENT_RUNS) {
        console.warn(
          `⚠️  Rate limit exceeded: ${activeRuns.size}/${MAX_CONCURRENT_RUNS} active runs`
        );
        return res.status(429).json({
          success: false,
          error: `Too many concurrent simulations. Maximum ${MAX_CONCURRENT_RUNS} allowed. Please try again in a few moments.`,
          activeRuns: activeRuns.size,
        });
      }

      // Check Python service health
      const isHealthy = await pythonMicroserviceClient.healthCheck();
      if (!isHealthy) {
        return res.status(503).json({
          success: false,
          error: "Python simulation service is unavailable",
        });
      }

      // Fetch required data
      const accounts = await supabaseService.getAccounts();
      const forecast = await supabaseService.getForecast(30);
      const policy = await supabaseService.getActivePolicy();

      if (!policy) {
        return res.status(400).json({
          success: false,
          error: "No active policy found",
        });
      }

      if (accounts.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No accounts found",
        });
      }

      // Create scenario run records
      const scenarioRecords = await Promise.all(
        modes.map((mode: string) =>
          supabaseService.createScenarioRun({
            mode: mode as any,
            status: "pending",
            assumptions: {
              modes,
              parameters: customParameters,
              timestamp: new Date().toISOString(),
            },
          })
        )
      );

      // Track this run
      const runId = scenarioRecords[0].id;
      activeRuns.set(runId, new Date());
      console.log(
        `🚀 Starting scenario run ${runId} (${activeRuns.size}/${MAX_CONCURRENT_RUNS} active)`
      );

      // Start async processing
      processScenarios(
        scenarioRecords,
        accounts,
        forecast,
        policy,
        modes,
        customParameters
      )
        .catch(console.error)
        .finally(() => {
          // Remove from active runs when done
          activeRuns.delete(runId);
          console.log(
            `✅ Completed scenario run ${runId} (${activeRuns.size}/${MAX_CONCURRENT_RUNS} remaining)`
          );
        });

      res.json({
        success: true,
        data: {
          scenarioIds: scenarioRecords.map((s) => s.id),
          message: "Scenarios queued for processing",
        },
      });
    } catch (error: any) {
      console.error("Error running scenarios:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async getScenario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scenario = await supabaseService.getScenarioRun(id);

      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: "Scenario not found",
        });
      }

      res.json({ success: true, data: scenario });
    } catch (error: any) {
      console.error("Error fetching scenario:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async getRecent(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const scenarios = await supabaseService.getRecentScenarioRuns(limit);
      res.json({ success: true, data: scenarios });
    } catch (error: any) {
      console.error("Error fetching recent scenarios:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },

  async getStats(_req: Request, res: Response) {
    try {
      const stats = await supabaseService.getScenarioStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Error fetching scenario stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
    return;
  },
};

// Background processing function
async function processScenarios(
  scenarioRecords: any[],
  accounts: any[],
  forecast: any[],
  policy: any,
  modes: string[],
  customParameters: any = {}
) {
  try {
    // Update all to running
    await Promise.all(
      scenarioRecords.map((scenario) =>
        supabaseService.updateScenarioRun(scenario.id, { status: "running" })
      )
    );

    // Run simulations via Python microservice using Daytona
    const baseInput = {
      accounts,
      forecast,
      policy,
      parameters: customParameters,
    };
    const results = await pythonMicroserviceClient.runParallelSimulations(
      baseInput,
      modes
    );

    // Check which AI mode to use
    const useAgenticWorkflow = process.env.ENABLE_AGENTIC_WORKFLOW === "true";
    const useMultiAgentDebate =
      process.env.ENABLE_MULTI_AGENT_DEBATE === "true";
    const useHistoricalLearning =
      process.env.ENABLE_HISTORICAL_LEARNING !== "false"; // Default ON

    console.log(
      `🤖 AI Mode: ${
        useAgenticWorkflow
          ? "Agentic Workflow"
          : useMultiAgentDebate
          ? "Multi-Agent Debate"
          : "Single Agent"
      } | Learning: ${useHistoricalLearning ? "ON" : "OFF"}`
    );

    // === AGENTIC WORKFLOW MODE ===
    if (useAgenticWorkflow) {
      console.log("🤖 Using Full Agentic Workflow (4-Agent Pipeline)");
      const workflowResult = await agenticWorkflowService.executeWorkflow(
        accounts,
        forecast,
        policy,
        results
      );

      // Apply workflow result to balanced scenario
      const balancedScenario = scenarioRecords.find(
        (s) => s.mode === "balanced"
      );
      if (balancedScenario) {
        const simulationResult = results.get("balanced");

        // Record for historical learning
        let outcomeId = "";
        if (
          useHistoricalLearning &&
          simulationResult &&
          simulationResult.transferDetails
        ) {
          outcomeId = await historicalLearningService.recordRecommendation({
            scenarioId: balancedScenario.id,
            recommendedAmount: simulationResult.transferDetails.amount || 0,
            recommendedFrom: simulationResult.transferDetails.fromAccount || "",
            recommendedTo: simulationResult.transferDetails.toAccount || "",
            confidenceScore: workflowResult.confidence,
            predictedYieldBps: simulationResult.estYieldBps,
            predictedRiskPct: simulationResult.shortfallRiskPct,
          });
        }

        await supabaseService.updateScenarioRun(balancedScenario.id, {
          status: "completed",
          metrics: simulationResult as any,
          recommendation: workflowResult.finalRecommendation,
          claude_response: JSON.stringify(workflowResult.workflow, null, 2),
          sandbox_id: simulationResult?.sandbox_id,
          completed_at: new Date().toISOString(),
        });

        // Log to Galileo
        await galileoService.monitorScenarioRecommendation(
          balancedScenario.id,
          `Agentic Workflow (4 agents): ${JSON.stringify({
            accounts,
            forecast,
            policy,
          })}`,
          workflowResult.finalRecommendation + "\n" + workflowResult.rationale,
          workflowResult.confidence,
          0
        );

        if (outcomeId) {
          await historicalLearningService.linkOutcomeToScenario(
            balancedScenario.id,
            outcomeId
          );
        }
      }

      // Process other scenarios with standard approach
      for (const scenario of scenarioRecords.filter(
        (s) => s.mode !== "balanced"
      )) {
        const mode = scenario.mode;
        const simulationResult = results.get(mode);
        if (simulationResult) {
          await processStandardScenario(
            scenario,
            mode,
            simulationResult,
            accounts,
            forecast,
            policy,
            useHistoricalLearning
          );
        }
      }
    }
    // === MULTI-AGENT DEBATE MODE ===
    else if (useMultiAgentDebate) {
      console.log(
        "🎭 Using Multi-Agent Debate (Conservative vs Aggressive vs Mediator)"
      );
      const debateResult = await multiAgentDebateService.conductDebate(
        accounts,
        forecast,
        policy,
        results.get("conservative")!,
        results.get("balanced")!,
        results.get("aggressive")!
      );

      // Apply debate result to balanced scenario
      const balancedScenario = scenarioRecords.find(
        (s) => s.mode === "balanced"
      );
      if (balancedScenario) {
        const simulationResult = results.get("balanced");

        // Record for historical learning
        let outcomeId = "";
        if (
          useHistoricalLearning &&
          simulationResult &&
          simulationResult.transferDetails
        ) {
          outcomeId = await historicalLearningService.recordRecommendation({
            scenarioId: balancedScenario.id,
            recommendedAmount: simulationResult.transferDetails.amount || 0,
            recommendedFrom: simulationResult.transferDetails.fromAccount || "",
            recommendedTo: simulationResult.transferDetails.toAccount || "",
            confidenceScore: debateResult.confidence,
            predictedYieldBps: simulationResult.estYieldBps,
            predictedRiskPct: simulationResult.shortfallRiskPct,
          });
        }

        await supabaseService.updateScenarioRun(balancedScenario.id, {
          status: "completed",
          metrics: simulationResult as any,
          recommendation: debateResult.finalRecommendation,
          claude_response: `${
            debateResult.rationale
          }\n\n=== MULTI-AGENT DEBATE ===\n${JSON.stringify(
            debateResult.debate,
            null,
            2
          )}`,
          sandbox_id: simulationResult?.sandbox_id,
          completed_at: new Date().toISOString(),
        });

        // Log to Galileo
        await galileoService.monitorScenarioRecommendation(
          balancedScenario.id,
          `Multi-Agent Debate: ${JSON.stringify({
            accounts,
            forecast,
            policy,
          })}`,
          debateResult.finalRecommendation + "\n" + debateResult.rationale,
          debateResult.confidence,
          0
        );

        if (outcomeId) {
          await historicalLearningService.linkOutcomeToScenario(
            balancedScenario.id,
            outcomeId
          );
        }
      }

      // Process other scenarios with standard approach
      for (const scenario of scenarioRecords.filter(
        (s) => s.mode !== "balanced"
      )) {
        const mode = scenario.mode;
        const simulationResult = results.get(mode);
        if (simulationResult) {
          await processStandardScenario(
            scenario,
            mode,
            simulationResult,
            accounts,
            forecast,
            policy,
            useHistoricalLearning
          );
        }
      }
    }
    // === STANDARD SINGLE-AGENT MODE ===
    else {
      console.log("🤖 Using Standard Single-Agent Mode");
      for (let i = 0; i < scenarioRecords.length; i++) {
        const scenario = scenarioRecords[i];
        const mode = modes[i];
        const simulationResult = results.get(mode);

        if (!simulationResult) {
          await supabaseService.updateScenarioRun(scenario.id, {
            status: "failed",
            error_message: "Simulation failed to produce results",
            completed_at: new Date().toISOString(),
          });
          continue;
        }

        await processStandardScenario(
          scenario,
          mode,
          simulationResult,
          accounts,
          forecast,
          policy,
          useHistoricalLearning
        );
      }
    }

    console.log("✅ All scenarios processed successfully");
  } catch (error) {
    console.error("❌ Error processing scenarios:", error);

    // Mark failed scenarios
    await Promise.all(
      scenarioRecords.map((scenario) =>
        supabaseService.updateScenarioRun(scenario.id, {
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
      )
    );
  }
}

// Helper function for standard scenario processing
async function processStandardScenario(
  scenario: any,
  mode: string,
  simulationResult: any,
  accounts: any[],
  forecast: any[],
  policy: any,
  useHistoricalLearning: boolean
) {
  // Get Claude recommendation with timing
  const claudeStartTime = Date.now();
  let claudeResponse = await claudeService.generateRecommendation(
    accounts,
    forecast,
    policy,
    simulationResult,
    mode
  );
  const claudeLatency = Date.now() - claudeStartTime;

  // Apply historical learning if enabled
  if (useHistoricalLearning && simulationResult.transferDetails) {
    const { adjusted, reason } =
      await historicalLearningService.adjustConfidenceBasedOnHistory(
        claudeResponse.confidence,
        simulationResult.estYieldBps
      );

    console.log(`📚 ${reason}`);
    claudeResponse = {
      ...claudeResponse,
      confidence: adjusted,
      rationale: `${claudeResponse.rationale}\n\n[Historical Learning: ${reason}]`,
    };

    // Record this recommendation (only if we have valid transfer details)
    const outcomeId = await historicalLearningService.recordRecommendation({
      scenarioId: scenario.id,
      recommendedAmount: simulationResult.transferDetails.amount || 0,
      recommendedFrom: simulationResult.transferDetails.fromAccount || "",
      recommendedTo: simulationResult.transferDetails.toAccount || "",
      confidenceScore: adjusted,
      predictedYieldBps: simulationResult.estYieldBps,
      predictedRiskPct: simulationResult.shortfallRiskPct,
    });

    if (outcomeId) {
      await historicalLearningService.linkOutcomeToScenario(
        scenario.id,
        outcomeId
      );
    }
  }

  // Log to Galileo
  await galileoService.monitorScenarioRecommendation(
    scenario.id,
    JSON.stringify({ accounts, forecast, policy, mode }),
    claudeResponse.recommendation + "\n" + claudeResponse.rationale,
    claudeResponse.confidence,
    claudeLatency
  );

  // Evaluate risk
  const riskEval = await claudeService.evaluateScenarioRisk(
    simulationResult,
    policy
  );

  // Update scenario with sandbox_id from Python service
  await supabaseService.updateScenarioRun(scenario.id, {
    status: "completed",
    metrics: simulationResult as any,
    recommendation: claudeResponse.recommendation,
    claude_response: claudeResponse.rationale,
    sandbox_id: simulationResult.sandbox_id,
    completed_at: new Date().toISOString(),
  });

  // Create eval log
  await supabaseService.createEvalLog({
    scenario_id: scenario.id,
    confidence: claudeResponse.confidence,
    risk_flag: riskEval.riskFlag,
    notes: riskEval.notes,
    metrics: {
      ...simulationResult,
      rationale: claudeResponse.rationale,
    } as any,
  });
}
