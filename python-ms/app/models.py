"""Pydantic models for API request/response validation"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


class AccountType(str, Enum):
    checking = "checking"
    savings = "savings"
    high_yield = "high_yield"
    money_market = "money_market"
    reserve = "reserve"


class Account(BaseModel):
    id: str
    name: str
    bank: str
    currency: str
    balance: float
    account_type: AccountType


class ForecastItem(BaseModel):
    id: str
    date: str
    inflow: float
    outflow: float
    description: Optional[str] = None


class Policy(BaseModel):
    id: str
    name: str
    min_liquidity: float
    invest_above: float
    risk_profile: str


class SimulationMode(str, Enum):
    conservative = "conservative"
    balanced = "balanced"
    aggressive = "aggressive"
    custom = "custom"


class SimulationParameters(BaseModel):
    """Custom parameters for scenario tuning"""

    liquidity_threshold_pct: Optional[float] = (
        None  # e.g., 10 = maintain 10% cash buffer
    )
    investment_horizon_days: Optional[int] = None  # 7, 30, 90 days
    risk_appetite: Optional[str] = None  # "low", "medium", "high"
    custom_risk_multiplier: Optional[float] = None  # Override default multiplier
    custom_transfer_threshold: Optional[float] = None  # Override transfer threshold
    fx_rates: Optional[Dict[str, float]] = None  # Custom FX assumptions


class SimulationRequest(BaseModel):
    mode: SimulationMode
    accounts: List[Account]
    forecast: List[ForecastItem]
    policy: Policy
    parameters: Optional[SimulationParameters] = None


class TransferDetails(BaseModel):
    from_account: str = Field(alias="fromAccount")
    to_account: str = Field(alias="toAccount")
    amount: float

    class Config:
        populate_by_name = True


class SimulationResponse(BaseModel):
    idle_cash_pct: float = Field(alias="idleCashPct")
    liquidity_coverage_days: float = Field(alias="liquidityCoverageDays")
    est_yield_bps: int = Field(alias="estYieldBps")
    shortfall_risk_pct: float = Field(alias="shortfallRiskPct")
    recommendation: str
    transfer_details: TransferDetails = Field(alias="transferDetails")
    sandbox_id: Optional[str] = None

    class Config:
        populate_by_name = True


class ParallelSimulationRequest(BaseModel):
    simulations: List[SimulationRequest]


class ParallelSimulationResponse(BaseModel):
    results: Dict[str, SimulationResponse]
    total_time: float
    errors: Dict[str, str] = {}
