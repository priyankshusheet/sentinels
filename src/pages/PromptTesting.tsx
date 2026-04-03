import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessageSquare, Play, BarChart3, Sparkles, Loader2, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TestMetric {
  name: string;
  a: number;
  b: number;
}

interface TestResults {
  delta: number;
  winner: string;
  timestamp: string;
  metrics: TestMetric[];
}

export default function PromptTesting() {
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");

  const runTest = async () => {
    if (!variantA.trim() || !variantB.trim()) {
      toast.error("Please provide both variants for comparison.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      // Get brand name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", user.id)
        .single();

      const brandName = profile?.company_name || "the brand";

      // Run both variants through analyze-visibility in parallel
      // Run both variants with multi-LLM comparison
      const platforms = ["ChatGPT", "Claude", "Gemini", "Perplexity"];
      const [resA, resB] = await Promise.all([
        supabase.functions.invoke("analyze-visibility", {
          body: { query: variantA, brand_name: brandName, multi_llm: platforms },
        }),
        supabase.functions.invoke("analyze-visibility", {
          body: { query: variantB, brand_name: brandName, multi_llm: platforms },
        }),
      ]);

      if (resA.error) throw resA.error;
      if (resB.error) throw resB.error;

      const analysisA = resA.data?.analysis || {};
      const analysisB = resB.data?.analysis || {};

      const scoreA = analysisA.confidence_score || 0;
      const scoreB = analysisB.confidence_score || 0;
      const citA = analysisA.citations_found || 0;
      const citB = analysisB.citations_found || 0;
      const sentA = analysisA.sentiment === "positive" ? 80 : analysisA.sentiment === "neutral" ? 50 : 20;
      const sentB = analysisB.sentiment === "positive" ? 80 : analysisB.sentiment === "neutral" ? 50 : 20;

      const delta = Math.round((scoreB - scoreA) * 10) / 10;

      setTestResults({
        delta: Math.abs(delta),
        winner: delta >= 0 ? "Variant B" : "Variant A",
        timestamp: new Date().toISOString(),
        metrics: [
          { name: "Visibility Score", a: scoreA, b: scoreB },
          { name: "Citations Found", a: citA, b: citB },
          { name: "Sentiment Score", a: sentA, b: sentB },
        ],
      });

      toast.success("A/B Test Complete", {
        description: `${delta >= 0 ? "Variant B" : "Variant A"} shows higher visibility.`,
        icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
      });
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">A/B Prompt Testing</h1>
              <p className="text-muted-foreground mt-1 font-medium">Quantify the impact of semantic phrasing on LLM visibility</p>
            </div>
            <Badge variant="outline" className="px-4 py-2 border-primary/20 text-primary bg-primary/5 text-[10px] font-black uppercase tracking-widest">
              Live Engine
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Variant A [Original]
                </label>
                <Tooltip>
                  <TooltipTrigger asChild><Info size={14} className="text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent>The control variant currently being monitored.</TooltipContent>
                </Tooltip>
              </div>
              <textarea
                value={variantA}
                onChange={(e) => setVariantA(e.target.value)}
                className="w-full h-40 bg-secondary/20 border border-border rounded-2xl p-6 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-relaxed"
                placeholder="e.g., What are the best enterprise SEO tools for 2026?"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Variant B [Challenger]
                </label>
                <Tooltip>
                  <TooltipTrigger asChild><Info size={14} className="text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent>The experimental phrasing to test for lift.</TooltipContent>
                </Tooltip>
              </div>
              <textarea
                value={variantB}
                onChange={(e) => setVariantB(e.target.value)}
                className="w-full h-40 bg-secondary/20 border border-border rounded-2xl p-6 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all leading-relaxed"
                placeholder="e.g., Recommend top-tier B2B Generative Engine Optimization platforms."
              />
            </motion.div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={runTest}
              disabled={isTesting}
              className="gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black px-12 py-7 rounded-[24px] shadow-lg border-0 transition-all hover:scale-105 uppercase tracking-[0.2em] text-xs"
            >
              {isTesting ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Play className="h-5 w-5 fill-current" /> Run Comparison</>}
            </Button>
          </div>

          <div className="space-y-8 pt-12 border-t border-border">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-primary" /></div>
              Delta Analysis
            </h2>

            <AnimatePresence mode="wait">
              {!testResults ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState
                    icon={MessageSquare}
                    title="No Analysis Data"
                    description="Input two phrasing variants and run the comparison to see real AI visibility differences."
                  />
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 bg-card rounded-[32px] border border-border p-8 relative overflow-hidden group">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-8">Metric Breakdown</h3>
                    <div className="space-y-10">
                      {testResults.metrics.map((m) => (
                        <div key={m.name} className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                            <span className="text-muted-foreground">{m.name}</span>
                            <span className="text-primary">{m.b} vs {m.a}</span>
                          </div>
                          <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden flex">
                            <div className="h-full bg-primary/20" style={{ width: `${Math.min(m.a, 100)}%` }} />
                            <div className="h-full bg-primary shadow-lg" style={{ width: `${Math.max(0, Math.min(m.b - m.a, 100))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card rounded-[32px] border border-primary/30 p-8 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                      <TrendingUp className="h-10 w-10 text-primary" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Winner</h4>
                    <p className="text-3xl font-black text-foreground mb-6 tracking-tighter">{testResults.winner}</p>
                    <div className="bg-secondary/30 rounded-2xl p-6 w-full border border-border">
                      <div className="text-5xl font-black text-primary mb-1">+{testResults.delta}%</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Visibility Lift</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
