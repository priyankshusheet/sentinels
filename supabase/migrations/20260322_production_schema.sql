-- Phase 1 Production Schema Update

-- 1. Websites Table (Multi-site support)
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own websites" ON public.websites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Content Gaps Table
CREATE TABLE IF NOT EXISTS public.content_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    keyword TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'planned', 'completed', 'ignored')),
    suggested_content TEXT,
    competitor_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content gaps" ON public.content_gaps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Refine Prompt Rankings (Add raw JSON response support)
ALTER TABLE public.prompt_rankings ADD COLUMN IF NOT EXISTS raw_response JSONB DEFAULT '{}';
ALTER TABLE public.prompt_rankings ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE;

-- 4. Refine Citations
ALTER TABLE public.citations ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE;
ALTER TABLE public.citations ADD COLUMN IF NOT EXISTS ranking_id UUID REFERENCES public.prompt_rankings(id) ON DELETE CASCADE;

-- 5. Updated_at triggers
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_content_gaps_updated_at BEFORE UPDATE ON public.content_gaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
