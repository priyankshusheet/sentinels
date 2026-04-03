import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CommunityIntelPanel } from "@/components/dashboard/CommunityIntelPanel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AIVisibilityScore } from "@/components/dashboard/AIVisibilityScore";
import { ShareOfVoice } from "@/components/dashboard/ShareOfVoice";
import { CompetitorCard } from "@/components/dashboard/CompetitorCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PromptCoverageChart } from "@/components/dashboard/PromptCoverageChart";
import { SentimentIndicator } from "@/components/dashboard/SentimentIndicator";
import { CitationNodeMap } from "@/components/dashboard/CitationNodeMap";
import { VisibilityTrendChart } from "@/components/dashboard/VisibilityTrendChart";
import { PredictiveScore } from "@/components/dashboard/PredictiveScore";
import { WebsiteInsights } from "@/components/dashboard/WebsiteInsights";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Sparkles, Zap, Bell, Search, FileText, Users, Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const metrics = useDashboardMetrics(user?.id);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [communityKeywords, setCommunityKeywords] = useState<string[]>([]);
  const [visibilityChange, setVisibilityChange] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Fetch competitors with their visibility data
      const { data: comps } = await supabase
        .from("competitors")
        .select("*")
        .eq("user_id", user.id)
        .limit(5);

      // Fetch profile for brand info and keywords
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, website_url, industry, goals")
        .eq("user_id", user.id)
        .single();

      // Build competitor cards with real data
      const brandName = profile?.company_name || "Your Brand";
      const brandDomain = profile?.website_url || "";

      // Get visibility trend for change calculation
      const { data: recentRankings } = await supabase
        .from("prompt_rankings")
        .select("confidence_score, checked_at")
        .eq("user_id", user.id)
        .order("checked_at", { ascending: false })
        .limit(20);

      if (recentRankings && recentRankings.length >= 2) {
        const recent = recentRankings.slice(0, 5);
        const older = recentRankings.slice(Math.max(0, recentRankings.length - 5));
        const recentAvg = recent.reduce((a, r) => a + (r.confidence_score || 0), 0) / recent.length;
        const olderAvg = older.reduce((a, r) => a + (r.confidence_score || 0), 0) / older.length;
        setVisibilityChange(Math.round((recentAvg - olderAvg) * 10) / 10);
      }

      // Build competitor list with brand as first entry
      const competitorCards = [
        { rank: 1, name: brandName, domain: brandDomain, score: metrics.visibilityScore, change: visibilityChange, isYou: true },
        ...(comps || []).map((c: any, i: number) => ({
          rank: i + 2,
          name: c.name,
          domain: c.domain,
          score: 0, // Will be populated after benchmark
          change: 0,
        })),
      ];
      setCompetitors(competitorCards);

      // Build dynamic community keywords from profile
      const keywords: string[] = [];
      if (profile?.industry) keywords.push(profile.industry);
      if (profile?.company_name) keywords.push(profile.company_name);
      keywords.push("AI visibility", "AEO strategies");
      if (profile?.goals) {
        profile.goals.forEach((g: string) => keywords.push(g));
      }
      setCommunityKeywords(keywords.slice(0, 5));
    };

    fetchDashboardData();
  }, [user, metrics.visibilityScore]);

  return (
    <DashboardLayout>
      <TooltipProvider>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Intelligence Center</h1>
              <p className="text-muted-foreground mt-1 text-sm">Real-time visibility monitoring & predictive GEO analytics</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 hidden sm:flex">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">System Ready</span>
                </div>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Badge variant="outline" className="gap-1 border-cyan-500/30 text-cyan-400 bg-cyan-950/20 cursor-help">
                      <Activity size={10} className="animate-pulse" /> Live Tracking
                   </Badge>
                 </TooltipTrigger>
                 <TooltipContent className="bg-background border-border text-xs">
                   Connected to Sentinel Cloud Engine v2.4. Pulse interval: 15s.
                 </TooltipContent>
               </Tooltip>
            </div>
          </motion.div>

          {/* Quick metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Tracked Prompts" value={metrics.trackedPrompts.toString()} icon={Search} variant="primary" />
            <MetricCard title="Active Citations" value={metrics.activeCitations.toString()} icon={FileText} variant="success" />
            <MetricCard title="AEO Fixes" value={metrics.contentGaps.toString()} icon={Zap} variant="warning" />
            <MetricCard title="Competitors" value={metrics.competitors.toString()} icon={Users} description={`${metrics.competitors} tracked`} />
          </motion.div>

          {/* Website Analysis */}
          <motion.div variants={itemVariants}>
            <WebsiteInsights />
          </motion.div>

          {/* Alerts & Visibility */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <VisibilityTrendChart />
            </motion.div>
            <motion.div variants={itemVariants}>
              <AlertsPanel />
            </motion.div>
          </div>

          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="hover:scale-[1.01] transition-transform duration-300">
              <AIVisibilityScore score={metrics.visibilityScore} change={visibilityChange} trend={visibilityChange >= 0 ? "up" : "down"} />
            </motion.div>
            <motion.div variants={itemVariants} className="hover:scale-[1.01] transition-transform duration-300">
              <ShareOfVoice />
            </motion.div>
            <motion.div variants={itemVariants} className="hover:scale-[1.01] transition-transform duration-300">
              <SentimentIndicator />
            </motion.div>
          </div>

          {/* Network & Coverage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}><PromptCoverageChart /></motion.div>
            <motion.div variants={itemVariants}><CitationNodeMap /></motion.div>
          </div>

          {/* Rankings */}
          {competitors.length > 1 && (
            <motion.div variants={itemVariants}>
              <div className="rounded-[24px] bg-card p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8 text-foreground pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Competitive Landscape</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Visibility share across monitored domains</p>
                  </div>
                </div>
                <div className={cn("grid grid-cols-1 gap-6", competitors.length <= 5 ? `md:grid-cols-2 lg:grid-cols-${Math.min(competitors.length, 5)}` : "md:grid-cols-3 lg:grid-cols-5")}>
                  {competitors.slice(0, 5).map(c => <CompetitorCard key={c.rank} {...c} />)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Predictive Scoring */}
          <motion.div variants={itemVariants}>
            <PredictiveScore />
          </motion.div>

          {/* Community Intel */}
          <motion.div variants={itemVariants}>
            <CommunityIntelPanel keywords={communityKeywords.length > 0 ? communityKeywords : ["AI visibility", "AEO strategies"]} />
          </motion.div>
        </motion.div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
