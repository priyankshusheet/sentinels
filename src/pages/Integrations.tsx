import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Puzzle, Globe, MessageSquare, Database, Zap, Plus, Search, Users, FileText, ChevronRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const integrations = [
  { name: "Google Business Profile", icon: Globe, status: "Connected", category: "Local Visibility", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { name: "Google Search Console", icon: Search, status: "Coming Soon", category: "Search Data", color: "text-green-400", bgColor: "bg-green-500/10" },
  { name: "Notion", icon: FileText, status: "Coming Soon", category: "Workspace Sync", color: "text-slate-400", bgColor: "bg-slate-500/10" },
  { name: "Ahrefs", icon: Globe, status: "Coming Soon", category: "Backlink Intelligence", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { name: "Slack", icon: MessageSquare, status: "Coming Soon", category: "Real-time Alerts", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { name: "Zapier", icon: Zap, status: "Coming Soon", category: "Workflow Automation", color: "text-amber-400", bgColor: "bg-amber-500/10" },
];

export default function Integrations() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Integrations Hub</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Unify your marketing data for cross-platform AEO intelligence</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/5 border border-purple-500/10">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-mono tracking-tighter">API ACTIVE</span>
            </div>
            <Button aria-label="Request New Integration Module" className="gap-2 bg-secondary/50 border border-white/5 hover:bg-secondary transition-all rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest">
                <Plus className="h-4 w-4" /> Request Module
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, index) => (
            <motion.div 
              key={item.name} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-[28px] border border-border p-8 flex flex-col group hover:border-cyan-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <item.icon size={80} />
              </div>
              <div className="flex items-start justify-between mb-8">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", item.bgColor)}>
                  <item.icon size={28} className={item.color} />
                </div>
                <Badge 
                  variant={item.status === "Connected" ? "outline" : "secondary"} 
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                    item.status === "Connected" ? "border-green-500/30 text-green-400 bg-green-500/5" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {item.status}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{item.name}</h3>
                <p className="text-[10px] text-[#556987] mb-8 font-black uppercase tracking-[0.15em]">{item.category}</p>
              </div>
              <Button 
                variant="outline" 
                aria-label={item.status === "Connected" ? `Configure ${item.name} data` : `Initialize link for ${item.name}`}
                className={cn(
                  "mt-auto w-full h-11 rounded-xl font-bold transition-all text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2",
                  item.status === "Connected" ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" : "border-white/10 hover:bg-white/5"
                )}
              >
                {item.status === "Connected" ? "Configure Data" : "Initialize Link"}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="pt-10">
            <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-[32px] border border-white/5 p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
                <div className="space-y-4 text-center md:text-left">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mx-auto md:mx-0"><LayoutGrid className="text-cyan-400" /></div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Developer SDK v1.0</h2>
                    <p className="text-muted-foreground max-w-lg font-medium">Build custom connectors and ingest propriety data streams directly into the Sentinel AEO engine.</p>
                </div>
                <Button className="bg-white text-black font-black uppercase tracking-widest text-xs px-10 h-14 rounded-2xl shadow-2xl hover:bg-cyan-400 transition-all shrink-0">
                    Get Api Keys <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

