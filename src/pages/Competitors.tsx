import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, TrendingUp, TrendingDown, Minus, Plus, Trash2, ExternalLink, BarChart3, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompetitors } from "@/hooks/use-competitors";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CompetitorInsights } from "@/components/dashboard/CompetitorInsights";
import { EmptyState } from "@/components/ui/EmptyState";

interface BenchmarkEntry {
  domain: string;
  visibility_score: number;
  sentiment_score: number;
  estimated_citations: number;
  top_llm: string;
  trend: number;
}

export default function Competitors() {
  const { user } = useAuth();
  const { competitors, isLoading: hookLoading, runBenchmark, isBenchmarking } = useCompetitors(user?.id);
  const [loading, setLoading] = useState(true);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newComp, setNewComp] = useState({ name: "", domain: "" });
  const [yourMetrics, setYourMetrics] = useState({ visibility: 0, sentiment: 0, citations: 0 });

  useEffect(() => {
    if (!hookLoading) setLoading(false);
  }, [hookLoading]);

  // Fetch real metrics for "Your Brand"
  useEffect(() => {
    const fetchYourMetrics = async () => {
      if (!user) return;

      const [rankingsRes, citationsRes, sentimentRes] = await Promise.all([
        supabase.from("prompt_rankings").select("confidence_score").eq("user_id", user.id).order("checked_at", { ascending: false }).limit(10),
        supabase.from("citations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("citations").select("sentiment").eq("user_id", user.id),
      ]);

      const rankings = rankingsRes.data || [];
      const avgVisibility = rankings.length > 0
        ? Math.round(rankings.reduce((a, r) => a + (r.confidence_score || 0), 0) / rankings.length)
        : 0;

      const sentiments = sentimentRes.data || [];
      const positiveCount = sentiments.filter((s: any) => s.sentiment === "positive").length;
      const sentimentPct = sentiments.length > 0 ? Math.round((positiveCount / sentiments.length) * 100) : 0;

      setYourMetrics({
        visibility: avgVisibility,
        sentiment: sentimentPct,
        citations: citationsRes.count || 0,
      });
    };

    fetchYourMetrics();
  }, [user]);

  const addCompetitor = async () => {
    if (!user || !newComp.name.trim() || !newComp.domain.trim()) return;
    const { error } = await supabase.from("competitors").insert({ user_id: user.id, name: newComp.name, domain: newComp.domain });
    if (error) { toast.error(error.message); return; }
    toast.success("Competitor added!");
    setNewComp({ name: "", domain: "" });
    setDialogOpen(false);
  };

  const deleteCompetitor = async (id: string) => {
    await supabase.from("competitors").delete().eq("id", id);
    toast.success("Competitor removed");
  };

  const handleBenchmark = async () => {
    if (!user) return;
    toast.info("Starting competitive benchmarking...");
    try {
      const { data: profile } = await supabase.from("profiles").select("website_url").eq("user_id", user.id).single();
      const domain = profile?.website_url || "yoursite.com";
      
      const result = await runBenchmark({ 
        brandDomain: domain, 
        competitors: competitors.map(c => c.domain),
        prompts: ["best aeo tool", "generative engine optimization"] 
      });
      setBenchmarkData(result.benchmark || []);
      toast.success("Benchmark complete!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Build table entries
  const allEntries = [
    {
      id: "you",
      name: "Your Brand",
      domain: "",
      isYou: true,
      visibility: yourMetrics.visibility,
      visibilityChange: 0,
      sentiment: yourMetrics.sentiment,
      citations: yourMetrics.citations,
      topLLM: "ChatGPT",
    },
    ...competitors.map((c) => {
      const benchEntry = benchmarkData.find(b => b.domain === c.domain);
      return {
        id: c.id,
        name: c.name,
        domain: c.domain,
        isYou: false,
        visibility: benchEntry?.visibility_score || 0,
        visibilityChange: benchEntry?.trend || 0,
        sentiment: benchEntry?.sentiment_score || 0,
        citations: benchEntry?.estimated_citations || 0,
        topLLM: benchEntry?.top_llm || "—",
      };
    }),
  ].sort((a, b) => b.visibility - a.visibility);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Competitors</h1>
            <p className="text-muted-foreground mt-1">Side-by-side benchmarking across AI visibility, sentiment & citations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBenchmark} disabled={isBenchmarking || competitors.length === 0} variant="outline" className="gap-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
              <BarChart3 className="h-4 w-4" /> {isBenchmarking ? "Benchmarking..." : "Run Benchmark"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] text-white font-bold h-10 px-6 rounded-xl border-0 transition-all">
                  <Plus className="h-4 w-4" /> Add Competitor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add a Competitor</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={newComp.name} onChange={e => setNewComp(p => ({ ...p, name: e.target.value }))} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input value={newComp.domain} onChange={e => setNewComp(p => ({ ...p, domain: e.target.value }))} placeholder="acme.com" className="bg-secondary/50 border-white/5 h-11" />
                  </div>
                  <Button onClick={addCompetitor} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black h-11 rounded-xl shadow-[0_0_15px_rgba(0,212,255,0.4)] border-0">Add Competitor</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="h-4 w-4" /><span className="text-sm">Tracked</span></div>
            <p className="text-2xl font-bold text-foreground">{competitors.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><BarChart3 className="h-4 w-4" /><span className="text-sm">Your Rank</span></div>
            <p className="text-2xl font-bold text-primary">#{allEntries.findIndex(e => e.isYou) + 1}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><MessageSquare className="h-4 w-4" /><span className="text-sm">Avg Sentiment</span></div>
            <p className="text-2xl font-bold text-success">{yourMetrics.sentiment}%</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><FileText className="h-4 w-4" /><span className="text-sm">Your Citations</span></div>
            <p className="text-2xl font-bold text-foreground">{yourMetrics.citations}</p>
          </div>
        </div>

        {/* Benchmarking matrix */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading competitors...</div>
        ) : (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-center">Visibility Score</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead className="text-center">Sentiment</TableHead>
                  <TableHead className="text-center">Citations</TableHead>
                  <TableHead className="text-center">Top LLM</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEntries.map((entry, index) => {
                  const trend = entry.visibilityChange > 0 ? "up" : entry.visibilityChange < 0 ? "down" : "neutral";
                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "border-border transition-colors",
                        entry.isYou && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <TableCell className="font-bold text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold", entry.isYou ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                            {entry.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{entry.name}</span>
                              {entry.isYou && <Badge className="bg-primary text-primary-foreground text-xs">You</Badge>}
                            </div>
                            {!entry.isYou && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {entry.domain} <ExternalLink className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-bold text-foreground">{entry.visibility}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", trend === "up" && "bg-success/20 text-success", trend === "down" && "bg-destructive/20 text-destructive", trend === "neutral" && "bg-secondary text-muted-foreground")}>
                          {trend === "up" && <TrendingUp className="h-3 w-3" />}
                          {trend === "down" && <TrendingDown className="h-3 w-3" />}
                          {trend === "neutral" && <Minus className="h-3 w-3" />}
                          {entry.visibilityChange > 0 ? "+" : ""}{entry.visibilityChange}%
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${entry.sentiment}%` }} />
                          </div>
                          <span className="text-sm text-foreground">{entry.sentiment}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">{entry.citations}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">{entry.topLLM}</Badge>
                      </TableCell>
                      <TableCell>
                        {!entry.isYou && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteCompetitor(entry.id)} 
                            className="opacity-50 hover:opacity-100 transition-opacity"
                            aria-label={`Delete ${entry.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {competitors.length === 0 && !loading && (
          <EmptyState 
            icon={Users}
            title="Competitor Base Offline"
            description="Add your primary market rivals to start tracking visibility deltas and citation ownership across the 2026 search landscape."
            actionLabel="Add Your First Competitor"
            onAction={() => setDialogOpen(true)}
          />
        )}

        {/* Competitive gap analysis */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CompetitorInsights />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
