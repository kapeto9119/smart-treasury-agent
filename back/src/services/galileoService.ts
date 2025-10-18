import { GalileoObserveWorkflow } from "@rungalileo/galileo";
import { config } from "../config/env.js";

class GalileoService {
  private apiKey: string;
  private projectName: string;
  private consoleUrl: string;
  private observer: GalileoObserveWorkflow | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = config.galileo.apiKey || "";
    this.projectName = config.galileo.projectId || "smart-treasury-agent";
    this.consoleUrl = config.galileo.consoleUrl || "https://console.galileo.ai";

    if (this.apiKey) {
      console.log(
        "✅ Galileo service initialized with project:",
        this.projectName
      );
    } else {
      console.warn(
        "⚠️  Galileo API key not configured - logging will be skipped"
      );
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("❌ Galileo API key is missing");
      return false;
    }

    if (this.isInitialized && this.observer) {
      return true;
    }

    try {
      // Set required environment variables for the Galileo SDK
      // The SDK reads these from process.env automatically
      process.env.GALILEO_API_KEY = this.apiKey;
      process.env.GALILEO_CONSOLE_URL = this.consoleUrl;

      console.log(
        `📊 Initializing Galileo with console URL: ${this.consoleUrl}`
      );

      // Initialize GalileoObserveWorkflow with project name only
      this.observer = new GalileoObserveWorkflow(this.projectName);

      await this.observer.init();
      this.isInitialized = true;
      console.log(
        `📊 Galileo observer initialized for project: ${this.projectName}`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Galileo observer:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
      this.isInitialized = false;
      return false;
    }
  }

  async monitorScenarioRecommendation(
    scenarioId: string,
    claudeInput: string,
    claudeOutput: string,
    confidence: number,
    latencyMs: number
  ): Promise<void> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.observer) {
      console.debug("⚠️ Galileo not configured, skipping scenario monitoring");
      return;
    }

    try {
      const now = Date.now() * 1_000_000; // Convert to nanoseconds
      const durationNs = latencyMs * 1_000_000; // Convert ms to nanoseconds

      console.log(`📊 Logging scenario ${scenarioId} to Galileo...`);

      // Create a workflow for this scenario
      this.observer.addWorkflow({
        input: claudeInput,
        output: claudeOutput, // Set output immediately
        createdAtNs: now,
        durationNs: durationNs,
        metadata: {
          scenario_id: scenarioId,
          use_case: "treasury_recommendation",
          confidence: confidence.toString(),
          latency_ms: latencyMs.toString(),
        },
        parent: null,
        steps: [],
      });

      // Log the LLM step (Claude API call)
      this.observer.addLlmStep({
        input: claudeInput,
        output: claudeOutput,
        createdAtNs: now,
        durationNs: durationNs,
        model: "claude-sonnet-4-20250514",
        metadata: {
          confidence: confidence.toString(),
          scenario_id: scenarioId,
          latency_ms: latencyMs.toString(),
        },
      });

      // Conclude the workflow with the output
      this.observer.concludeWorkflow(claudeOutput, durationNs);

      // Upload to Galileo synchronously to ensure it completes
      await this.observer.uploadWorkflows();
      console.log(`✅ Successfully logged scenario ${scenarioId} to Galileo`);
    } catch (error) {
      console.error(
        `❌ Failed to monitor scenario ${scenarioId} in Galileo:`,
        error
      );
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
    }
  }

  async flush(): Promise<void> {
    if (!this.observer || !this.isInitialized) {
      console.debug("⚠️ Galileo observer not initialized, nothing to flush");
      return;
    }

    try {
      await this.observer.uploadWorkflows();
      console.log("✅ Flushed all Galileo workflows");
    } catch (error) {
      console.error("❌ Failed to flush Galileo workflows:", error);
    }
  }
}

export const galileoService = new GalileoService();
