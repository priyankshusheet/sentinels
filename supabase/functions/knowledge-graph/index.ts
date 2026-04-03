import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all relevant data
    const [profileRes, promptsRes, citationsRes, competitorsRes, rankingsRes] = await Promise.all([
      supabase.from("profiles").select("company_name, industry, website_url").eq("user_id", user.id).single(),
      supabase.from("tracked_prompts").select("id, query, category").eq("user_id", user.id).eq("is_active", true),
      supabase.from("citations").select("id, source_name, domain, sentiment, mention_count, is_owned, authority_score").eq("user_id", user.id),
      supabase.from("competitors").select("id, name, domain").eq("user_id", user.id),
      supabase.from("prompt_rankings").select("prompt_id, llm_platform, visibility, confidence_score").eq("user_id", user.id).order("checked_at", { ascending: false }).limit(100),
    ]);

    const profile = profileRes.data;
    const prompts = promptsRes.data || [];
    const citations = citationsRes.data || [];
    const competitors = competitorsRes.data || [];
    const rankings = rankingsRes.data || [];

    // Build the knowledge graph
    interface GraphNode {
      id: string;
      label: string;
      type: "brand" | "topic" | "citation" | "competitor" | "llm_platform";
      weight: number;
      metadata: Record<string, any>;
    }
    interface GraphEdge {
      source: string;
      target: string;
      type: string;
      weight: number;
      label?: string;
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Brand node (center)
    const brandName = profile?.company_name || "Your Brand";
    nodes.push({
      id: "brand",
      label: brandName,
      type: "brand",
      weight: 100,
      metadata: { industry: profile?.industry, website: profile?.website_url },
    });

    // Topic nodes from tracked prompts (grouped by category)
    const categoryMap = new Map<string, { count: number; prompts: string[]; avgScore: number }>();
    for (const p of prompts) {
      const cat = p.category || "General";
      if (!categoryMap.has(cat)) categoryMap.set(cat, { count: 0, prompts: [], avgScore: 0 });
      const entry = categoryMap.get(cat)!;
      entry.count++;
      entry.prompts.push(p.query);

      // Get average score for this prompt
      const promptRankings = rankings.filter(r => r.prompt_id === p.id);
      if (promptRankings.length > 0) {
        const avg = promptRankings.reduce((a, r) => a + (r.confidence_score || 0), 0) / promptRankings.length;
        entry.avgScore = Math.max(entry.avgScore, avg);
      }
    }

    for (const [category, data] of categoryMap) {
      const nodeId = `topic_${category.toLowerCase().replace(/\s+/g, "_")}`;
      nodes.push({
        id: nodeId,
        label: category,
        type: "topic",
        weight: data.count * 20 + data.avgScore,
        metadata: { prompt_count: data.count, avg_score: Math.round(data.avgScore), prompts: data.prompts.slice(0, 3) },
      });
      edges.push({
        source: "brand",
        target: nodeId,
        type: "covers_topic",
        weight: data.avgScore,
        label: `${Math.round(data.avgScore)}% visibility`,
      });
    }

    // Citation nodes
    for (const c of citations) {
      const nodeId = `citation_${c.id}`;
      nodes.push({
        id: nodeId,
        label: c.source_name,
        type: "citation",
        weight: (c.mention_count || 1) * 10 + (c.authority_score || 0),
        metadata: {
          domain: c.domain,
          sentiment: c.sentiment,
          mentions: c.mention_count,
          authority: c.authority_score,
          is_owned: c.is_owned,
        },
      });
      edges.push({
        source: "brand",
        target: nodeId,
        type: c.is_owned ? "owns" : "cited_by",
        weight: (c.mention_count || 1) * (c.is_owned ? 2 : 1),
        label: `${c.mention_count || 0} mentions`,
      });

      // Connect citations to relevant topics
      for (const [category, data] of categoryMap) {
        const topicId = `topic_${category.toLowerCase().replace(/\s+/g, "_")}`;
        const nameMatch = data.prompts.some(p =>
          p.toLowerCase().includes(c.source_name.toLowerCase()) ||
          (c.domain && p.toLowerCase().includes(c.domain.toLowerCase()))
        );
        if (nameMatch) {
          edges.push({ source: nodeId, target: topicId, type: "supports", weight: 5 });
        }
      }
    }

    // Competitor nodes
    for (const comp of competitors) {
      const nodeId = `competitor_${comp.id}`;
      nodes.push({
        id: nodeId,
        label: comp.name,
        type: "competitor",
        weight: 50,
        metadata: { domain: comp.domain },
      });
      edges.push({
        source: "brand",
        target: nodeId,
        type: "competes_with",
        weight: 30,
      });

      // Connect competitors to topics they might overlap on
      for (const [category] of categoryMap) {
        const topicId = `topic_${category.toLowerCase().replace(/\s+/g, "_")}`;
        edges.push({ source: nodeId, target: topicId, type: "competes_in", weight: 10 });
      }
    }

    // LLM Platform nodes
    const platformScores = new Map<string, { total: number; mentioned: number; avgScore: number }>();
    for (const r of rankings) {
      if (!platformScores.has(r.llm_platform)) {
        platformScores.set(r.llm_platform, { total: 0, mentioned: 0, avgScore: 0 });
      }
      const ps = platformScores.get(r.llm_platform)!;
      ps.total++;
      if (r.visibility === "mentioned") ps.mentioned++;
      ps.avgScore += r.confidence_score || 0;
    }

    for (const [platform, data] of platformScores) {
      const nodeId = `llm_${platform.toLowerCase().replace(/\s+/g, "_")}`;
      const avgScore = data.total > 0 ? Math.round(data.avgScore / data.total) : 0;
      const mentionRate = data.total > 0 ? Math.round((data.mentioned / data.total) * 100) : 0;
      nodes.push({
        id: nodeId,
        label: platform,
        type: "llm_platform",
        weight: avgScore,
        metadata: { mention_rate: mentionRate, total_checks: data.total, avg_score: avgScore },
      });
      edges.push({
        source: "brand",
        target: nodeId,
        type: "visible_on",
        weight: avgScore,
        label: `${mentionRate}% mention rate`,
      });
    }

    // AI-powered insights if available
    let insights = null;
    if (GEMINI_API_KEY && nodes.length > 3) {
      try {
        const graphSummary = `Brand: ${brandName}, Industry: ${profile?.industry || "unknown"}.
Topics: ${Array.from(categoryMap.keys()).join(", ")}.
Citations: ${citations.length} (${citations.filter(c => c.is_owned).length} owned).
Competitors: ${competitors.map(c => c.name).join(", ") || "none"}.
LLM platforms: ${Array.from(platformScores.entries()).map(([p, d]) => `${p}: ${Math.round((d.mentioned/d.total)*100)}% mention rate`).join(", ")}.`;

        const aiResponse = await fetch("https://ai.gateway.gemini.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a brand visibility strategist. Analyze the entity graph and provide strategic insights." },
              { role: "user", content: `Analyze this brand knowledge graph:\n${graphSummary}\n\nProvide 3 strategic insights about entity relationships, gaps, and opportunities.` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "graph_insights",
                description: "Return strategic insights about the brand's knowledge graph",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          impact: { type: "string", enum: ["high", "medium", "low"] },
                          category: { type: "string", enum: ["gap", "opportunity", "risk", "strength"] },
                        },
                        required: ["title", "description", "impact", "category"],
                        additionalProperties: false,
                      },
                    },
                    overall_health: { type: "number", description: "Overall graph health score 0-100" },
                  },
                  required: ["insights", "overall_health"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "graph_insights" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          insights = JSON.parse(toolCall?.function?.arguments || "null");
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    return new Response(JSON.stringify({
      nodes,
      edges,
      insights,
      stats: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        topics: categoryMap.size,
        citations: citations.length,
        competitors: competitors.length,
        platforms: platformScores.size,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("knowledge-graph error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
