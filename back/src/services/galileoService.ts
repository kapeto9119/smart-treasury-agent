import { GalileoObserveWorkflow } from "@rungalileo/galileo";
import { config } from "../config/env.js";

class GalileoService {
  private apiKey: string;
  private projectName: string;
  private observer: GalileoObserveWorkflow | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = config.galileo.apiKey || "";
    this.projectName = config.galileo.projectId || "smart-treasury-agent";

    if (this.apiKey) {
      console.log("✅ Galileo service initialized");
    } else {
      console.warn(
        "⚠️  Galileo API key not configured - logging will be skipped"
      );
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    if (this.isInitialized && this.observer) {
      return true;
    }

    try {
      // Initialize GalileoObserveWorkflow for production monitoring
      this.observer = new GalileoObserveWorkflow(this.projectName);
      await this.observer.init();
      this.isInitialized = true;
      console.log(
        `📊 Galileo observer initialized for project: ${this.projectName}`
      );
      return true;
    } catch (error) {
      console.error("Failed to initialize Galileo observer:", error);
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
      console.debug("Galileo not configured, skipping scenario monitoring");
      return;
    }

    try {
      const now = Date.now() * 1_000_000; // Convert to nanoseconds
      const durationNs = latencyMs * 1_000_000; // Convert ms to nanoseconds

      // Create a workflow for this scenario
      this.observer.addWorkflow({
        input: claudeInput,
        output: "", // Will be set when we conclude
        createdAtNs: now,
        durationNs: durationNs,
        metadata: {
          scenario_id: scenarioId,
          use_case: "treasury_recommendation",
          confidence: confidence.toString(),
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
        },
      });

      // Conclude the workflow
      this.observer.concludeWorkflow(claudeOutput, durationNs);

      // Upload to Galileo (async, don't block)
      this.observer
        .uploadWorkflows()
        .then(() => {
          console.log(`📊 Logged scenario ${scenarioId} to Galileo`);
        })
        .catch((err: any) => {
          console.error("Failed to upload workflow to Galileo:", err);
        });
    } catch (error) {
      console.error("Failed to monitor scenario in Galileo:", error);
    }
  }

  async flush(): Promise<void> {
    if (!this.observer || !this.isInitialized) {
      return;
    }

    try {
      await this.observer.uploadWorkflows();
      console.log("📊 Flushed all Galileo workflows");
    } catch (error) {
      console.error("Failed to flush Galileo workflows:", error);
    }
  }
}

export const galileoService = new GalileoService();
