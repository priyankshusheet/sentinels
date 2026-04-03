import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetitorCardProps {
  rank: number;
  name: string;
  domain: string;
  score: number;
  change: number;
  isYou?: boolean;
}

export function CompetitorCard({ rank, name, domain, score, change, isYou }: CompetitorCardProps) {
  const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-between rounded-xl p-4 border transition-all hover:border-primary/50",
        isYou
          ? "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
          : "bg-card border-border"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Rank and Company info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            rank === 1 && "bg-yellow-500/20 text-yellow-500",
            rank === 2 && "bg-slate-400/20 text-slate-400",
            rank === 3 && "bg-amber-600/20 text-amber-600",
            rank > 3 && "bg-secondary text-muted-foreground"
          )}
        >
          #{rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-foreground truncate">{name}</span>
            {isYou && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground uppercase tracking-tighter">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <span className="truncate">{domain}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Score and change */}
      <div className="flex-shrink-0 text-right ml-4">
        <div className="text-xl font-bold text-foreground leading-none">{score}</div>
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-[11px] mt-1 font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {trend === "up" && <TrendingUp className="h-3 w-3" />}
          {trend === "down" && <TrendingDown className="h-3 w-3" />}
          {trend === "neutral" && <Minus className="h-3 w-3" />}
          <span>{change > 0 ? "+" : ""}{change}%</span>
        </div>
      </div>
    </motion.div>
  );
}
