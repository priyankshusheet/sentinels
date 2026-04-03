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

    // Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch historical rankings (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rankings } = await supabase
      .from("prompt_rankings")
      .select("confidence_score, checked_at, llm_platform, visibility")
      .eq("user_id", user.id)
      .gte("checked_at", ninetyDaysAgo)
      .order("checked_at", { ascending: true });

    // Fetch citations count
    const { count: citationCount } = await supabase
      .from("citations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, industry")
      .eq("user_id", user.id)
      .single();

    if (!rankings || rankings.length < 3) {
      return new Response(JSON.stringify({
        prediction: null,
        message: "Not enough historical data for predictions. Run at least 3 visibility analyses first.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Compute daily averages for the AI
    const dailyMap: Record<string, number[]> = {};
    for (const r of rankings) {
      const day = r.checked_at.split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = [];
      dailyMap[day].push(r.confidence_score || 0);
    }
    const dailyAvg = Object.entries(dailyMap)
      .map(([date, scores]) => ({
        date,
        avg_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Platform breakdown
    const platformCounts: Record<string, { total: number; mentioned: number }> = {};
    for (const r of rankings) {
      if (!platformCounts[r.llm_platform]) platformCounts[r.llm_platform] = { total: 0, mentioned: 0 };
      platformCounts[r.llm_platform].total++;
      if (r.visibility === "mentioned") platformCounts[r.llm_platform].mentioned++;
    }

    if (!GEMINI_API_KEY) {
      // Fallback: simple linear regression
      const scores = dailyAvg.map(d => d.avg_score);
      const n = scores.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = scores.reduce((a, b) => a + b, 0);
      const sumXY = scores.reduce((a, b, i) => a + i * b, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const predictions = [];
      for (let i = 1; i <= 30; i++) {
        const predicted = Math.max(0, Math.min(100, Math.round(intercept + slope * (n + i))));
        const futureDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        predictions.push({ date: futureDate, predicted_score: predicted });
      }

      const currentAvg = Math.round(sumY / n);
      const trend = slope > 0.5 ? "improving" : slope < -0.5 ? "declining" : "stable";

      return new Response(JSON.stringify({
        prediction: {
          current_score: currentAvg,
          predicted_30d: predictions[predictions.length - 1].predicted_score,
          trend,
          daily_predictions: predictions,
          confidence: Math.min(95, Math.max(40, 50 + n * 2)),
          recommendations: [
            trend === "declining" ? "Focus on creating authoritative content to reverse the decline" : "Maintain your content strategy to sustain growth",
            `You have ${citationCount || 0} citations — aim for 20+ for stronger visibility`,
            "Run multi-LLM analyses weekly to track cross-platform performance",
          ],
          platform_breakdown: Object.entries(platformCounts).map(([platform, data]) => ({
            platform,
            mention_rate: Math.round((data.mentioned / data.total) * 100),
            total_checks: data.total,
          })),
        },
        historical: dailyAvg,
        method: "linear_regression",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use Gemini AI for prediction
    const aiPrompt = `Analyze this brand visibility data and predict future trends.

Brand: ${profile?.company_name || "Unknown"}
Industry: ${profile?.industry || "Unknown"}
Total citations: ${citationCount || 0}

Historical daily visibility scores (last 90 days):
${dailyAvg.map(d => `${d.date}: ${d.avg_score}%`).join("\n")}

Platform breakdown:
${Object.entries(platformCounts).map(([p, d]) => `${p}: ${d.mentioned}/${d.total} mentioned (${Math.round(d.mentioned/d.total*100)}%)`).join("\n")}`;

    const response = await fetch("https://ai.gateway.gemini.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a visibility analytics AI. Predict future brand visibility trends based on historical data.",
          },
          { role: "user", content: aiPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_visibility",
            description: "Return visibility predictions and recommendations",
            parameters: {
              type: "object",
              properties: {
                current_score: { type: "number", description: "Current average visibility score" },
                predicted_30d: { type: "number", description: "Predicted score in 30 days" },
                trend: { type: "string", enum: ["improving", "stable", "declining"] },
                confidence: { type: "number", description: "Prediction confidence 0-100" },
                risk_factors: { type: "array", items: { type: "string" }, description: "Key risks to visibility" },
                opportunities: { type: "array", items: { type: "string" }, description: "Growth opportunities" },
                recommendations: { type: "array", items: { type: "string" }, description: "Actionable recommendations" },
              },
              required: ["current_score", "predicted_30d", "trend", "confidence", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "predict_visibility" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let prediction;
    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      prediction = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch {
      prediction = {
        current_score: dailyAvg[dailyAvg.length - 1]?.avg_score || 0,
        predicted_30d: dailyAvg[dailyAvg.length - 1]?.avg_score || 0,
        trend: "stable",
        confidence: 50,
        recommendations: ["Continue monitoring your visibility across LLMs"],
      };
    }

    // Generate daily predictions based on AI's 30d target
    const current = dailyAvg[dailyAvg.length - 1]?.avg_score || 0;
    const target = prediction.predicted_30d;
    const dailyPredictions = [];
    for (let i = 1; i <= 30; i++) {
      const t = i / 30;
      const predicted = Math.round(current + (target - current) * t);
      const futureDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dailyPredictions.push({ date: futureDate, predicted_score: Math.max(0, Math.min(100, predicted)) });
    }

    prediction.daily_predictions = dailyPredictions;
    prediction.platform_breakdown = Object.entries(platformCounts).map(([platform, data]) => ({
      platform,
      mention_rate: Math.round((data.mentioned / data.total) * 100),
      total_checks: data.total,
    }));

    return new Response(JSON.stringify({
      prediction,
      historical: dailyAvg,
      method: "ai_powered",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("predict-visibility error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
