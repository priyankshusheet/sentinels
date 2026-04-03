import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Zap, CheckCircle, Clock, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOptimization } from "@/hooks/use-optimization";

interface OptTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  ai_suggestion: string | null;
  target_url: string | null;
  impact_score: number | null;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  schema: "Schema Markup",
  content_gap: "Content Gap",
  technical: "Technical SEO",
  authority: "Brand Authority",
  general: "General",
};

export default function Optimization() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<OptTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  
  const { generateWeeklyTasks, generateContentFix, isGenerating } = useOptimization(user?.id);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase.from("optimization_tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("optimization_tasks").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id);
    toast.success(status === "completed" ? "Task completed!" : "Task updated");
    fetchTasks();
  };

  const handleGenerateTasks = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase.from("profiles").select("website_url").eq("user_id", user.id).single();
      if (!profile?.website_url) {
        toast.error("Please add your website URL in Settings first");
        return;
      }

      toast.info("AI is compiling your weekly AEO checklist...");
      const newTasks = await generateWeeklyTasks(profile.website_url);

      if (newTasks && newTasks.length > 0) {
        const formattedTasks = newTasks.map((t: any) => ({
          user_id: user.id,
          ...t,
          status: "pending"
        }));
        
        const { error } = await supabase.from("optimization_tasks").insert(formattedTasks);
        if (error) throw error;
        
        toast.success("Weekly AEO checklist generated!");
        fetchTasks();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleOneClickFix = async (task: OptTask) => {
    toast.info(`Generating AI fix for: ${task.title}...`);
    const fix = await generateContentFix(task.title, task.description || "");
    if (fix) {
      // Update task with the AI suggestion
      await supabase.from("optimization_tasks").update({ ai_suggestion: fix }).eq("id", task.id);
      toast.success("AI fix generated! Review it below.");
      fetchTasks();
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Optimization</h1>
            <p className="text-muted-foreground mt-1">Schema audits, content gaps & weekly AEO to-do steps</p>
          </div>
          <Button onClick={handleGenerateTasks} disabled={isGenerating} className="gap-2">
            <Lightbulb className="h-4 w-4" /> {isGenerating ? "Generating..." : "Generate Weekly Tasks"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border"><p className="text-sm text-muted-foreground">Total Tasks</p><p className="text-2xl font-bold text-foreground">{tasks.length}</p></div>
          <div className="bg-card rounded-xl p-4 border border-border"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-warning">{pendingCount}</p></div>
          <div className="bg-card rounded-xl p-4 border border-border"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-success">{completedCount}</p></div>
          <div className="bg-card rounded-xl p-4 border border-border"><p className="text-sm text-muted-foreground">Completion Rate</p><p className="text-2xl font-bold text-primary">{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "in_progress", "completed", "dismissed"].map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f.replace("_", " ")}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No optimization tasks yet. Generate your weekly AEO to-do list!</p>
            <Button onClick={handleGenerateTasks} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Tasks"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <motion.div key={task.id} className="bg-card rounded-xl border border-border p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={cn("text-xs", priorityColors[task.priority])}>{task.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{categoryLabels[task.category] || task.category}</Badge>
                      {task.impact_score && <span className="text-xs text-muted-foreground">Impact: {task.impact_score}/100</span>}
                    </div>
                    <h3 className={cn("font-semibold text-foreground mb-1", task.status === "completed" && "line-through opacity-60")}>{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    {task.ai_suggestion && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1"><Lightbulb className="h-3 w-3 text-primary" /><span className="text-xs font-medium text-primary">AI Recommendation</span></div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.ai_suggestion}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row lg:flex-col gap-2 min-w-[120px] w-full lg:w-auto">
                    <Button size="sm" variant="outline" className="text-xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary h-8 flex-1 lg:flex-none" onClick={() => handleOneClickFix(task)}>
                      <Zap className="h-3 w-3 mr-1" /> One-Click Fix
                    </Button>
                    {task.status === "pending" && (
                      <div className="flex gap-2 flex-1 lg:flex-none">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, "in_progress")} className="gap-1 flex-1 h-8"><Clock className="h-3 w-3" /> Start</Button>
                        <Button size="sm" onClick={() => updateStatus(task.id, "completed")} className="gap-1 flex-1 h-8"><CheckCircle className="h-3 w-3" /> Done</Button>
                      </div>
                    )}
                    {(task.status === "in_progress" || task.status === "pending") && (
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => updateStatus(task.id, "dismissed")}><X className="h-3 w-3 mr-1" /> Dismiss</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
