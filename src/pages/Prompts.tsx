import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Eye, EyeOff, FileText, Clock, Plus, Trash2, ChevronDown, ChevronRight, Zap, BarChart3, Download, Copy, Check, Sparkles, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePrompts } from "@/hooks/use-prompts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const categories = ["All", "General", "Product Reviews", "Comparisons", "How-to Guides", "Best Of Lists", "Alternatives"];

export default function Prompts() {
  const { user } = useAuth();
  const { prompts, isLoading, addPrompt, deletePrompt, analyzePrompt, isAnalyzing } = usePrompts(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ query: "", category: "General" });
  const [dateRange, setDateRange] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddPrompt = async () => {
    if (!newPrompt.query.trim()) return;
    await addPrompt(newPrompt);
    setNewPrompt({ query: "", category: "General" });
    setDialogOpen(false);
    toast.success("New prompt added to tracking queue");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Analysis copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const headers = ["ID", "Query", "Category", "Visibility", "Confidence", "Platform", "Last Checked"];
    const rows = filtered.map(p => [
      p.id,
      `"${p.query.replace(/"/g, '""')}"`,
      p.category || "General",
      p.latest_ranking?.visibility || "N/A",
      `${p.latest_ranking?.confidence_score || 0}%`,
      p.latest_ranking?.llm_platform || "N/A",
      p.latest_ranking?.checked_at ? new Date(p.latest_ranking.checked_at).toISOString() : "Never"
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sentinel_prompts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report generated successfully");
  };

  const filtered = prompts.filter(p => {
    const matchSearch = p.query.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    
    let matchDate = true;
    if (dateRange !== "all" && p.latest_ranking) {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      matchDate = new Date(p.latest_ranking.checked_at) >= cutoff;
    } else if (dateRange !== "all" && !p.latest_ranking) {
        matchDate = false;
    }
    
    return matchSearch && matchCat && matchDate;
  });

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Prompt Analytics</h1>
              <p className="text-muted-foreground mt-1">Track and decode AI responses to your brand prompts</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportCSV} className="gap-2 border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
                  <Download className="h-4 w-4" /> Export
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-[0_0_15px_rgba(0,212,255,0.4)] border-0 px-6">
                    <Plus className="h-4 w-4" /> New Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle className="text-2xl font-bold">Track a New Prompt</DialogTitle></DialogHeader>
                  <div className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prompt Query</Label>
                        <Input value={newPrompt.query} onChange={e => setNewPrompt(p => ({ ...p, query: e.target.value }))} placeholder="e.g. Best project management tools for startups" className="bg-secondary/50 border-white/5 h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Select value={newPrompt.category} onValueChange={v => setNewPrompt(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="bg-secondary/50 border-white/5 h-12"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddPrompt} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 shadow-[0_0_15px_rgba(0,212,255,0.4)] border-0">Track Now</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
              <Input placeholder="Search within monitored prompts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50 border-white/5 h-11 focus:ring-1 focus:ring-cyan-500/50" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-white/5 h-11">
                    <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
                </Select>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full sm:w-[140px] px-4 h-11 rounded-md bg-secondary/50 text-foreground border border-white/5 text-sm outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Monitored</p><p className="text-3xl font-bold text-foreground">{prompts.length}</p></div>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm border-l-4 border-l-green-500/50"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mentioned</p><p className="text-3xl font-bold text-green-400">{prompts.filter(p => p.latest_ranking?.visibility === "mentioned").length}</p></div>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm border-l-4 border-l-yellow-500/50"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Partial Trace</p><p className="text-3xl font-bold text-yellow-400">{prompts.filter(p => p.latest_ranking?.visibility === "partial").length}</p></div>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm border-l-4 border-l-red-500/50"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Not Found</p><p className="text-3xl font-bold text-red-500">{prompts.filter(p => !p.latest_ranking || p.latest_ranking.visibility === "not_mentioned").length}</p></div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 w-full bg-secondary/20 rounded-xl border border-white/5 animate-pulse" />
                ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-[32px] border border-dashed border-border group transition-all">
              <Search className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-lg font-medium text-foreground mb-2">No results matching your filter</p>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Try adjusting your search or category filters to find the prompts you're looking for.</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="border-cyan-500/30 text-cyan-400">Add New Prompt</Button>
            </div>
          ) : (
            <div className="space-y-4 px-1">
              {filtered.map((prompt, index) => {
                const r = prompt.latest_ranking;
                const vis = r?.visibility || "not_mentioned";
                const confidence = r?.confidence_score || 0;
                const citations = r?.citations_found || 0;

                return (
                  <motion.div key={prompt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={cn("bg-card rounded-[20px] border transition-all duration-300 overflow-hidden group", expandedPrompt === prompt.id ? "border-cyan-500/30 shadow-[0_0_20px_rgba(0,212,255,0.1)] mb-6 mt-4" : "border-border hover:border-white/10 hover:bg-secondary/10")}>
                    <div className="p-5 cursor-pointer flex items-center justify-between" onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}>
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:rotate-6", vis === "mentioned" && "bg-green-500/10 text-green-400 border border-green-500/20", vis === "partial" && "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", vis === "not_mentioned" && "bg-red-500/10 text-red-500 border border-red-500/20")}>
                                {vis === "not_mentioned" ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{prompt.query}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <Badge variant="secondary" className="bg-secondary/50 text-[10px] uppercase font-bold tracking-widest">{prompt.category || "General"}</Badge>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="h-3 w-3 text-cyan-400/70" /> {citations} citations</span>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3 text-purple-400/70" /> {r ? new Date(r.checked_at).toLocaleDateString() : "Pending"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 pl-8">
                            <div className="text-right">
                                <div className={cn("text-2xl font-black mb-0.5", confidence > 70 ? "text-cyan-400" : confidence > 40 ? "text-yellow-400" : "text-red-500")}>{confidence}%</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-[#556987]">Confidence Score</div>
                            </div>
                            <div className="h-10 w-px bg-white/5 hidden md:block" />
                            <ChevronDown className={cn("h-6 w-6 text-muted-foreground/30 transition-all duration-500 group-hover:text-cyan-400", expandedPrompt === prompt.id && "rotate-180 text-cyan-400")} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedPrompt === prompt.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border p-6 bg-secondary/5 overflow-hidden">
                            {r?.ai_response ? (
                            <div className="space-y-6">
                                {/* Multi-LLM comparison view */}
                                {prompt.all_rankings && prompt.all_rankings.length > 1 && (
                                  <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                      <BarChart3 className="h-4 w-4" /> Multi-LLM Comparison
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {/* Deduplicate by platform, showing latest per platform */}
                                      {Object.values(
                                        prompt.all_rankings.reduce((acc: Record<string, typeof prompt.all_rankings[0]>, ranking) => {
                                          if (!acc[ranking.llm_platform] || new Date(ranking.checked_at) > new Date(acc[ranking.llm_platform].checked_at)) {
                                            acc[ranking.llm_platform] = ranking;
                                          }
                                          return acc;
                                        }, {})
                                      ).map((ranking: any) => (
                                        <div key={ranking.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{ranking.llm_platform}</Badge>
                                            <span className={cn("text-lg font-bold", (ranking.confidence_score || 0) > 70 ? "text-success" : (ranking.confidence_score || 0) > 40 ? "text-warning" : "text-destructive")}>
                                              {ranking.confidence_score || 0}%
                                            </span>
                                          </div>
                                          <Badge variant={ranking.visibility === "mentioned" ? "default" : "secondary"} className="text-[9px]">
                                            {ranking.visibility}
                                          </Badge>
                                          <p className="text-[10px] text-muted-foreground">{ranking.citations_found || 0} citations</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" /> AI Engine Response
                                            </h4>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(r.ai_response, prompt.id); }} className="h-8 text-xs gap-2 text-muted-foreground hover:text-primary">
                                                {copiedId === prompt.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                {copiedId === prompt.id ? "Copied" : "Copy response"}
                                            </Button>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-secondary/20 border border-border text-sm leading-relaxed text-muted-foreground shadow-inner group/text relative">
                                            {r.ai_response}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/text:opacity-100 transition-opacity">
                                                <Badge variant="outline" className="text-[10px] bg-background border-primary/20 text-primary uppercase font-black">{r.llm_platform}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                                            <Zap className="h-4 w-4" /> Optimization Signal
                                        </h4>
                                        <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed italic">"Consider reinforcing brand mentions in technical documentation and whitepapers to improve LLM visibility."</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-6 border-t border-border">
                                    <Button onClick={(e) => { e.stopPropagation(); analyzePrompt({ id: prompt.id }); }} disabled={isAnalyzing} className="h-10 bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 font-bold px-6 rounded-xl text-xs gap-2">
                                        {isAnalyzing ? "Processing..." : <><RotateCcw className="h-4 w-4" /> Recalculate</>}
                                    </Button>
                                    <Button onClick={(e) => { e.stopPropagation(); analyzePrompt({ id: prompt.id, parallel: true }); }} disabled={isAnalyzing} className="h-10 bg-accent/10 text-accent hover:bg-accent/20 border-accent/30 font-bold px-6 rounded-xl text-xs gap-2">
                                        {isAnalyzing ? "Comparing..." : <><Zap className="h-4 w-4" /> Multi-Platform Audit</>}
                                    </Button>
                                    <div className="flex-1" />
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deletePrompt(prompt.id); }} disabled={isAnalyzing} className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-xs gap-2 uppercase tracking-widest font-bold">
                                        <Trash2 className="h-3.5 w-3.5" /> Stop Tracking
                                    </Button>
                                </div>
                            </div>
                            ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center animate-bounce">
                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Analysis in Queue</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Click below to trigger a high-priority scan.</p>
                                </div>
                                <Button onClick={(e) => { e.stopPropagation(); analyzePrompt({ id: prompt.id }); }} disabled={isAnalyzing} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8 rounded-xl shadow-lg">Analyze Now</Button>
                            </div>
                            )}
                        </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

