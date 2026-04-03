-- Phase 9: Market Leadership

-- AI Agents Table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    persona TEXT NOT NULL, -- Monitor, Auditor, Optimizer
    status TEXT DEFAULT 'idle', -- idle, running, disabled
    last_run TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agents" ON public.ai_agents
    FOR ALL USING (auth.uid() = user_id);

-- Agent Logs
CREATE TABLE IF NOT EXISTS public.agent_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see logs for their agents" ON public.agent_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_agents 
            WHERE ai_agents.id = agent_activity_logs.agent_id 
            AND ai_agents.user_id = auth.uid()
        )
    );

-- Knowledge Graph Entities (Cache of relationships)
CREATE TABLE IF NOT EXISTS public.knowledge_graph_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_name TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- Brand, Competitor, Topic, Keyword
    mentions_count INT DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.knowledge_graph_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their graph entities" ON public.knowledge_graph_entities
    FOR SELECT USING (auth.uid() = user_id);

-- Knowledge Graph Edges (Relationships)
CREATE TABLE IF NOT EXISTS public.knowledge_graph_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES public.knowledge_graph_entities(id) ON DELETE CASCADE,
    target_id UUID REFERENCES public.knowledge_graph_entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- "cites", "mentions_alongside", "competitor_of"
    strength FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now()
);
