# Smart Treasury Simulation Runner

Python-based simulation engine for treasury cash management scenarios.

## Overview

This simulation calculates key treasury metrics based on:
- Current account balances
- Cash flow forecasts
- Treasury policies
- Strategic mode (conservative/balanced/aggressive)

## Usage

The simulation expects an `input.json` file with the following structure:

```json
{
  "mode": "balanced",
  "accounts": [
    {
      "id": "uuid",
      "name": "Operating Account",
      "account_type": "checking",
      "balance": 500000,
      "currency": "USD"
    }
  ],
  "forecast": [
    {
      "date": "2025-10-19",
      "inflow": 50000,
      "outflow": 30000
    }
  ],
  "policy": {
    "min_liquidity": 100000,
    "invest_above": 50000,
    "risk_profile": "balanced"
  }
}
```

Run the simulation:

```bash
python3 sim_runner.py
```

Output will be written to `results.json`:

```json
{
  "idleCashPct": 22.5,
  "liquidityCoverageDays": 12.3,
  "estYieldBps": 115,
  "shortfallRiskPct": 6.2,
  "recommendation": "Transfer $70,000 from Checking to High-Yield",
  "transferDetails": {
    "fromAccount": "Operating Account",
    "toAccount": "High-Yield Account",
    "amount": 70000
  }
}
```

## Metrics Explained

- **idleCashPct**: Percentage of total cash that's sitting idle (not needed for liquidity)
- **liquidityCoverageDays**: Number of days current cash can cover average daily outflows
- **estYieldBps**: Estimated yield improvement in basis points (1 bp = 0.01%)
- **shortfallRiskPct**: Estimated probability of cash shortfall
- **recommendation**: Natural language action recommendation

## Mode Strategies

### Conservative
- Maintains higher cash buffers (1.5x forecasted outflows)
- Transfers only 80% of excess cash
- Lower shortfall risk (2-8%)
- Lower yield optimization

### Balanced
- Moderate cash buffers (1.2x forecasted outflows)
- Transfers 60% of excess cash
- Balanced risk/return (5-10%)

### Aggressive
- Minimum cash buffers (1.0x forecasted outflows)
- Transfers only 40% of excess cash (keeps flexibility)
- Higher yield optimization
- Higher shortfall risk (5-15%)

## Dependencies

None - uses only Python standard library for maximum portability.

## Integration

Designed to run in isolated Daytona sandboxes:
1. Create sandbox
2. Upload input.json
3. Upload sim_runner.py
4. Execute: `python3 sim_runner.py`
5. Download results.json

