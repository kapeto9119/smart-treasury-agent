"""Treasury simulation logic with embedded agent analysis"""

from typing import List, Optional, Dict, Any
import os
import re
from .models import (
    Account,
    ForecastItem,
    Policy,
    SimulationResponse,
    TransferDetails,
    SimulationParameters,
)


def calculate_metrics(
    mode: str,
    accounts: List[Account],
    forecast: List[ForecastItem],
    policy: Policy,
    parameters: Optional[SimulationParameters] = None,
) -> SimulationResponse:
    """
    Calculate treasury metrics based on input data and mode

    Args:
        mode: Simulation mode (conservative/balanced/aggressive)
        accounts: List of bank accounts
        forecast: Cash flow forecast items
        policy: Treasury policy settings

    Returns:
        SimulationResponse with calculated metrics
    """
    # Calculate total cash
    total_cash = sum(acc.balance for acc in accounts)

    # Get checking and high-yield account balances
    checking = next((acc for acc in accounts if acc.account_type == "checking"), None)
    high_yield = next(
        (acc for acc in accounts if acc.account_type == "high_yield"), None
    )

    checking_balance = checking.balance if checking else 0
    high_yield_balance = high_yield.balance if high_yield else 0

    # Get investment horizon (default 7 days or custom)
    params = parameters or SimulationParameters()
    horizon_days = params.investment_horizon_days or 7

    # Calculate forecast for the specified horizon
    horizon_forecast = (
        forecast[:horizon_days] if len(forecast) >= horizon_days else forecast
    )
    horizon_outflow = sum(f.outflow for f in horizon_forecast)
    horizon_inflow = sum(f.inflow for f in horizon_forecast)
    avg_daily_outflow = (
        horizon_outflow / len(horizon_forecast) if len(horizon_forecast) > 0 else 0
    )

    # Mode-specific parameters with overrides
    default_risk_multipliers = {
        "conservative": 1.5,
        "balanced": 1.2,
        "aggressive": 1.0,
        "custom": 1.3,
    }

    default_transfer_thresholds = {
        "conservative": 0.8,
        "balanced": 0.6,
        "aggressive": 0.4,
        "custom": 0.7,
    }

    # Apply risk appetite override
    if params.risk_appetite:
        risk_appetite_map = {"low": 1.5, "medium": 1.2, "high": 1.0}
        risk_mult = params.custom_risk_multiplier or risk_appetite_map.get(
            params.risk_appetite, 1.2
        )
    else:
        risk_mult = params.custom_risk_multiplier or default_risk_multipliers.get(
            mode, 1.2
        )

    transfer_thresh = (
        params.custom_transfer_threshold or default_transfer_thresholds.get(mode, 0.6)
    )

    # Calculate buffer needed with custom liquidity threshold
    if params.liquidity_threshold_pct:
        # Use percentage-based threshold if provided
        liquidity_buffer = total_cash * (params.liquidity_threshold_pct / 100)
        buffer_needed = max(policy.min_liquidity, liquidity_buffer)
    else:
        # Use standard calculation
        buffer_needed = policy.min_liquidity + (horizon_outflow * risk_mult)

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

    if idle_cash > policy.invest_above * transfer_thresh:
        transfer_amount = idle_cash * transfer_thresh
        from_account = checking.name if checking else "Checking"
        to_account = high_yield.name if high_yield else "High-Yield account"
        recommendation = (
            f"Transfer ${transfer_amount:,.0f} from {from_account} to {to_account}"
        )

    # Calculate estimated yield
    est_yield_bps = 0
    if transfer_amount > 0:
        est_yield_bps = (
            int((transfer_amount * 500) / total_cash) if total_cash > 0 else 0
        )

    # Calculate shortfall risk
    if mode == "aggressive":
        shortfall_risk_pct = min(15, 5 + (idle_cash_pct * 0.3))
    elif mode == "conservative":
        shortfall_risk_pct = max(2, 8 - (liquidity_coverage_days * 0.2))
    else:
        shortfall_risk_pct = 5 + (
            (15 - liquidity_coverage_days) * 0.3 if liquidity_coverage_days < 15 else 0
        )

    shortfall_risk_pct = max(1, min(20, shortfall_risk_pct))

    return SimulationResponse(
        idleCashPct=round(idle_cash_pct, 2),
        liquidityCoverageDays=round(liquidity_coverage_days, 1),
        estYieldBps=est_yield_bps,
        shortfallRiskPct=round(shortfall_risk_pct, 1),
        recommendation=recommendation,
        transferDetails=TransferDetails(
            fromAccount=from_account,
            toAccount=to_account,
            amount=round(transfer_amount, 2),
        ),
    )


