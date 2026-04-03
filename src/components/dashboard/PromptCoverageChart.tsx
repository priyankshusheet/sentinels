import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PromptCategory {
  name: string;
  total: number;
  covered: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "General": "bg-primary",
  "Product Reviews": "bg-accent",
  "Comparisons": "bg-success",
  "How-to Guides": "bg-warning",
  "Best Of Lists": "bg-blue-500",
  "Alternatives": "bg-purple-500",
};

export function PromptCoverageChart() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [promptsRes, rankingsRes] = await Promise.all([
        supabase.from("tracked_prompts").select("id, category").eq("user_id", user.id),
        supabase.from("prompt_rankings").select("prompt_id").eq("user_id", user.id),
      ]);

      const prompts = promptsRes.data || [];
      const rankedPromptIds = new Set((rankingsRes.data || []).map(r => r.prompt_id));

      // Group by category
      const catMap: Record<string, { total: number; covered: number }> = {};
      prompts.forEach(p => {
        const cat = p.category || "General";
        if (!catMap[cat]) catMap[cat] = { total: 0, covered: 0 };
        catMap[cat].total++;
        if (rankedPromptIds.has(p.id)) catMap[cat].covered++;
      });

      const result = Object.entries(catMap).map(([name, data]) => ({
        name,
        total: data.total,
        covered: data.covered,
        color: CATEGORY_COLORS[name] || "bg-primary",
      }));

      setCategories(result);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const totalAll = categories.reduce((a, c) => a + c.total, 0);
  const coveredAll = categories.reduce((a, c) => a + c.covered, 0);
  const overallPct = totalAll > 0 ? Math.round((coveredAll / totalAll) * 100) : 0;

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Prompt Coverage</h3>
          <p className="text-sm text-muted-foreground">Your visibility across prompt categories</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Covered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Gap</span>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 italic">Add tracked prompts with categories to see coverage analysis.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = category.total > 0 ? Math.round((category.covered / category.total) * 100) : 0;
            
            return (
              <motion.div
                key={category.name}
                className="group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {category.covered}/{category.total} ({percentage}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", category.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{overallPct}%</p>
            <p className="text-sm text-muted-foreground">Overall coverage</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
            View gaps
          </button>
        </div>
      </div>
    </div>
  );
}
