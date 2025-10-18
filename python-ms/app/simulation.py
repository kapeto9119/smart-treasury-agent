"""Treasury simulation logic"""

from typing import List, Optional
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
