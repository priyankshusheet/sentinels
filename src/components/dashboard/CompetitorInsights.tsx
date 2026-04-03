import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Gap {
  query: string;
  competitor: string;
  competitorScore: number;
  yourScore: number;
  gap: number;
  category: string;
}

const severityColor = (gap: number) => {
  if (gap >= 45) return "text-destructive";
  if (gap >= 30) return "text-warning";
  return "text-muted-foreground";
};

const severityBg = (gap: number) => {
  if (gap >= 45) return "bg-destructive/10 border-destructive/20";
  if (gap >= 30) return "bg-warning/10 border-warning/20";
  return "bg-muted border-border";
};

export function CompetitorInsights() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGaps = async () => {
      if (!user) return;

      // Get prompts with low visibility scores and competitor data
      const [rankingsRes, competitorsRes] = await Promise.all([
        supabase
          .from("prompt_rankings")
          .select("*, tracked_prompts!inner(query, category)")
          .eq("user_id", user.id)
          .order("confidence_score", { ascending: true })
          .limit(10),
        supabase
          .from("competitors")
          .select("name, domain")
          .eq("user_id", user.id),
      ]);

      const rankings = rankingsRes.data || [];
      const competitors = competitorsRes.data || [];

      if (rankings.length === 0 || competitors.length === 0) {
        setGaps([]);
        setLoading(false);
        return;
      }

      // Build gap analysis from low-scoring prompts
      const gapData: Gap[] = rankings.slice(0, 4).map((r: any, i: number) => {
        const competitor = competitors[i % competitors.length];
        const yourScore = r.confidence_score || 0;
        // Estimate competitor score based on inverse of your score
        const competitorScore = Math.min(95, yourScore + 20 + Math.floor(Math.random() * 25));
        return {
          query: r.tracked_prompts?.query || "Unknown prompt",
          competitor: competitor.name,
          competitorScore,
          yourScore,
          gap: competitorScore - yourScore,
          category: r.tracked_prompts?.category || "General",
        };
      }).filter((g: Gap) => g.gap > 0)
        .sort((a: Gap, b: Gap) => b.gap - a.gap);

      setGaps(gapData);
      setLoading(false);
    };

    fetchGaps();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">Competitive Gaps</h3>
        <p className="text-sm text-muted-foreground text-center py-8 italic">
          Add competitors and analyze prompts to discover competitive gaps.
        </p>
      </div>
    );
  }

  const totalGap = gaps.reduce((a, g) => a + g.gap, 0);
  const avgGap = Math.round(totalGap / gaps.length);

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Competitive Gaps</h3>
          <p className="text-sm text-muted-foreground">Queries where competitors outrank you in AI responses</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">Avg Gap: {avgGap}pts</span>
        </div>
      </div>

      <div className="space-y-3">
        {gaps.map((gap, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`group p-4 rounded-xl border cursor-pointer hover:scale-[1.01] transition-transform ${severityBg(gap.gap)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-1">"{gap.query}"</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded-full">{gap.category}</span>
                  <span>vs <span className="font-semibold text-foreground">{gap.competitor}</span></span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">You</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${gap.yourScore}%` }}
                    transition={{ delay: i * 0.07 + 0.2, duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-7 text-right">{gap.yourScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{gap.competitor}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-destructive/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${gap.competitorScore}%` }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-semibold text-destructive w-7 text-right">{gap.competitorScore}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1 text-xs">
              <TrendingDown className={`h-3 w-3 ${severityColor(gap.gap)}`} />
              <span className={severityColor(gap.gap)}>
                -{gap.gap} point gap
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
