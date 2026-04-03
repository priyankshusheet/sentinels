-- Phase 8: Competitive Differentiation

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analysis Cache for LLM results
CREATE TABLE IF NOT EXISTS public.analysis_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_query TEXT NOT NULL,
    provider TEXT NOT NULL,
    content TEXT NOT NULL,
    parsed_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(prompt_query, provider)
);

-- Enable RLS
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.analysis_cache FOR SELECT USING (true);

-- Competitor suggestions (Auto-discovery)
CREATE TABLE IF NOT EXISTS public.competitor_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website_url TEXT,
    industry TEXT,
    confidence_score FLOAT,
    reasoning TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.competitor_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own suggestions" ON public.competitor_suggestions
    FOR ALL USING (auth.uid() = user_id);
