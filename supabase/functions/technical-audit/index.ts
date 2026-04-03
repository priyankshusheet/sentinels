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

    const { url } = await req.json();

    const messages = [
      {
        role: "system" as const,
        content: "You are a technical SEO/AEO auditor. Analyze websites for AI visibility optimization."
      },
      {
        role: "user" as const,
        content: `Perform a technical AEO audit for: ${url}

Return JSON:
{
  "overall_score": 0-100,
  "categories": [
    {
      "name": "Schema Markup",
      "score": 0-100,
      "issues": ["issue description"],
      "recommendations": ["fix description"]
    }
  ],
  "critical_issues": number,
  "warnings": number,
  "passed": number
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
    let report;
    try {
      report = JSON.parse(aiResult.content);
    } catch {
      const jsonMatch = (aiResult.content || "").match(/\{[\s\S]*\}/);
      report = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_score: 0, categories: [] };
    }

    return new Response(JSON.stringify({ status: "success", report, provider: aiResult.provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("technical-audit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
