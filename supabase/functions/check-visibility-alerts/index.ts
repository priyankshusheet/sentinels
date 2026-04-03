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

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user's alert preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("alert_preferences, webhook_url, company_name")
      .eq("user_id", user_id)
      .single();

    const prefs = (profile?.alert_preferences as Record<string, boolean>) || {};
    const alerts: Array<{ type: string; title: string; message: string; severity: string }> = [];

    // 1. Check visibility drop (>10% in last 24h)
    if (prefs.visibility_drop !== false) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: recentRankings } = await supabase
        .from("prompt_rankings")
        .select("confidence_score, checked_at")
        .eq("user_id", user_id)
        .gte("checked_at", yesterday.toISOString())
        .order("checked_at", { ascending: false });

      const { data: olderRankings } = await supabase
        .from("prompt_rankings")
        .select("confidence_score, checked_at")
        .eq("user_id", user_id)
        .lt("checked_at", yesterday.toISOString())
        .order("checked_at", { ascending: false })
        .limit(20);

      if (recentRankings?.length && olderRankings?.length) {
        const recentAvg = recentRankings.reduce((a, r) => a + (r.confidence_score || 0), 0) / recentRankings.length;
        const olderAvg = olderRankings.reduce((a, r) => a + (r.confidence_score || 0), 0) / olderRankings.length;
        const dropPct = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0;

        if (dropPct > 10) {
          alerts.push({
            type: "visibility_drop",
            title: `Visibility dropped ${Math.round(dropPct)}%`,
            message: `Your average visibility score dropped from ${Math.round(olderAvg)}% to ${Math.round(recentAvg)}% in the last 24 hours.`,
            severity: dropPct > 25 ? "critical" : "warning",
          });
        }
      }
    }

    // 2. Check for new citations
    if (prefs.new_citation !== false) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: newCitations, count } = await supabase
        .from("citations")
        .select("source_name", { count: "exact" })
        .eq("user_id", user_id)
        .gte("created_at", oneHourAgo);

      if (count && count > 0) {
        alerts.push({
          type: "new_citation",
          title: `${count} new citation${count > 1 ? "s" : ""} detected`,
          message: `New sources: ${(newCitations || []).slice(0, 3).map(c => c.source_name).join(", ")}${count > 3 ? ` and ${count - 3} more` : ""}`,
          severity: "success",
        });
      }
    }

    // 3. Check competitor gains
    if (prefs.competitor_gain !== false) {
      const { data: competitors } = await supabase
        .from("competitors")
        .select("name, domain")
        .eq("user_id", user_id);

      if (competitors && competitors.length > 0) {
        // Simple check: if user has competitors but low visibility, alert
        const { data: latestRanking } = await supabase
          .from("prompt_rankings")
          .select("confidence_score")
          .eq("user_id", user_id)
          .order("checked_at", { ascending: false })
          .limit(1);

        const score = latestRanking?.[0]?.confidence_score || 0;
        if (score < 40 && competitors.length > 0) {
          alerts.push({
            type: "competitor_gain",
            title: "Competitors may be outranking you",
            message: `Your visibility score is ${score}%. Consider running a competitive benchmark against ${competitors[0].name}.`,
            severity: "warning",
          });
        }
      }
    }

    // Insert alerts into database
    if (alerts.length > 0) {
      const rows = alerts.map(a => ({ user_id, ...a }));
      await supabase.from("alerts").insert(rows);

      // Send webhook if configured
      if (profile?.webhook_url) {
        for (const alert of alerts) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-webhook-alert`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                webhook_url: profile.webhook_url,
                alert_type: alert.type,
                title: alert.title,
                message: alert.message,
                severity: alert.severity,
              }),
            });
          } catch (e) {
            console.error("Webhook send error:", e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, alerts_created: alerts.length, alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-visibility-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
