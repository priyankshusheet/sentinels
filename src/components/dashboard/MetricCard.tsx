import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioEffects } from "@/hooks/use-audio-effects";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "border-white/5",
  primary: "border-cyan-500/20 shadow-[0_0_20px_rgba(0,212,255,0.05)]",
  success: "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]",
  warning: "border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]",
  destructive: "border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]",
};

const iconVariantStyles = {
  default: "bg-white/5 text-white border border-white/10",
  primary: "bg-cyan-500/10 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,212,255,0.8)] border border-cyan-500/20",
  success: "bg-emerald-500/10 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-500/20",
  destructive: "bg-rose-500/10 text-rose-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-rose-500/20",
};

const borderGlowStyles = {
  default: "group-hover:border-white/20",
  primary: "animate-pulse-cyan",
  success: "animate-pulse-emerald",
  warning: "animate-pulse-amber",
  destructive: "animate-pulse-rose",
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  variant = "default",
}: MetricCardProps) {
  const trend = change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : null;

  return (
    <motion.div
      className={cn(
        "relative rounded-[24px] glass-panel p-6 overflow-hidden transition-all duration-300",
        variantStyles[variant]
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              iconVariantStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                trend === "up" && "bg-success/20 text-success",
                trend === "down" && "bg-destructive/20 text-destructive",
                trend === "neutral" && "bg-secondary text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {trend === "neutral" && <Minus className="h-3 w-3" />}
              {change !== undefined && <span>{change > 0 ? "+" : ""}{change}%</span>}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
