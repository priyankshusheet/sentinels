-- Add webhook and alert preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alert_preferences JSONB DEFAULT '{"citation_lost": true, "competitor_detected": true, "visibility_change": true, "content_gap": true, "sentiment_shift": false}'::jsonb;
