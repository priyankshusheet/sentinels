import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentIndicator() {
  const { user } = useAuth();
  const [data, setData] = useState<SentimentData>({ positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const { data: citations, error } = await supabase
        .from("citations")
        .select("sentiment")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching sentiment:", error);
        setLoading(false);
        return;
      }

      const counts = { positive: 0, neutral: 0, negative: 0 };
      (citations || []).forEach((c: any) => {
        if (c.sentiment === "positive") counts.positive++;
        else if (c.sentiment === "negative") counts.negative++;
        else counts.neutral++;
      });

      const total = citations?.length || 1;
      setData({
        positive: Math.round((counts.positive / total) * 100),
        neutral: Math.round((counts.neutral / total) * 100),
        negative: Math.round((counts.negative / total) * 100),
      });
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

  const primarySentiment = data.positive >= data.negative ? (data.positive >= data.neutral ? "positive" : "neutral") : "negative";

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Brand Sentiment</h3>
        <p className="text-sm text-muted-foreground">How AI portrays your brand</p>
      </div>

      {/* Main sentiment display */}
      <div className="flex items-center justify-center mb-8">
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <div className={`h-32 w-32 rounded-full flex items-center justify-center ${
            primarySentiment === "positive" ? "bg-success/20" : 
            primarySentiment === "negative" ? "bg-destructive/20" : "bg-muted/20"
          }`}>
            <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
              primarySentiment === "positive" ? "bg-success/20" : 
              primarySentiment === "negative" ? "bg-destructive/20" : "bg-muted/20"
            }`}>
              {primarySentiment === "positive" && <Smile className="h-12 w-12 text-success" />}
              {primarySentiment === "neutral" && <Meh className="h-12 w-12 text-muted-foreground" />}
              {primarySentiment === "negative" && <Frown className="h-12 w-12 text-destructive" />}
            </div>
          </div>
          <motion.div
            className={`absolute -right-2 -top-2 rounded-full px-3 py-1 text-sm font-bold ${
              primarySentiment === "positive" ? "bg-success text-success-foreground" : 
              primarySentiment === "negative" ? "bg-destructive text-destructive-foreground" : "bg-muted-foreground text-white"
            }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {data.positive}%
          </motion.div>
        </motion.div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Smile className="h-5 w-5 text-success" />
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-success"
                initial={{ width: 0 }}
                animate={{ width: `${data.positive}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground w-12 text-right">{data.positive}%</span>
        </div>

        <div className="flex items-center gap-3">
          <Meh className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-muted-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${data.neutral}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground w-12 text-right">{data.neutral}%</span>
        </div>

        <div className="flex items-center gap-3">
          <Frown className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-destructive"
                initial={{ width: 0 }}
                animate={{ width: `${data.negative}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground w-12 text-right">{data.negative}%</span>
        </div>
      </div>
    </div>
  );
}
