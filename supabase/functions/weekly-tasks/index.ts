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
        content: "You are an AEO (Answer Engine Optimization) specialist. Generate weekly optimization tasks."
      },
      {
        role: "user" as const,
        content: `Generate 5 weekly AEO optimization tasks for the website: ${url}

Return JSON array:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "category": "content_gap|technical|schema|authority|engagement",
    "priority": "high|medium|low",
    "impact_score": 0-100
  }
]
Return ONLY valid JSON array.`
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
    let tasks;
    try {
      tasks = JSON.parse(aiResult.content);
    } catch {
      const jsonMatch = (aiResult.content || "").match(/\[[\s\S]*\]/);
      tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    // Store tasks in optimization_tasks table
    if (Array.isArray(tasks) && tasks.length > 0) {
      const rows = tasks.map((t: any) => ({
        user_id: user.id,
        title: t.title,
        description: t.description,
        category: t.category || "general",
        priority: t.priority || "medium",
        impact_score: t.impact_score || 50,
        target_url: url,
        ai_suggestion: t.description,
      }));
      await supabase.from("optimization_tasks").insert(rows);
    }

    return new Response(JSON.stringify({ status: "success", tasks, provider: aiResult.provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
