
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS alert_preferences jsonb DEFAULT '{"visibility_drop": true, "competitor_gain": true, "new_citation": false, "weekly_summary": true}'::jsonb;
