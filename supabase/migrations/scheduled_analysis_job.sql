-- Migration: scheduled_analysis_job.sql
-- Enable pg_cron and schedule weekly visibility checks

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the automation function
CREATE OR REPLACE FUNCTION run_automated_visibility_checks()
RETURNS void AS $$
DECLARE
    prompt_record RECORD;
BEGIN
    -- This function would ideally call the backend API for each prompt.
    -- Since SQL cannot easily call HTTP without extensions, we log the intent or
    -- trigger a notify to a background worker.
    -- For now, we'll use it to mark prompts for "re-check" which a backend worker can pick up.
    
    UPDATE tracked_prompts 
    SET updated_at = now()
    WHERE visibility_score < 70 OR updated_at < now() - interval '7 days';
    
    -- In a real setup, we might use net.http_post if pg_net is available.
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the job (Every Monday at 00:00)
SELECT cron.schedule('weekly-visibility-check', '0 0 * * 1', 'SELECT run_automated_visibility_checks()');
