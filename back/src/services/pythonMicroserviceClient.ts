import axios, { AxiosInstance } from "axios";
import type { SimulationInput, SimulationOutput } from "../types/index.js";

interface ParallelSimulationResponse {
  results: Record<string, SimulationOutput>;
  total_time: number;
  errors: Record<string, string>;
}

class PythonMicroserviceClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    this.client = axios.create({
      baseURL,
      timeout: 300000, // 5 minutes
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(
          "Python microservice error:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data } = await this.client.get("/health");
      return data.status === "healthy";
    } catch (error) {
      return false;
    }
  }

  async runSimulation(input: SimulationInput): Promise<SimulationOutput> {
    try {
      const { data } = await this.client.post<SimulationOutput>(
        "/simulate",
        input
      );
      return data;
    } catch (error: any) {
      console.error(`Simulation failed for mode ${input.mode}:`, error);
      throw new Error(`Simulation failed: ${error.message}`);
    }
  }

  async runParallelSimulations(
    baseInput: Omit<SimulationInput, "mode">,
    modes: string[]
  ): Promise<Map<string, SimulationOutput>> {
    try {
      const simulations = modes.map((mode) => ({
        ...baseInput,
        mode,
      }));

      const { data } = await this.client.post<ParallelSimulationResponse>(
        "/simulate/parallel",
        { simulations }
      );

      const results = new Map<string, SimulationOutput>();

      Object.entries(data.results).forEach(([mode, output]) => {
        results.set(mode, output);
      });

      if (Object.keys(data.errors).length > 0) {
        console.warn("Some simulations failed:", data.errors);
      }

      return results;
    } catch (error: any) {
      console.error("Parallel simulation error:", error);
      throw new Error(`Parallel simulations failed: ${error.message}`);
    }
  }

  async runLocalSimulation(input: SimulationInput): Promise<SimulationOutput> {
    try {
      const { data } = await this.client.post<SimulationOutput>(
        "/simulate/local",
        input
      );
      return data;
    } catch (error: any) {
      console.error("Local simulation error:", error);
      throw new Error(`Local simulation failed: ${error.message}`);
    }
  }
}

export const pythonMicroserviceClient = new PythonMicroserviceClient();

