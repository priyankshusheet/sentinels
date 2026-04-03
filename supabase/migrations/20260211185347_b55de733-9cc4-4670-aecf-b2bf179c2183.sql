
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  selected_llms TEXT[] DEFAULT ARRAY['chatgpt', 'claude'],
  goals TEXT[] DEFAULT ARRAY['visibility'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own competitors" ON public.competitors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tracked prompts
CREATE TABLE public.tracked_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracked_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prompts" ON public.tracked_prompts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prompt rankings (results from LLM analysis)
CREATE TABLE public.prompt_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.tracked_prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  llm_platform TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('mentioned', 'partial', 'not_mentioned')),
  confidence_score INTEGER DEFAULT 0,
  rank_position INTEGER,
  ai_response TEXT,
  citations_found INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own rankings" ON public.prompt_rankings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rankings" ON public.prompt_rankings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Citations
CREATE TABLE public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  domain TEXT,
  mention_count INTEGER DEFAULT 0,
  authority_score INTEGER DEFAULT 0,
  is_owned BOOLEAN DEFAULT false,
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  last_detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own citations" ON public.citations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sentiment tracking
CREATE TABLE public.sentiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  llm_platform TEXT NOT NULL,
  overall_sentiment TEXT NOT NULL CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score NUMERIC(4,2) DEFAULT 0,
  positive_pct NUMERIC(5,2) DEFAULT 0,
  neutral_pct NUMERIC(5,2) DEFAULT 0,
  negative_pct NUMERIC(5,2) DEFAULT 0,
  sample_response TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sentiment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sentiment" ON public.sentiment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sentiment" ON public.sentiment_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('citation_lost', 'competitor_detected', 'visibility_change', 'content_gap', 'sentiment_shift')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optimization recommendations
CREATE TABLE public.optimization_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('schema', 'content_gap', 'technical', 'authority', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  ai_suggestion TEXT,
  target_url TEXT,
  impact_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.optimization_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.optimization_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  data JSONB DEFAULT '{}',
  visibility_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reports" ON public.reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tracked_prompts_updated_at BEFORE UPDATE ON public.tracked_prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
