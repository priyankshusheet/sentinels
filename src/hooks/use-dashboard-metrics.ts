import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardMetrics = (userId?: string) => {
  const [metrics, setMetrics] = useState({
    trackedPrompts: 0,
    activeCitations: 0,
    contentGaps: 0,
    competitors: 0,
    visibilityScore: 0,
    loading: true
  });

  const fetchMetrics = async () => {
    if (!userId) return;
    
    try {
      const [promptsRes, citationsRes, gapsRes, rankingsRes, competitorsRes] = await Promise.all([
        supabase.from("tracked_prompts").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("citations").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("optimization_tasks").select("*", { count: 'exact', head: true }).eq("user_id", userId).eq("category", "content_gap"),
        supabase.from("prompt_rankings").select("confidence_score").eq("user_id", userId).order("checked_at", { ascending: false }).limit(1),
        supabase.from("competitors").select("*", { count: 'exact', head: true }).eq("user_id", userId),
      ]);

      setMetrics({
        trackedPrompts: promptsRes.count || 0,
        activeCitations: citationsRes.count || 0,
        contentGaps: gapsRes.count || 0,
        competitors: competitorsRes.count || 0,
        visibilityScore: rankingsRes.data?.[0]?.confidence_score || 0,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  return metrics;
};
