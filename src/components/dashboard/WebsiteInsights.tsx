import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, CheckCircle, AlertTriangle, Loader2, TrendingUp, Lightbulb, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WebsiteAnalysis {
  id: string;
  website_url: string;
  status: string;
  ai_insights: any;
  pages_crawled: number;
  completed_at: string | null;
}

export function WebsiteInsights() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [recrawling, setRecrawling] = useState(false);

  const fetchAnalysis = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("website_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setAnalysis(data as WebsiteAnalysis | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(() => {
      if (analysis?.status === "crawling" || analysis?.status === "pending") {
        fetchAnalysis();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, analysis?.status]);

  const handleRecrawl = async () => {
    if (!user || !analysis?.website_url) return;
    setRecrawling(true);
    try {
      const { error } = await supabase.functions.invoke("crawl-website", {
        body: { website_url: analysis.website_url },
      });
      if (error) throw error;
      toast.success("Re-analyzing website...");
      fetchAnalysis();
    } catch {
      toast.error("Failed to start analysis");
    } finally {
      setRecrawling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading website analysis...</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const insights = analysis.ai_insights || {};
  const seoSignals = insights.seo_signals || {};
  const seoScore = Object.values(seoSignals).filter(Boolean).length;
  const seoTotal = Object.keys(seoSignals).length || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-6 border border-border space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Website Analysis</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{analysis.website_url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysis.status === "crawling" || analysis.status === "pending" ? (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleRecrawl} disabled={recrawling} className="text-xs">
              {recrawling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Re-analyze
            </Button>
          )}
        </div>
      </div>

      {analysis.status === "completed" && insights && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{insights.ai_readiness || 0}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">AI Ready</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{insights.total_pages_found || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pages Found</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{seoScore}/{seoTotal}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">SEO Signals</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{insights.key_topics?.length || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Topics</div>
            </div>
          </div>

          {/* AI Assessment */}
          {insights.overall_assessment && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary">AI Assessment</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{insights.overall_assessment}</p>
            </div>
          )}

          {/* SEO Signals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> SEO & AI Signals
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(seoSignals).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className={cn("text-xs", value ? "text-foreground" : "text-muted-foreground")}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          {(insights.strengths?.length > 0 || insights.weaknesses?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-green-500">Strengths</h4>
                  <ul className="space-y-1">
                    {insights.strengths.slice(0, 3).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.weaknesses?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Weaknesses</h4>
                  <ul className="space-y-1">
                    {insights.weaknesses.slice(0, 3).map((w: string, i: number) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5" /> AI Recommendations
              </h4>
              <div className="space-y-2">
                {insights.recommendations.slice(0, 4).map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-xs font-bold text-primary mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-foreground leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Topics */}
          {insights.key_topics?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detected Topics</h4>
              <div className="flex flex-wrap gap-2">
                {insights.key_topics.slice(0, 8).map((topic: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-secondary text-xs text-foreground">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {analysis.status === "failed" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Analysis failed</p>
            <p className="text-xs text-muted-foreground">Try re-analyzing or check if the website URL is accessible.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRecrawl} disabled={recrawling} className="ml-auto text-xs">
            Retry
          </Button>
        </div>
      )}
    </motion.div>
  );
}
