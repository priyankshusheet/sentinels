import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Loader2, Brain, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Prediction {
  current_score: number;
  predicted_30d: number;
  trend: "improving" | "stable" | "declining";
  confidence: number;
  daily_predictions: Array<{ date: string; predicted_score: number }>;
  recommendations: string[];
  risk_factors?: string[];
  opportunities?: string[];
  platform_breakdown?: Array<{ platform: string; mention_rate: number; total_checks: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-semibold text-foreground">{e.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function PredictiveScore() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [historical, setHistorical] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<string>("");

  const fetchPrediction = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-visibility", {});
      if (error) throw error;
      if (data.prediction) {
        setPrediction(data.prediction);
        setHistorical(data.historical || []);
        setMethod(data.method || "");
      } else {
        toast.info(data.message || "Not enough data for predictions");
      }
    } catch (e: any) {
      toast.error("Prediction failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrediction(); }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing trends...</p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border text-center py-12">
        <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-1">Predictive Scoring</h3>
        <p className="text-sm text-muted-foreground mb-4">Run visibility analyses to unlock AI-powered predictions.</p>
        <Button variant="outline" onClick={fetchPrediction} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  const delta = prediction.predicted_30d - prediction.current_score;
  const TrendIcon = prediction.trend === "improving" ? TrendingUp : prediction.trend === "declining" ? TrendingDown : Minus;
  const trendColor = prediction.trend === "improving" ? "text-success" : prediction.trend === "declining" ? "text-destructive" : "text-muted-foreground";

  // Combine historical + predicted for chart
  const chartData = [
    ...historical.map(h => ({ date: h.date.slice(5), actual: h.avg_score, predicted: null as number | null })),
    ...prediction.daily_predictions.map(p => ({ date: p.date.slice(5), actual: null as number | null, predicted: p.predicted_score })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Predictive Visibility</h3>
            <p className="text-xs text-muted-foreground">30-day forecast based on {method === "ai_powered" ? "AI analysis" : "trend analysis"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-primary/20 text-primary">
            {prediction.confidence}% confidence
          </Badge>
          <Button variant="ghost" size="icon" onClick={fetchPrediction} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Current</p>
          <p className="text-3xl font-black text-foreground">{prediction.current_score}%</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border text-center relative overflow-hidden">
          <div className={cn("absolute inset-0 opacity-5", prediction.trend === "improving" ? "bg-success" : prediction.trend === "declining" ? "bg-destructive" : "bg-muted")} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Predicted (30d)</p>
          <p className={cn("text-3xl font-black", trendColor)}>{prediction.predicted_30d}%</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Delta</p>
          <div className="flex items-center justify-center gap-2">
            <TrendIcon className={cn("h-5 w-5", trendColor)} />
            <p className={cn("text-3xl font-black", trendColor)}>{delta >= 0 ? "+" : ""}{delta}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(chartData.length / 8))} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actualGrad)" dot={false} connectNulls={false} />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#predictedGrad)" dot={false} strokeDasharray="5 5" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Recommendations
          </h4>
          <ul className="space-y-2">
            {prediction.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary font-bold">→</span> {r}
              </li>
            ))}
          </ul>
        </div>

        {prediction.platform_breakdown && prediction.platform_breakdown.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Platform Performance</h4>
            <div className="space-y-3">
              {prediction.platform_breakdown.map((p) => (
                <div key={p.platform} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.platform}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.mention_rate}%` }} />
                    </div>
                    <span className="text-sm font-bold text-foreground w-10 text-right">{p.mention_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk factors and opportunities */}
      {(prediction.risk_factors?.length || prediction.opportunities?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prediction.risk_factors && prediction.risk_factors.length > 0 && (
            <div className="bg-card rounded-2xl p-5 border border-destructive/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
              </h4>
              <ul className="space-y-2">
                {prediction.risk_factors.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                ))}
              </ul>
            </div>
          )}
          {prediction.opportunities && prediction.opportunities.length > 0 && (
            <div className="bg-card rounded-2xl p-5 border border-success/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-success mb-3 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Opportunities
              </h4>
              <ul className="space-y-2">
                {prediction.opportunities.map((o, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
