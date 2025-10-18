import { init, getLogger, flush, enableMetrics, GalileoScorers } from "galileo";
import { config } from "../config/env.js";

class GalileoService {
  private apiKey: string;
  private projectName: string;
  private logStreamName: string;
  private consoleUrl: string;
  private isInitialized: boolean = false;
  private sessionStarted: boolean = false;

  constructor() {
    this.apiKey = config.galileo.apiKey || "";
    this.projectName = config.galileo.projectId || "smart-treasury-agent";
    this.logStreamName = "scenario-recommendations";
    this.consoleUrl = config.galileo.consoleUrl || "https://console.galileo.ai";

    if (this.apiKey) {
      console.log(
        "✅ Galileo service configured for project:",
        this.projectName
      );
      // Initialize asynchronously (don't block constructor)
      this.initialize().catch((error) => {
        console.error("❌ Failed to initialize Galileo in constructor:", error);
      });
    } else {
      console.warn(
        "⚠️  Galileo API key not configured - logging will be skipped"
      );
    }
  }

  private async initialize(): Promise<void> {
    if (!this.apiKey || this.isInitialized) {
      return;
    }

    try {
      // Set required environment variables for the Galileo SDK
      process.env.GALILEO_API_KEY = this.apiKey;
      process.env.GALILEO_CONSOLE_URL = this.consoleUrl;

      console.log(
        `📊 Initializing Galileo with project: ${this.projectName}, log stream: ${this.logStreamName}`
      );

      // Initialize Galileo using the singleton pattern
      init({
        projectName: this.projectName,
        logStreamName: this.logStreamName,
      });

      this.isInitialized = true;
      console.log(`✅ Galileo initialized successfully`);
      console.log(`📊 Metrics will be enabled after first trace is logged`);
    } catch (error) {
      console.error("❌ Failed to initialize Galileo:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
      this.isInitialized = false;
    }
  }

  private async ensureSessionStarted(): Promise<void> {
    if (!this.isInitialized || this.sessionStarted) {
      return;
    }

    try {
      const logger = getLogger();
      await logger.startSession();
      this.sessionStarted = true;
      console.log("📊 Galileo session started");

      // Enable metrics after session is started (log stream now exists)
      await this.enableMetricsIfNeeded();
    } catch (error) {
      console.error("❌ Failed to start Galileo session:", error);
    }
  }

  private metricsEnabled = false;

  private async enableMetricsIfNeeded(): Promise<void> {
    if (this.metricsEnabled) {
      return;
    }

    try {
      console.log("📊 Enabling Galileo evaluation metrics...");
      await enableMetrics({
        projectName: this.projectName,
        logStreamName: this.logStreamName,
        metrics: [
          GalileoScorers.ContextAdherence, // Checks if Claude sticks to financial data
          GalileoScorers.Correctness, // Evaluates accuracy of recommendations
          GalileoScorers.Completeness, // Ensures thorough analysis
        ],
      });
      this.metricsEnabled = true;
      console.log("✅ Galileo evaluation metrics enabled");
    } catch (error) {
      console.error("⚠️  Failed to enable Galileo metrics:", error);
      // Don't throw - metrics are optional, logging should still work
    }
  }

  async monitorScenarioRecommendation(
    scenarioId: string,
    claudeInput: string,
    claudeOutput: string,
    confidence: number,
    latencyMs: number
  ): Promise<void> {
    if (!this.isInitialized) {
      console.debug("⚠️ Galileo not configured, skipping scenario monitoring");
      return;
    }

    try {
      // Ensure session is started
      await this.ensureSessionStarted();

      const logger = getLogger();
      const durationNs = latencyMs * 1_000_000; // Convert ms to nanoseconds

      console.log(`📊 Logging scenario ${scenarioId} to Galileo...`);

      // Start a new trace for this scenario (following Anthropic pattern)
      logger.startTrace({
        name: `Treasury Scenario ${scenarioId}`,
        input: claudeInput,
      });

      // Add an LLM span for the Claude API call
      // Following the Anthropic example pattern
      logger.addLlmSpan({
        input: claudeInput,
        output: claudeOutput,
        model: "claude-sonnet-4-20250514",
        durationNs: durationNs,
        metadata: {
          confidence: confidence.toString(),
          scenario_id: scenarioId,
          use_case: "treasury_recommendation",
        },
      });

      // Conclude the trace
      logger.conclude({
        output: claudeOutput,
      });

      console.log(`✅ Logged scenario ${scenarioId} to Galileo`);
    } catch (error) {
      console.error(
        `❌ Failed to monitor scenario ${scenarioId} in Galileo:`,
        error
      );
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
    }
  }

  async flush(): Promise<void> {
    if (!this.isInitialized) {
      console.debug("⚠️ Galileo not initialized, nothing to flush");
      return;
    }

    try {
      // Use the global flush function from the singleton
      await flush();
      console.log("✅ Flushed all Galileo traces");
    } catch (error) {
      console.error("❌ Failed to flush Galileo traces:", error);
    }
  }
}

export const galileoService = new GalileoService();