def run_agent_analysis(
    metrics: Dict[str, Any],
    mode: str,
    accounts: List[Account],
    policy: Policy,
    forecast: List[ForecastItem],
) -> Dict[str, Any]:
    """
    Run LLM agent analysis on calculated metrics.
    This function is designed to run INSIDE the Daytona sandbox.

    Args:
        metrics: Calculated simulation metrics
        mode: Simulation mode (conservative/balanced/aggressive)
        accounts: List of bank accounts
        policy: Treasury policy settings
        forecast: Cash flow forecast

    Returns:
        Dict with agent's recommendation, reasoning, risk assessment, and confidence
    """
    try:
        # Import anthropic inside function (will be available in sandbox)
        from anthropic import Anthropic

        api_key = os.getenv("ANTHROPIC_API_KEY")
        print(f"🔑 API key present: {bool(api_key)}", flush=True)
        if not api_key:
            print("❌ No API key found!", flush=True)
            return {
                "recommendation": metrics.get("recommendation", ""),
                "reasoning": "Agent analysis skipped - no API key provided",
                "risk_assessment": "UNKNOWN",
                "confidence": 0.5,
                "agent_enabled": False,
            }

        # Initialize Claude client
        print("🤖 Initializing Anthropic client...", flush=True)
        client = Anthropic(api_key=api_key)
        print("✅ Client initialized", flush=True)

        # Calculate context
        total_cash = sum(acc.balance for acc in accounts)
        next_7_days = forecast[:7] if len(forecast) >= 7 else forecast
        total_inflow = sum(f.inflow for f in next_7_days)
        total_outflow = sum(f.outflow for f in next_7_days)
        net_position = total_inflow - total_outflow

        # Build comprehensive prompt
        prompt = f"""You are an AI treasury agent running inside a secure sandbox environment. You just completed a treasury simulation and need to provide expert analysis.

**SIMULATION MODE:** {mode.upper()}

**CALCULATED METRICS:**
- Idle Cash: {metrics['idleCashPct']}%
- Liquidity Coverage: {metrics['liquidityCoverageDays']} days
- Estimated Yield: {metrics['estYieldBps']} basis points
- Shortfall Risk: {metrics['shortfallRiskPct']}%
- Transfer Amount: ${metrics['transferDetails']['amount']:,.0f}

**ACCOUNT CONTEXT:**
Total Cash Position: ${total_cash:,.0f}
{chr(10).join([f"- {acc.name} ({acc.account_type}): ${acc.balance:,.0f}" for acc in accounts])}

**TREASURY POLICY:**
- Minimum Liquidity Required: ${policy.min_liquidity:,.0f}
- Invest Above Threshold: ${policy.invest_above:,.0f}
- Risk Profile: {policy.risk_profile}

**7-DAY FORECAST:**
- Expected Inflows: ${total_inflow:,.0f}
- Expected Outflows: ${total_outflow:,.0f}
- Net Position: ${net_position:,.0f}

**YOUR TASK:**
As an embedded treasury agent, analyze these metrics and provide:

1. **RECOMMENDATION:** A clear, actionable recommendation (1-2 sentences)
2. **REASONING:** Detailed explanation of your analysis, including:
   - Why this recommendation makes sense given the metrics
   - How it aligns with the {mode} strategy
   - Any market or timing considerations
3. **RISK_ASSESSMENT:** Rate the risk level (LOW/MEDIUM/HIGH) and explain why
4. **CONFIDENCE:** Your confidence score (0.0 to 1.0) in this recommendation

Format your response EXACTLY as:
RECOMMENDATION: [your recommendation]
REASONING: [your detailed reasoning]
RISK_ASSESSMENT: [LOW/MEDIUM/HIGH] - [explanation]
CONFIDENCE: [0.0-1.0]"""

        # Call Claude
        print("📡 Calling Claude API...", flush=True)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
            system="You are an expert treasury analyst AI agent embedded in a simulation sandbox. Provide precise, data-driven analysis.",
        )
        print("✅ Claude API call successful!", flush=True)

        # Parse response
        text = response.content[0].text if response.content else ""

        # Extract components using regex
        recommendation_match = re.search(
            r"RECOMMENDATION:\s*(.+?)(?=REASONING:|$)", text, re.DOTALL
        )
        reasoning_match = re.search(
            r"REASONING:\s*(.+?)(?=RISK_ASSESSMENT:|$)", text, re.DOTALL
        )
        risk_match = re.search(
            r"RISK_ASSESSMENT:\s*(.+?)(?=CONFIDENCE:|$)", text, re.DOTALL
        )
        confidence_match = re.search(r"CONFIDENCE:\s*([\d.]+)", text)

        recommendation = (
            recommendation_match.group(1).strip()
            if recommendation_match
            else metrics.get("recommendation", "")
        )
        reasoning = (
            reasoning_match.group(1).strip()
            if reasoning_match
            else "Analysis completed based on calculated metrics."
        )
        risk_assessment = (
            risk_match.group(1).strip()
            if risk_match
            else "MEDIUM - Standard risk profile"
        )
        confidence = float(confidence_match.group(1)) if confidence_match else 0.75

        # Ensure confidence is between 0 and 1
        confidence = max(0.0, min(1.0, confidence))

        return {
            "recommendation": recommendation,
            "reasoning": reasoning,
            "risk_assessment": risk_assessment,
            "confidence": confidence,
            "agent_enabled": True,
            "raw_response": text,
        }

    except Exception as e:
        # Fallback if agent fails
        import traceback

        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"❌ Agent analysis failed: {error_details}", flush=True)
        return {
            "recommendation": metrics.get("recommendation", ""),
            "reasoning": f"Agent analysis failed: {str(e)}. Using calculated metrics only.",
            "risk_assessment": "UNKNOWN",
            "confidence": 0.5,
            "agent_enabled": False,
            "error": error_details,
        }
