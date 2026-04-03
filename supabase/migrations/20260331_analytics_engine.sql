-- Migration: 20260331_analytics_engine.sql
-- Create a materialized view for daily visibility aggregates by user and platform

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_visibility_aggregates AS
SELECT 
    user_id,
    llm_platform,
    date_trunc('day', checked_at) as aggregate_date,
    avg(confidence_score) as avg_visibility_score,
    count(*) as total_checks,
    sum(citations_found) as total_citations
FROM 
    prompt_rankings
GROUP BY 
    user_id, 
    llm_platform, 
    date_trunc('day', checked_at);

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_visibility_user_platform_date 
ON daily_visibility_aggregates (user_id, llm_platform, aggregate_date);

-- Function to refresh the view (can be called via cron)
CREATE OR REPLACE FUNCTION refresh_daily_visibility_aggregates()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_visibility_aggregates;
END;
$$ LANGUAGE plpgsql;
