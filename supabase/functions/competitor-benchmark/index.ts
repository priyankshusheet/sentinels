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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { brand_domain, competitors, prompts } = await req.json();

    const messages = [
      {
        role: "system" as const,
        content: "You are a competitive intelligence analyst for AI visibility. Analyze brand visibility across AI platforms."
      },
      {
        role: "user" as const,
        content: `Compare these domains for AI visibility:
Brand: ${brand_domain}
Competitors: ${(competitors || []).join(", ")}
Test prompts: ${(prompts || []).join(", ")}

Return JSON:
{
  "benchmark": [
    {
      "domain": "example.com",
      "visibility_score": 0-100,
      "sentiment_score": 0-100,
      "estimated_citations": number,
      "top_llm": "ChatGPT|Claude|Gemini|Perplexity",
      "trend": number (-10 to 10)
    }
  ],
  "gaps": [
    {
      "query": "prompt text",
      "competitor": "name",
      "competitor_score": 0-100,
      "your_score": 0-100,
      "category": "Best Of Lists|Comparisons|How-to Guides|General"
    }
  ]
}
Return ONLY valid JSON.`
      }
    ];

    const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/ai-fallback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!fallbackResponse.ok) throw new Error(`AI fallback error: ${fallbackResponse.status}`);

    const aiResult = await fallbackResponse.json();
    let parsed;
    try {
      parsed = JSON.parse(aiResult.content);
    } catch {
      const jsonMatch = (aiResult.content || "").match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { benchmark: [], gaps: [] };
    }

    return new Response(JSON.stringify({ status: "success", ...parsed, provider: aiResult.provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("competitor-benchmark error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
