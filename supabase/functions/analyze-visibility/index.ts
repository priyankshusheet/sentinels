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

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt_id, query, brand_name, llm_platform, parallel, multi_llm } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brand = brand_name || "the user's brand";
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

    // Determine which platforms to analyze
    let platforms: string[] = [];
    if (multi_llm && Array.isArray(multi_llm) && multi_llm.length > 0) {
      platforms = multi_llm;
    } else {
      platforms = [llm_platform || "chatgpt"];
    }

    // Run analysis for each platform (in parallel), with caching
    const results = await Promise.all(platforms.map(async (platform: string) => {
      // Check cache first
      const cacheKey = `${user.id}:${query}:${platform}`;
      const { data: cached } = await supabase
        .from("prompt_rankings")
        .select("*")
        .eq("user_id", user.id)
        .eq("llm_platform", platform)
        .gte("checked_at", new Date(Date.now() - CACHE_TTL_MS).toISOString())
        .order("checked_at", { ascending: false })
        .limit(1);

      // If we have a cached result for same prompt text, return it
      if (cached && cached.length > 0 && prompt_id) {
        const cachedRanking = cached[0];
        if (cachedRanking.prompt_id === prompt_id) {
          return {
            platform,
            analysis: {
              visibility: cachedRanking.visibility,
              confidence_score: cachedRanking.confidence_score,
              citations_found: cachedRanking.citations_found,
              sentiment: "neutral",
              ai_response_summary: cachedRanking.ai_response || "",
              recommendations: [],
              citation_sources: [],
            },
            provider: platform,
            cached: true,
          };
        }
      }

      const systemPrompt = `You are an AI visibility analyst. When given a search query, analyze how a brand would likely appear in AI-generated responses from ${platform}. Evaluate visibility, sentiment, and citations.`;

      const userPrompt = `Analyze the query: "${query}"

For the brand "${brand}", provide a JSON analysis:
{
  "visibility": "mentioned" | "partial" | "not_mentioned",
  "confidence_score": 0-100,
  "citations_found": number (estimated citation sources),
  "sentiment": "positive" | "neutral" | "negative",
  "ai_response_summary": "Brief summary of how the AI would likely respond to this query and whether the brand would be mentioned",
  "recommendations": ["actionable tip 1", "actionable tip 2"],
  "citation_sources": [{"name": "Source Name", "url": "https://example.com", "sentiment": "positive"}]
}

Return ONLY valid JSON, no markdown.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ];

      const tools = [
        {
          type: "function",
          function: {
            name: "analyze_visibility",
            description: "Return the visibility analysis for a brand query",
            parameters: {
              type: "object",
              properties: {
                visibility: { type: "string", enum: ["mentioned", "partial", "not_mentioned"] },
                confidence_score: { type: "number" },
                citations_found: { type: "number" },
                sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                ai_response_summary: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
                citation_sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      url: { type: "string" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    },
                  },
                },
              },
              required: ["visibility", "confidence_score", "citations_found", "sentiment", "ai_response_summary"],
              additionalProperties: false,
            },
          },
        },
      ];

      const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/ai-fallback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages,
          tools,
          tool_choice: { type: "function", function: { name: "analyze_visibility" } },
          parallel: parallel || false,
        }),
      });

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        console.error("ai-fallback error:", fallbackResponse.status, errText);
        
        if (fallbackResponse.status === 429) {
          return { platform, error: "Rate limit exceeded" };
        }
        if (fallbackResponse.status === 402) {
          return { platform, error: "AI credits exhausted" };
        }
        return { platform, error: `AI fallback error: ${fallbackResponse.status}` };
      }

      const aiResult = await fallbackResponse.json();
      let analysis;

      const contentStr = aiResult.content || "";
      try {
        analysis = JSON.parse(contentStr);
      } catch {
        const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          analysis = {
            visibility: "not_mentioned",
            confidence_score: 0,
            citations_found: 0,
            sentiment: "neutral",
            ai_response_summary: contentStr,
            recommendations: [],
            citation_sources: [],
          };
        }
      }

      // Store ranking in database
      if (prompt_id) {
        await supabase.from("prompt_rankings").insert({
          user_id: user.id,
          prompt_id,
          llm_platform: aiResult.provider || platform,
          visibility: analysis.visibility,
          confidence_score: analysis.confidence_score,
          citations_found: analysis.citations_found,
          ai_response: analysis.ai_response_summary,
        });
      }

      // Auto-populate citations from analysis results
      if (analysis.citation_sources && Array.isArray(analysis.citation_sources)) {
        for (const source of analysis.citation_sources) {
          if (source.url && source.name) {
            try {
              const domain = new URL(source.url).hostname.replace("www.", "");
              // Upsert: check if citation already exists for this user+url
              const { data: existing } = await supabase
                .from("citations")
                .select("id, mention_count")
                .eq("user_id", user.id)
                .eq("source_url", source.url)
                .maybeSingle();

              if (existing) {
                // Update mention count and last detected
                await supabase
                  .from("citations")
                  .update({
                    mention_count: (existing.mention_count || 0) + 1,
                    last_detected_at: new Date().toISOString(),
                    sentiment: source.sentiment || "neutral",
                  })
                  .eq("id", existing.id);
              } else {
                await supabase.from("citations").insert({
                  user_id: user.id,
                  source_name: source.name,
                  source_url: source.url,
                  domain,
                  sentiment: source.sentiment || "neutral",
                  mention_count: 1,
                  authority_score: 0,
                  is_owned: false,
                });
              }
            } catch (e) {
              console.error("Error saving citation:", e);
            }
          }
        }
      }

      return {
        platform,
        analysis,
        provider: aiResult.provider || "unknown",
      };
    }));

    // Check for any rate limit or credit errors
    const errors = results.filter((r: any) => r.error);
    if (errors.length === results.length) {
      const firstError = errors[0] as any;
      const status = firstError.error.includes("Rate limit") ? 429 : firstError.error.includes("credits") ? 402 : 500;
      return new Response(JSON.stringify({ error: firstError.error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For single platform, return backward-compatible response
    if (platforms.length === 1) {
      const result = results[0] as any;
      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ 
        success: true, 
        analysis: result.analysis,
        provider: result.provider,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For multi-LLM, return all results
    return new Response(JSON.stringify({ 
      success: true, 
      results: results.filter((r: any) => !r.error),
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-visibility error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
