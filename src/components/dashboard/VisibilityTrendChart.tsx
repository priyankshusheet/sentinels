import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 text-sm shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function VisibilityTrendChart() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const { data: rankings, error } = await supabase
        .from("prompt_rankings")
        .select("checked_at, confidence_score, llm_platform")
        .eq("user_id", user.id)
        .order("checked_at", { ascending: true });

      if (error) {
        console.error("Error fetching trend data:", error);
        setLoading(false);
        return;
      }

      // Group by date
      const grouped = (rankings || []).reduce((acc: any, curr: any) => {
        const date = new Date(curr.checked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!acc[date]) {
          acc[date] = { date, yourBrand: [], others: [] };
        }
        acc[date].yourBrand.push(curr.confidence_score);
        return acc;
      }, {});

      const chartData = Object.values(grouped).map((day: any) => ({
        date: day.date,
        yourBrand: Math.round(day.yourBrand.reduce((a: number, b: number) => a + b, 0) / day.yourBrand.length),
      }));

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const latest = data[data.length - 1] || { yourBrand: 0 };
  const earliest = data[0] || { yourBrand: 0 };
  const delta = (latest.yourBrand || 0) - (earliest.yourBrand || 0);

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Visibility Trend</h3>
          <p className="text-sm text-muted-foreground">Historical visibility score tracking</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className={`h-4 w-4 ${delta >= 0 ? "text-success" : "text-destructive"}`} />
          <span className={`font-semibold ${delta >= 0 ? "text-success" : "text-destructive"}`}>
            {delta >= 0 ? "+" : ""}{delta}% growth
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-52"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="yourBrand"
              name="Your Brand"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#brandGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
