import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface LLMData {
  name: string;
  icon: string;
  value: number;
  color: string;
}

const PLATFORM_META: Record<string, { icon: string, color: string }> = {
  "ChatGPT": { icon: "🤖", color: "from-emerald-400 to-emerald-600" },
  "Claude": { icon: "🧠", color: "from-orange-400 to-orange-600" },
  "Gemini": { icon: "✨", color: "from-blue-400 to-blue-600" },
  "Perplexity": { icon: "🔍", color: "from-purple-400 to-purple-600" },
  "OpenRouter": { icon: "🔌", color: "from-pink-400 to-pink-600" },
  "Groq": { icon: "⚡", color: "from-yellow-400 to-yellow-600" },
};

export function ShareOfVoice() {
  const { user } = useAuth();
  const [data, setData] = useState<LLMData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      
      const { data: rankings, error } = await supabase
        .from("prompt_rankings")
        .select("llm_platform")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching SOV:", error);
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      (rankings || []).forEach(r => {
        counts[r.llm_platform] = (counts[r.llm_platform] || 0) + 1;
      });

      const total = rankings?.length || 1;
      const chartData = Object.entries(counts).map(([name, count]) => ({
        name,
        icon: PLATFORM_META[name]?.icon || "🤖",
        value: Math.round((count / total) * 100),
        color: PLATFORM_META[name]?.color || "from-gray-400 to-gray-600",
      })).sort((a, b) => b.value - a.value);

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[350px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Share of Voice</h3>
          <p className="text-sm text-muted-foreground">Brand visibility across AI platforms</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-8 rounded-full bg-secondary overflow-hidden flex mb-6">
        {data.map((llm, index) => (
          <motion.div
            key={llm.name}
            className={`h-full bg-gradient-to-r ${llm.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${llm.value}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4">
        {data.map((llm, index) => (
          <motion.div
            key={llm.name}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{llm.icon}</span>
              <span className="text-sm font-medium text-foreground">{llm.name}</span>
            </div>
            <span className="text-lg font-semibold text-foreground">{llm.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
