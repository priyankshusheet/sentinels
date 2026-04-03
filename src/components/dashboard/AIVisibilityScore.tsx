import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioEffects } from "@/hooks/use-audio-effects";

interface AIVisibilityScoreProps {
  score: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export function AIVisibilityScore({ score, change, trend }: AIVisibilityScoreProps) {
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl bg-card p-8 border border-border overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Animated ring */}
      <div className="relative">
        <svg className="h-64 w-64 -rotate-90">
          {/* Background ring */}
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
          />
          {/* Progress ring */}
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={circumference}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold text-gradient"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-sm text-muted-foreground mt-1">AI Visibility Score</span>
        </div>
      </div>

      {/* Change indicator */}
      <motion.div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-full px-4 py-2",
          trend === "up" && "bg-success/10 text-success",
          trend === "down" && "bg-destructive/10 text-destructive",
          trend === "neutral" && "bg-secondary text-muted-foreground"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4" />
        ) : trend === "down" ? (
          <TrendingDown className="h-4 w-4" />
        ) : null}
        <span className="text-sm font-medium">
          {change > 0 ? "+" : ""}{change}% this week
        </span>
      </motion.div>

      {/* View details link */}
      <motion.button
        className="mt-4 flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        View breakdown
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
