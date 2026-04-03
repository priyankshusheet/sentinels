import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-20 bg-card rounded-[32px] border border-dashed border-border group transition-all relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-8 mx-auto relative group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="h-10 w-10 text-muted-foreground/40 group-hover:text-cyan-400 transition-colors duration-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight transition-colors group-hover:text-cyan-400">{title}</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-10 font-medium leading-relaxed px-6">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] text-white font-bold h-11 px-8 rounded-xl border-0 transition-all hover:scale-105"
          >
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
