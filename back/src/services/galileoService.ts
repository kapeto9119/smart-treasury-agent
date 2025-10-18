import { GalileoLogger } from "galileo";
import { config } from "../config/env.js";

class GalileoService {
  private apiKey: string;
  private projectName: string;
  private logStreamName: string;
  private consoleUrl: string;
  private logger: GalileoLogger | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = config.galileo.apiKey || "";
    this.projectName = config.galileo.projectId || "smart-treasury-agent";
    this.logStreamName = "scenario-recommendations";
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

  private ensureInitialized(): boolean {
    if (!this.apiKey) {
      console.warn("❌ Galileo API key is missing");
      return false;
    }

    if (this.isInitialized && this.logger) {
      return true;
    }

    try {
      // Set required environment variables for the Galileo SDK
      // The SDK reads these from process.env automatically
      process.env.GALILEO_API_KEY = this.apiKey;
      process.env.GALILEO_CONSOLE_URL = this.consoleUrl;

      console.log(
        `📊 Initializing Galileo Logger with project: ${this.projectName}, log stream: ${this.logStreamName}`
      );

      // Initialize GalileoLogger with project and log stream names
      this.logger = new GalileoLogger({
        projectName: this.projectName,
        logStreamName: this.logStreamName,
      });

      this.isInitialized = true;
      console.log(`📊 Galileo logger initialized successfully`);
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Galileo logger:", error);
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
    const initialized = this.ensureInitialized();
    if (!initialized || !this.logger) {
      console.debug("⚠️ Galileo not configured, skipping scenario monitoring");
      return;
    }

    try {
      const durationNs = latencyMs * 1_000_000; // Convert ms to nanoseconds
      const now = new Date();

      console.log(`📊 Logging scenario ${scenarioId} to Galileo...`);

      // Start a new trace for this scenario
      this.logger.startTrace({
        input: claudeInput,
        name: `Treasury Scenario ${scenarioId}`,
        createdAt: now,
        metadata: {
          scenario_id: scenarioId,
          use_case: "treasury_recommendation",
          confidence: confidence.toString(),
        },
        tags: ["treasury", "scenario", "recommendation"],
      });

      // Add an LLM span for the Claude API call
      this.logger.addLlmSpan({
        input: claudeInput,
        output: claudeOutput,
        model: "claude-sonnet-4-20250514",
        name: "Claude Recommendation",
        durationNs: durationNs,
        createdAt: now,
        metadata: {
          confidence: confidence.toString(),
          scenario_id: scenarioId,
          latency_ms: latencyMs.toString(),
        },
        tags: ["llm", "claude", "recommendation"],
      });

      // Conclude the trace
      this.logger.conclude({
        output: claudeOutput,
        durationNs: durationNs,
      });

      // Flush to Galileo
      await this.logger.flush();
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
    if (!this.logger || !this.isInitialized) {
      console.debug("⚠️ Galileo logger not initialized, nothing to flush");
      return;
    }

    try {
      await this.logger.flush();
      console.log("✅ Flushed all Galileo traces");
    } catch (error) {
      console.error("❌ Failed to flush Galileo traces:", error);
    }
  }
}

export const galileoService = new GalileoService();
