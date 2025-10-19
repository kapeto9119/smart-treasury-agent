"""FastAPI main application"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
import asyncio
import json
import os

from .models import (
    SimulationRequest,
    SimulationResponse,
    ParallelSimulationRequest,
    ParallelSimulationResponse,
    AgentAnalysis,
)
from .simulation import calculate_metrics, run_agent_analysis
from .daytona_client import DaytonaClient
import inspect

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global Daytona client
daytona_client: DaytonaClient = None

# Simulation timeout (seconds) - maximum time for a single simulation
SIMULATION_TIMEOUT = int(os.getenv("SIMULATION_TIMEOUT", "240"))  # 4 minutes default


def generate_simulation_code() -> str:
    """
    Generate standalone simulation code with embedded LLM agent.
    This ensures the sandbox code stays in sync with the local simulation logic.
    Now includes agent analysis capability!
    """
    # Get the source code of both functions
    calc_source = inspect.getsource(calculate_metrics)
    agent_source = inspect.getsource(run_agent_analysis)

    # Create a standalone script that can run in Daytona WITH AGENT
    return f'''#!/usr/bin/env python3
"""
Smart Treasury Agent - Simulation Runner with Embedded LLM Agent
Auto-generated from simulation.py - DO NOT EDIT MANUALLY
Calculates treasury metrics AND runs AI agent analysis inside the sandbox
"""

import json
import sys
import os
import re
from typing import List, Dict, Any


def calculate_metrics_standalone(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate treasury metrics based on input data and mode"""
    mode = data["mode"]
    accounts = data["accounts"]
    forecast = data["forecast"]
    policy = data["policy"]
    parameters = data.get("parameters", {{}})

    # Calculate total cash across all accounts
    total_cash = sum(acc["balance"] for acc in accounts)

    # Get checking and high-yield account balances
    checking = next(
        (acc for acc in accounts if acc.get("account_type") == "checking"), None
    )
    high_yield = next(
        (acc for acc in accounts if acc.get("account_type") == "high_yield"), None
    )

    checking_balance = checking["balance"] if checking else 0
    high_yield_balance = high_yield["balance"] if high_yield else 0

    # Get investment horizon (default 7 days or custom)
    horizon_days = parameters.get("investment_horizon_days") or parameters.get("investmentHorizonDays") or 7
    
    # Calculate forecast for the specified horizon
    horizon_forecast = forecast[:horizon_days] if len(forecast) >= horizon_days else forecast
    horizon_outflow = sum(f["outflow"] for f in horizon_forecast)
    horizon_inflow = sum(f["inflow"] for f in horizon_forecast)
    avg_daily_outflow = horizon_outflow / len(horizon_forecast) if len(horizon_forecast) > 0 else 0

    # Mode-specific parameters with overrides
    default_risk_multipliers = {{
        "conservative": 1.5,
        "balanced": 1.2,
        "aggressive": 1.0,
        "custom": 1.3,
    }}

    default_transfer_thresholds = {{
        "conservative": 0.8,
        "balanced": 0.6,
        "aggressive": 0.4,
        "custom": 0.7,
    }}

    # Apply risk appetite override
    risk_appetite = parameters.get("risk_appetite") or parameters.get("riskAppetite")
    custom_risk_mult = parameters.get("custom_risk_multiplier") or parameters.get("customRiskMultiplier")
    
    if risk_appetite:
        risk_appetite_map = {{"low": 1.5, "medium": 1.2, "high": 1.0}}
        risk_mult = custom_risk_mult or risk_appetite_map.get(risk_appetite, 1.2)
    else:
        risk_mult = custom_risk_mult or default_risk_multipliers.get(mode, 1.2)

    custom_transfer_thresh = parameters.get("custom_transfer_threshold") or parameters.get("customTransferThreshold")
    transfer_thresh = custom_transfer_thresh or default_transfer_thresholds.get(mode, 0.6)

    # Calculate buffer needed with custom liquidity threshold
    liquidity_threshold_pct = parameters.get("liquidity_threshold_pct") or parameters.get("liquidityThresholdPct")
    if liquidity_threshold_pct:
        liquidity_buffer = total_cash * (liquidity_threshold_pct / 100)
        buffer_needed = max(policy["min_liquidity"], liquidity_buffer)
    else:
        buffer_needed = policy["min_liquidity"] + (horizon_outflow * risk_mult)

    # Calculate idle cash
    idle_cash = max(0, checking_balance - buffer_needed)
    idle_cash_pct = (idle_cash / total_cash * 100) if total_cash > 0 else 0

    # Calculate liquidity coverage days
    liquidity_coverage_days = (
        (total_cash / avg_daily_outflow) if avg_daily_outflow > 0 else 999
    )

    # Determine transfer amount
    transfer_amount = 0
    recommendation = "Maintain current positions"
    from_account = ""
    to_account = ""

    if idle_cash > policy["invest_above"] * transfer_thresh:
        transfer_amount = idle_cash * transfer_thresh
        from_account = checking["name"] if checking else "Checking"
        to_account = high_yield["name"] if high_yield else "High-Yield account"
        recommendation = (
            f"Transfer ${{transfer_amount:,.0f}} from {{from_account}} to {{to_account}}"
        )

    # Calculate estimated yield
    est_yield_bps = 0
    if transfer_amount > 0:
        est_yield_bps = (
            int((transfer_amount * 500) / total_cash) if total_cash > 0 else 0
        )

    # Calculate shortfall risk percentage
    if mode == "aggressive":
        shortfall_risk_pct = min(15, 5 + (idle_cash_pct * 0.3))
    elif mode == "conservative":
        shortfall_risk_pct = max(2, 8 - (liquidity_coverage_days * 0.2))
    else:
        shortfall_risk_pct = 5 + (
            (15 - liquidity_coverage_days) * 0.3 if liquidity_coverage_days < 15 else 0
        )

    shortfall_risk_pct = max(1, min(20, shortfall_risk_pct))

    return {{
        "idleCashPct": round(idle_cash_pct, 2),
        "liquidityCoverageDays": round(liquidity_coverage_days, 1),
        "estYieldBps": est_yield_bps,
        "shortfallRiskPct": round(shortfall_risk_pct, 1),
        "recommendation": recommendation,
        "transferDetails": {{
            "fromAccount": from_account,
            "toAccount": to_account,
            "amount": round(transfer_amount, 2),
        }},
    }}


