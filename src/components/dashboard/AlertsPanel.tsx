import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, XCircle, ArrowRight, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const alertStyles = {
  critical: {
    icon: XCircle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    iconColor: "text-warning",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-success/10",
    border: "border-success/30",
    iconColor: "text-success",
  },
  info: {
    icon: Info,
    bg: "bg-primary/10",
    border: "border-primary/30",
    iconColor: "text-primary",
  },
};

function mapSeverity(severity: string): keyof typeof alertStyles {
  if (severity === "critical" || severity === "error") return "critical";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  return "info";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AlertsPanel() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) setAlerts(data);
      setLoading(false);
    };
    fetchAlerts();

    // Poll for new alerts every 30 seconds instead of Realtime (secure)
    const interval = setInterval(fetchAlerts, 30000);

    return () => { clearInterval(interval); };
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
          <p className="text-sm text-muted-foreground">AI behavior changes and opportunities</p>
        </div>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 italic">No alerts yet. Alerts will appear here as your visibility changes.</p>
        )}
        {alerts.map((alert, index) => {
          const severity = mapSeverity(alert.severity);
          const style = alertStyles[severity];
          const Icon = style.icon;

          return (
            <motion.div
              key={alert.id}
              className={cn(
                "flex items-start gap-4 rounded-xl p-4 border transition-all hover:bg-secondary/50 cursor-pointer",
                style.bg,
                style.border
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn("mt-0.5", style.iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-foreground">{alert.title}</h4>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {timeAgo(alert.created_at)}
                  </span>
                </div>
                {alert.message && (
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
