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

    // Get all active prompts
    const { data: prompts, error: promptsError } = await supabase
      .from("tracked_prompts")
      .select("*, profiles!inner(company_name)")
      .eq("is_active", true);

    if (promptsError) throw promptsError;

    const results: any[] = [];
    
    for (const prompt of (prompts || [])) {
      try {
        // Call analyze-visibility for each prompt
        const response = await fetch(`${supabaseUrl}/functions/v1/analyze-visibility`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            prompt_id: prompt.id,
            query: prompt.query,
            brand_name: (prompt as any).profiles?.company_name || "the brand",
            llm_platform: "chatgpt",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ prompt_id: prompt.id, success: true, provider: data.provider });
        } else {
          results.push({ prompt_id: prompt.id, success: false, error: `HTTP ${response.status}` });
        }

        // Add a small delay between calls to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        results.push({ prompt_id: prompt.id, success: false, error: String(e) });
      }
    }

    console.log(`Scheduled analysis complete: ${results.filter(r => r.success).length}/${results.length} succeeded`);

    return new Response(JSON.stringify({ 
      status: "success", 
      analyzed: results.length,
      succeeded: results.filter(r => r.success).length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scheduled-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
