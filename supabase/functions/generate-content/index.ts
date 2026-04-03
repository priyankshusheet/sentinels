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

    const { topic, website_context } = await req.json();

    const messages = [
      {
        role: "system" as const,
        content: "You are an AEO content strategist. Generate optimized content that improves brand visibility in AI responses."
      },
      {
        role: "user" as const,
        content: `Generate AEO-optimized content for the topic: "${topic}"
Website context: ${website_context || "General website"}

Create content that:
1. Uses clear Q&A structures that AI can easily cite
2. Includes structured data recommendations
3. Provides authoritative, factual information
4. Uses natural language patterns AI models prefer

Return the content as a JSON:
{
  "title": "Suggested page title",
  "content": "The full content in markdown",
  "meta_description": "SEO meta description",
  "schema_suggestions": ["FAQPage", "HowTo", etc],
  "target_prompts": ["prompts this content would rank for"]
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
    let generated_content;
    try {
      generated_content = JSON.parse(aiResult.content);
    } catch {
      const jsonMatch = (aiResult.content || "").match(/\{[\s\S]*\}/);
      generated_content = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: "", content: aiResult.content };
    }

    return new Response(JSON.stringify({ status: "success", generated_content, provider: aiResult.provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