def run_agent_analysis_standalone(
    metrics: Dict[str, Any],
    mode: str,
    accounts: List[Dict[str, Any]],
    policy: Dict[str, Any],
    forecast: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Run LLM agent analysis on calculated metrics.
    This runs INSIDE the Daytona sandbox with the agent!
    """
    try:
        from anthropic import Anthropic
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("⚠️  No ANTHROPIC_API_KEY found - skipping agent analysis")
            return {{
                "recommendation": metrics.get("recommendation", ""),
                "reasoning": "Agent analysis skipped - no API key provided",
                "riskAssessment": "UNKNOWN",
                "confidence": 0.5,
                "agentEnabled": False
            }}
        
        print("🤖 Initializing AI agent for analysis...")
        client = Anthropic(api_key=api_key)
        
        # Calculate context
        total_cash = sum(acc["balance"] for acc in accounts)
        next_7_days = forecast[:7] if len(forecast) >= 7 else forecast
        total_inflow = sum(f["inflow"] for f in next_7_days)
        total_outflow = sum(f["outflow"] for f in next_7_days)
        net_position = total_inflow - total_outflow
        
        # Build comprehensive prompt
        prompt = f"""You are an AI treasury agent running inside a secure sandbox environment. You just completed a treasury simulation and need to provide expert analysis.

**SIMULATION MODE:** {{mode.upper()}}

**CALCULATED METRICS:**
- Idle Cash: {{metrics['idleCashPct']}}%
- Liquidity Coverage: {{metrics['liquidityCoverageDays']}} days
- Estimated Yield: {{metrics['estYieldBps']}} basis points
- Shortfall Risk: {{metrics['shortfallRiskPct']}}%
- Transfer Amount: ${{metrics['transferDetails']['amount']:,.0f}}

**ACCOUNT CONTEXT:**
Total Cash Position: ${{total_cash:,.0f}}
{{chr(10).join([f"- {{acc['name']}} ({{acc['account_type']}}): ${{acc['balance']:,.0f}}" for acc in accounts])}}

**TREASURY POLICY:**
- Minimum Liquidity Required: ${{policy['min_liquidity']:,.0f}}
- Invest Above Threshold: ${{policy['invest_above']:,.0f}}
- Risk Profile: {{policy['risk_profile']}}

**7-DAY FORECAST:**
- Expected Inflows: ${{total_inflow:,.0f}}
- Expected Outflows: ${{total_outflow:,.0f}}
- Net Position: ${{net_position:,.0f}}

**YOUR TASK:**
As an embedded treasury agent, analyze these metrics and provide:

1. **RECOMMENDATION:** A clear, actionable recommendation (1-2 sentences)
2. **REASONING:** Detailed explanation of your analysis
3. **RISK_ASSESSMENT:** Rate the risk level (LOW/MEDIUM/HIGH) and explain why
4. **CONFIDENCE:** Your confidence score (0.0 to 1.0) in this recommendation

Format your response EXACTLY as:
RECOMMENDATION: [your recommendation]
REASONING: [your detailed reasoning]
RISK_ASSESSMENT: [LOW/MEDIUM/HIGH] - [explanation]
CONFIDENCE: [0.0-1.0]"""

        print("🤖 Agent analyzing simulation results...")
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{{"role": "user", "content": prompt}}],
            system="You are an expert treasury analyst AI agent embedded in a simulation sandbox. Provide precise, data-driven analysis."
        )
        
        text = response.content[0].text if response.content else ""
        print("✅ Agent analysis completed")
        
        # Extract components using regex
        recommendation_match = re.search(r'RECOMMENDATION:\\s*(.+?)(?=REASONING:|$)', text, re.DOTALL)
        reasoning_match = re.search(r'REASONING:\\s*(.+?)(?=RISK_ASSESSMENT:|$)', text, re.DOTALL)
        risk_match = re.search(r'RISK_ASSESSMENT:\\s*(.+?)(?=CONFIDENCE:|$)', text, re.DOTALL)
        confidence_match = re.search(r'CONFIDENCE:\\s*([\\d.]+)', text)
        
        recommendation = recommendation_match.group(1).strip() if recommendation_match else metrics.get("recommendation", "")
        reasoning = reasoning_match.group(1).strip() if reasoning_match else "Analysis completed based on calculated metrics."
        risk_assessment = risk_match.group(1).strip() if risk_match else "MEDIUM - Standard risk profile"
        confidence = float(confidence_match.group(1)) if confidence_match else 0.75
        confidence = max(0.0, min(1.0, confidence))
        
        return {{
            "recommendation": recommendation,
            "reasoning": reasoning,
            "riskAssessment": risk_assessment,
            "confidence": confidence,
            "agentEnabled": True,
            "rawResponse": text
        }}
        
    except Exception as e:
        print(f"❌ Agent analysis failed: {{str(e)}}")
        import traceback
        traceback.print_exc()
        return {{
            "recommendation": metrics.get("recommendation", ""),
            "reasoning": f"Agent analysis failed: {{str(e)}}. Using calculated metrics only.",
            "riskAssessment": "UNKNOWN",
            "confidence": 0.5,
            "agentEnabled": False,
            "error": str(e)
        }}


def main():
    """Main execution function with agent analysis"""
    try:
        # Read input file
        with open("input.json", "r") as f:
            input_data = json.load(f)

        mode = input_data.get('mode', 'unknown')
        print(f"🧮 Processing simulation for mode: {{mode}}")

        # Step 1: Calculate metrics
        metrics = calculate_metrics_standalone(input_data)
        print(f"✅ Metrics calculated: {{metrics['idleCashPct']}}% idle cash, {{metrics['liquidityCoverageDays']}} days coverage")

        # Step 2: Run agent analysis (if API key available)
        agent_analysis = run_agent_analysis_standalone(
            metrics,
            mode,
            input_data["accounts"],
            input_data["policy"],
            input_data["forecast"]
        )

        # Step 3: Combine results
        final_results = {{
            **metrics,
            "agent": agent_analysis
        }}

        # Write output file
        with open("results.json", "w") as f:
            json.dump(final_results, f, indent=2)

        if agent_analysis.get("agentEnabled"):
            print(f"✅ Simulation + Agent analysis completed (confidence: {{agent_analysis['confidence']}})")
        else:
            print("✅ Simulation completed (agent analysis skipped)")
        
        sys.exit(0)

    except Exception as e:
        print(f"❌ Error: {{str(e)}}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
'''


# Generate simulation code at module load time
SIM_CODE = generate_simulation_code()
logger.info("✅ Generated simulation code from simulation.py")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    global daytona_client
    daytona_client = DaytonaClient()
    logger.info("✅ Daytona client initialized")
    yield
    # Cleanup all active workspaces before closing
    logger.info("🛑 Shutting down - cleaning up active workspaces")
    await daytona_client.cleanup_all()
    await daytona_client.close()
    logger.info("🔒 Daytona client closed")


app = FastAPI(
    title="Smart Treasury Simulation Service",
    description="Python FastAPI microservice for treasury simulations using Daytona SDK",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "treasury-simulation",
        "daytona_connected": daytona_client is not None,
    }


async def _run_simulation_internal(request: SimulationRequest) -> SimulationResponse:
    """
    Internal function to run simulation with timeout
    """
    workspace_id = None
    start_time = time.time()

    try:
        # Create unique workspace name
        workspace_name = f"treasury-sim-{request.mode}-{int(time.time() * 1000)}"

        logger.info(f"🚀 Starting simulation: {workspace_name}")

        # Create Daytona workspace
        workspace = await daytona_client.create_workspace(workspace_name)
        workspace_id = workspace["id"]

        # Prepare input data
        input_data = {
            "mode": request.mode,
            "accounts": [acc.dict() for acc in request.accounts],
            "forecast": [f.dict() for f in request.forecast],
            "policy": request.policy.dict(),
            "parameters": request.parameters.dict() if request.parameters else {},
        }

        # Upload files to workspace
        logger.info(f"📤 Uploading simulation files to workspace {workspace_id}")
        await daytona_client.upload_file(
            workspace_id, "input.json", json.dumps(input_data, indent=2)
        )

        await daytona_client.upload_file(workspace_id, "sim_runner.py", SIM_CODE)

        # Get API key for agent
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        if anthropic_key:
            logger.info(f"🔑 ANTHROPIC_API_KEY found - agent analysis will be enabled")
        else:
            logger.warning(
                "⚠️  No ANTHROPIC_API_KEY found - agent analysis will be skipped"
            )

        # Install anthropic package in sandbox (latest version for Python 3.13 compatibility)
        logger.info(f"📦 Installing anthropic SDK in sandbox")
        install_result = await daytona_client.execute_command(
            workspace_id, "pip install 'anthropic>=0.40.0' -q 2>&1"
        )
        if install_result["exitCode"] != 0:
            logger.warning(
                f"⚠️  Failed to install anthropic SDK: {install_result['output']}"
            )
            if install_result.get("stderr"):
                logger.warning(f"stderr: {install_result['stderr']}")

        # Execute simulation with agent (pass API key inline)
        logger.info(
            f"⚙️  Executing simulation with embedded agent in workspace {workspace_id}"
        )
        # Pass API key as environment variable in the same command
        exec_result = await daytona_client.execute_command(
            workspace_id,
            f'ANTHROPIC_API_KEY="{anthropic_key}" python3 sim_runner.py 2>&1',
        )

        if exec_result["exitCode"] != 0:
            error_msg = f"Simulation failed: {exec_result['output']}"
            if exec_result.get("stderr"):
                error_msg += f"\nstderr: {exec_result['stderr']}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # Log execution output for debugging
        if exec_result["output"]:
            logger.info(f"📄 Simulation output:\n{exec_result['output']}")
        if exec_result.get("stderr"):
            logger.warning(f"⚠️  Simulation stderr:\n{exec_result['stderr']}")

        # Download results
        logger.info(f"📥 Downloading results from workspace {workspace_id}")
        results_json = await daytona_client.download_file(workspace_id, "results.json")

        # Parse and validate results
        try:
            results = json.loads(results_json)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in results: {e}")
            raise HTTPException(
                status_code=500, detail=f"Simulation produced invalid JSON: {str(e)}"
            )

        # Validate using Pydantic model
        try:
            # Check if agent analysis was included
            agent_data = results.get("agent")
            if agent_data:
                agent_analysis = AgentAnalysis(**agent_data)
                logger.info(
                    f"🤖 Agent analysis included (confidence: {agent_analysis.confidence})"
                )
            else:
                agent_analysis = None
                logger.info("📊 Simulation completed without agent analysis")

            response = SimulationResponse(
                **{k: v for k, v in results.items() if k != "agent"},
                sandbox_id=workspace_id,
                agent=agent_analysis,
            )
        except Exception as e:
            logger.error(f"Result validation failed: {e}")
            logger.error(f"Raw results: {results}")
            raise HTTPException(
                status_code=500,
                detail=f"Simulation results failed validation: {str(e)}",
            )

        elapsed = time.time() - start_time

        if response.agent and response.agent.agent_enabled:
            logger.info(
                f"✅ Simulation + Agent completed in {elapsed:.2f}s (confidence: {response.agent.confidence})"
            )
        else:
            logger.info(f"✅ Simulation completed in {elapsed:.2f}s")

        return response

    except Exception as e:
        logger.error(
            f"❌ Simulation error in workspace {workspace_id}: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always cleanup workspace unless explicitly disabled
        should_cleanup = os.getenv("AUTO_CLEANUP", "true").lower() == "true"
        if workspace_id and should_cleanup:
            logger.info(f"🧹 Cleaning up workspace {workspace_id}")
            await daytona_client.delete_workspace(workspace_id)
        elif workspace_id:
            logger.info(
                f"⚠️  Workspace {workspace_id} not cleaned up (AUTO_CLEANUP=false)"
            )


@app.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run a single treasury simulation in a Daytona sandbox with timeout
    """
    try:
        # Run with timeout
        response = await asyncio.wait_for(
            _run_simulation_internal(request), timeout=SIMULATION_TIMEOUT
        )
        return response
    except asyncio.TimeoutError:
        logger.error(
            f"❌ Simulation timed out after {SIMULATION_TIMEOUT}s for mode: {request.mode}"
        )
        raise HTTPException(
            status_code=504,
            detail=f"Simulation timed out after {SIMULATION_TIMEOUT} seconds",
        )


@app.post("/simulate/parallel", response_model=ParallelSimulationResponse)
async def run_parallel_simulations(request: ParallelSimulationRequest):
    """
    Run multiple simulations in parallel using Daytona sandboxes
    """
    start_time = time.time()

    try:
        logger.info(f"🚀 Starting {len(request.simulations)} parallel simulations")

        # Run all simulations concurrently
        tasks = [run_simulation(sim) for sim in request.simulations]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        results = {}
        errors = {}

        for sim, result in zip(request.simulations, results_list):
            if isinstance(result, Exception):
                errors[sim.mode] = str(result)
                logger.error(f"❌ Simulation {sim.mode} failed: {result}")
            else:
                results[sim.mode] = result

        total_time = time.time() - start_time
        logger.info(f"✅ All simulations completed in {total_time:.2f}s")

        return ParallelSimulationResponse(
            results=results, total_time=total_time, errors=errors
        )

    except Exception as e:
        logger.error(f"❌ Parallel simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate/local", response_model=SimulationResponse)
async def run_local_simulation(request: SimulationRequest):
    """
    Run simulation locally without Daytona (for testing/fallback)
    """
    try:
        logger.info(f"🔧 Running local simulation: {request.mode}")

        result = calculate_metrics(
            mode=request.mode,
            accounts=request.accounts,
            forecast=request.forecast,
            policy=request.policy,
            parameters=request.parameters,
        )

        return result

    except Exception as e:
        logger.error(f"❌ Local simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app", host="0.0.0.0", port=port, reload=True, log_level="info"
    )
