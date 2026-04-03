
CREATE TABLE public.business_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_account_id text,
  platform_account_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  scopes text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.business_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connections"
  ON public.business_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.website_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  website_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  crawl_data jsonb DEFAULT '{}'::jsonb,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  pages_crawled integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.website_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analyses"
  ON public.website_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
