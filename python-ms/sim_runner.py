#!/usr/bin/env python3
"""
Smart Treasury Agent - Simulation Runner
Calculates treasury metrics based on different strategic modes
"""

import json
import sys
from datetime import datetime


def calculate_metrics(data):
    """
    Calculate treasury metrics based on input data and mode

    Args:
        data: Dictionary containing mode, accounts, forecast, and policy

    Returns:
        Dictionary containing calculated metrics and recommendation
    """
    mode = data["mode"]
    accounts = data["accounts"]
    forecast = data["forecast"]
    policy = data["policy"]

    # Calculate total cash across all accounts
    total_cash = sum(acc["balance"] for acc in accounts)

    # Get checking and high-yield account balances
    checking = next(
        (acc for acc in accounts if acc["account_type"] == "checking"), None
    )
    high_yield = next(
        (acc for acc in accounts if acc["account_type"] == "high_yield"), None
    )

    checking_balance = checking["balance"] if checking else 0
    high_yield_balance = high_yield["balance"] if high_yield else 0

    # Calculate next 7 days outflow
    next_7d_outflow = sum(f["outflow"] for f in forecast[:7])
    next_7d_inflow = sum(f["inflow"] for f in forecast[:7])
    avg_daily_outflow = next_7d_outflow / 7 if len(forecast) >= 7 else 0

    # Mode-specific parameters
    risk_multipliers = {
        "conservative": 1.5,  # Keep more cash buffer
        "balanced": 1.2,  # Moderate buffer
        "aggressive": 1.0,  # Minimum buffer
        "custom": 1.3,
    }

    transfer_thresholds = {
        "conservative": 0.8,  # Transfer 80% of excess
        "balanced": 0.6,  # Transfer 60% of excess
        "aggressive": 0.4,  # Transfer 40% of excess
        "custom": 0.7,
    }

    risk_mult = risk_multipliers.get(mode, 1.2)
    transfer_thresh = transfer_thresholds.get(mode, 0.6)

    # Calculate buffer needed
    buffer_needed = policy["min_liquidity"] + (next_7d_outflow * risk_mult)

    # Calculate idle cash (cash above what's needed)
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
            f"Transfer ${transfer_amount:,.0f} from {from_account} to {to_account}"
        )

    # Calculate estimated yield
    est_yield_bps = 0
    if transfer_amount > 0:
        # Assuming high-yield account pays 5% APY (500 bps)
        est_yield_bps = (
            int((transfer_amount * 500) / total_cash) if total_cash > 0 else 0
        )

    # Calculate shortfall risk percentage
    if mode == "aggressive":
        # Higher risk due to lower buffer
        shortfall_risk_pct = min(15, 5 + (idle_cash_pct * 0.3))
    elif mode == "conservative":
        # Lower risk with higher buffer
        shortfall_risk_pct = max(2, 8 - (liquidity_coverage_days * 0.2))
    else:  # balanced or custom
        shortfall_risk_pct = 5 + (
            (15 - liquidity_coverage_days) * 0.3 if liquidity_coverage_days < 15 else 0
        )

    # Ensure risk is within reasonable bounds
    shortfall_risk_pct = max(1, min(20, shortfall_risk_pct))

    return {
        "idleCashPct": round(idle_cash_pct, 2),
        "liquidityCoverageDays": round(liquidity_coverage_days, 1),
        "estYieldBps": est_yield_bps,
        "shortfallRiskPct": round(shortfall_risk_pct, 1),
        "recommendation": recommendation,
        "transferDetails": {
            "fromAccount": from_account,
            "toAccount": to_account,
            "amount": round(transfer_amount, 2),
        },
    }


def main():
    """Main execution function"""
    try:
        # Read input file
        with open("input.json", "r") as f:
            input_data = json.load(f)

        print(f"Processing simulation for mode: {input_data.get('mode', 'unknown')}")

        # Calculate metrics
        results = calculate_metrics(input_data)

        # Write output file
        with open("results.json", "w") as f:
            json.dump(results, f, indent=2)

        print("Simulation completed successfully")
        print(f"Results: {json.dumps(results, indent=2)}")

        sys.exit(0)

    except FileNotFoundError:
        print("Error: input.json file not found", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file - {str(e)}", file=sys.stderr)
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing required field in input - {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
