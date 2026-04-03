import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Bot, Plus, Play, Pause, Trash2, ShieldCheck, Zap, Activity, Info, Loader2, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const agentPersonas = [
  { id: "monitor", name: "Visibility Sentry", icon: ShieldCheck, description: "Continuous monitoring for visibility drops and spikes across LLMs.", color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
  { id: "auditor", name: "Market Auditor", icon: Activity, description: "Deep audits of competitor mentions and share of voice.", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { id: "optimizer", name: "AEO Optimizer", icon: Zap, description: "Auto-generates and suggests content optimizations based on gaps.", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
];

export default function Agents() {
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const deployAgent = (persona: any) => {
    setIsDeploying(persona.id);
    setTimeout(() => {
      setActiveAgents(prev => [...prev, { ...persona, deployedAt: new Date(), status: 'running' }]);
      setIsDeploying(null);
      toast.success(`${persona.name} deployed successfully!`, {
        description: "Autonomous monitoring has started.",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    }, 2500);
  };

  const removeAgent = (id: string) => {
    setActiveAgents(prev => prev.filter(a => a.id !== id));
    toast.info("Agent decommissioned");
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Agent Marketplace</h1>
              <p className="text-muted-foreground mt-1">Deploy autonomous intelligence to dominate the 2026 search landscape</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLogs(!showLogs)} className="gap-2 border-white/10 hover:border-cyan-500/30">
                <History className="h-4 w-4" /> {showLogs ? "Hide Logs" : "Activity Logs"}
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)] border-0">
                <Plus className="h-4 w-4" /> Custom Agent
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentPersonas.map((persona) => (
              <motion.div 
                key={persona.id}
                whileHover={{ y: -5, borderColor: "rgba(34,211,238,0.3)" }}
                className={cn("bg-card rounded-[24px] border border-border p-6 relative overflow-hidden group transition-all duration-500", persona.id === isDeploying && "ring-2 ring-cyan-500/50")}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <persona.icon size={100} />
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner", persona.bgColor, persona.borderColor)}>
                    <persona.icon className={`h-6 w-6 ${persona.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    {persona.name}
                    <Tooltip>
                        <TooltipTrigger asChild><Info size={14} className="text-muted-foreground cursor-help opacity-50" /></TooltipTrigger>
                        <TooltipContent className="max-w-[180px] text-[10px] leading-relaxed">Runs on Gemini 1.5 Pro to provide high-reasoning autonomous analysis.</TooltipContent>
                    </Tooltip>
                </h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">{persona.description}</p>
                <Button 
                    variant="outline" 
                    onClick={() => deployAgent(persona)} 
                    disabled={isDeploying !== null || activeAgents.some(a => a.id === persona.id)}
                    className={cn("w-full h-11 rounded-xl font-bold transition-all border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10", activeAgents.some(a => a.id === persona.id) && "bg-green-500/10 border-green-500/30 text-green-400 cursor-default hover:bg-green-500/10")}
                >
                    {isDeploying === persona.id ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Initializing...</> : 
                     activeAgents.some(a => a.id === persona.id) ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Active</> : 
                     "Deploy Agent"}
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6 pt-10">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center"><Bot className="h-5 w-5 text-cyan-400" /></div>
              Active Fleet Status
            </h2>
            
            <div className="bg-card rounded-[32px] border border-border overflow-hidden min-h-[200px] flex flex-col">
              <AnimatePresence mode="wait">
                {activeAgents.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                    <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6 group relative">
                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bot className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Fleet Offline</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">Select a persona from the marketplace above to begin autonomous visibility orchestration.</p>
                    <div className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    </div>
                  </motion.div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {activeAgents.map((agent) => (
                      <motion.div key={agent.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 flex items-center justify-between group hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", agent.bgColor)}>
                                <agent.icon className={cn("h-5 w-5", agent.color)} />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground flex items-center gap-2">
                                    {agent.name} <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-tight">Last ping: {new Date().toLocaleTimeString()} • Health: Nominal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-background border-border text-[10px] font-black uppercase tracking-widest px-3">Running</Badge>
                            <Button variant="ghost" size="icon" onClick={() => removeAgent(agent.id)} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </motion.div>
                    ))}
                    {showLogs && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="bg-black/20 p-6 font-mono text-[10px] text-cyan-400 overflow-hidden space-y-1">
                            {activeAgents.map(a => (
                                <div key={a.id} className="opacity-80">[{new Date().toLocaleTimeString()}] {a.name} {" >> "} Scanned 12 prompts, detected +3% visibility lift on Gemini.</div>
                            ))}
                            <div className="animate-pulse">_ EXECUTION POOL INITIALIZED...</div>
                        </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

