-- Migration: Historical Learning - Recommendation Outcomes Tracking
-- This table tracks all recommendations made and their outcomes for continuous learning

CREATE TABLE IF NOT EXISTS recommendation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenario_runs(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,
  
  -- What was recommended
  recommended_transfer_amount NUMERIC NOT NULL,
  recommended_from_account TEXT NOT NULL,
  recommended_to_account TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Predictions
  predicted_yield_bps INTEGER NOT NULL,
  predicted_risk_pct NUMERIC NOT NULL,
  
  -- Execution tracking
  was_executed BOOLEAN DEFAULT false,
  executed_transfer_amount NUMERIC,
  execution_timestamp TIMESTAMPTZ,
  
  -- Outcome tracking (measured 7 days later)
  actual_yield_bps INTEGER,
  actual_risk_pct NUMERIC,
  
  -- Follow-up metrics
  followup_idle_cash_pct NUMERIC,
  followup_liquidity_days NUMERIC,
  followup_collected_at TIMESTAMPTZ,
  
  -- User feedback
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'neutral', 'poor', NULL)),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add outcome_id to scenario_runs for linking
ALTER TABLE scenario_runs 
ADD COLUMN IF NOT EXISTS outcome_id UUID REFERENCES recommendation_outcomes(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outcomes_scenario ON recommendation_outcomes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_executed ON recommendation_outcomes(was_executed);
CREATE INDEX IF NOT EXISTS idx_outcomes_created ON recommendation_outcomes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outcomes_followup ON recommendation_outcomes(followup_collected_at) WHERE followup_collected_at IS NOT NULL;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommendation_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendation_outcomes_updated_at
  BEFORE UPDATE ON recommendation_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendation_outcomes_updated_at();

-- View for quick insights
CREATE OR REPLACE VIEW recommendation_insights AS
SELECT 
  COUNT(*) as total_recommendations,
  COUNT(*) FILTER (WHERE was_executed = true) as total_executed,
  ROUND(
    COUNT(*) FILTER (WHERE was_executed = true)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    1
  ) as execution_rate_pct,
  ROUND(AVG(confidence_score) FILTER (WHERE was_executed = true), 3) as avg_confidence_executed,
  ROUND(AVG(confidence_score) FILTER (WHERE was_executed = false), 3) as avg_confidence_ignored,
  ROUND(
    AVG(ABS(predicted_yield_bps - actual_yield_bps)) 
    FILTER (WHERE actual_yield_bps IS NOT NULL), 
    1
  ) as avg_yield_error_bps,
  ROUND(
    AVG(ABS(predicted_risk_pct - actual_risk_pct)) 
    FILTER (WHERE actual_risk_pct IS NOT NULL), 
    2
  ) as avg_risk_error_pct,
  COUNT(*) FILTER (WHERE followup_collected_at IS NOT NULL) as followups_completed
FROM recommendation_outcomes;

-- Grant permissions (adjust as needed)
-- ALTER TABLE recommendation_outcomes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE recommendation_outcomes IS 'Tracks all treasury recommendations and their outcomes for historical learning and model improvement';
COMMENT ON COLUMN recommendation_outcomes.was_executed IS 'Whether the user executed this recommendation';
COMMENT ON COLUMN recommendation_outcomes.followup_collected_at IS 'When we measured actual outcomes (typically 7 days after recommendation)';

