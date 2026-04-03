import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExternalLink, Crown, Star, Award, Plus, Trash2, Search, Link as LinkIcon, Globe, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Citation {
  id: string;
  source_name: string;
  source_url: string;
  domain: string | null;
  mention_count: number | null;
  authority_score: number | null;
  is_owned: boolean | null;
  sentiment: string | null;
  created_at: string;
}

export default function Citations() {
  const { user } = useAuth();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCitation, setNewCitation] = useState({ source_name: "", source_url: "", is_owned: false });
  const [dateRange, setDateRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCitations = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("citations").select("*").eq("user_id", user.id).order("mention_count", { ascending: false });
    
    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const date = new Date();
      date.setDate(date.getDate() - days);
      query = query.gte("created_at", date.toISOString());
    }

    const { data } = await query;
    setCitations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCitations(); }, [user, dateRange]);

  const addCitation = async () => {
    if (!user || !newCitation.source_name || !newCitation.source_url) return;
    const domain = (() => { try { return new URL(newCitation.source_url.startsWith("http") ? newCitation.source_url : `https://${newCitation.source_url}`).hostname; } catch { return newCitation.source_url; } })();
    const { error } = await supabase.from("citations").insert({ user_id: user.id, source_name: newCitation.source_name, source_url: newCitation.source_url, domain, is_owned: newCitation.is_owned });
    if (error) { toast.error(error.message); return; }
    toast.success("Citation source added to index", { description: "It will be included in the next automated audit." });
    setNewCitation({ source_name: "", source_url: "", is_owned: false });
    setDialogOpen(false);
    fetchCitations();
  };

  const deleteCitation = async (id: string) => {
    await supabase.from("citations").delete().eq("id", id);
    toast.info("Citation source removed");
    fetchCitations();
  };

  const filtered = citations.filter(c => 
    c.source_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20"><Crown className="h-5 w-5 text-yellow-500" /></div>;
    if (index === 1) return <div className="h-10 w-10 rounded-xl bg-slate-400/10 flex items-center justify-center border border-slate-400/20"><Star className="h-5 w-5 text-slate-400" /></div>;
    if (index === 2) return <div className="h-10 w-10 rounded-xl bg-amber-600/10 flex items-center justify-center border border-amber-600/20"><Award className="h-5 w-5 text-amber-600" /></div>;
    return <div className="h-10 w-10 rounded-xl bg-secondary/30 flex items-center justify-center border border-white/5"><span className="text-xs font-black text-muted-foreground">{index + 1}</span></div>;
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight italic uppercase">Source Citations</h1>
              <p className="text-muted-foreground mt-1 font-medium">Identify and verify the primary knowledge sources LLMs use for your brand</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 mr-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Live Knowledge Sync</span>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button aria-label="Add new citation source" className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white font-bold h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.3)] border-0">
                    <Plus className="h-4 w-4" /> Add Ground Truth
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border rounded-[32px] overflow-hidden p-0">
                  <div className="p-8 bg-gradient-to-br from-cyan-900/20 to-transparent border-b border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Add Citation Source</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground pt-1">Provide a URL for the Sentinel engine to crawl and verify against LLM responses.</DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#556987]">Source Identity</Label>
                        <Input value={newCitation.source_name} onChange={e => setNewCitation(p => ({ ...p, source_name: e.target.value }))} placeholder="e.g. Official Documentation" className="bg-secondary/50 border-white/5 h-12 rounded-xl focus-visible:ring-cyan-500" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#556987]">Target URL</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={newCitation.source_url} onChange={e => setNewCitation(p => ({ ...p, source_url: e.target.value }))} placeholder="https://docs.yourbrand.com/..." className="pl-10 bg-secondary/50 border-white/5 h-12 rounded-xl focus-visible:ring-cyan-500" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-white/5 group hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-cyan-400" /></div>
                            <div>
                                <p className="text-xs font-bold text-foreground">Owned Source</p>
                                <p className="text-[10px] text-muted-foreground">Mark this as a primary brand asset</p>
                            </div>
                        </div>
                        <Switch checked={newCitation.is_owned} onCheckedChange={v => setNewCitation(p => ({ ...p, is_owned: v }))} className="data-[state=checked]:bg-cyan-500" />
                    </div>
                    <Button onClick={addCitation} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black h-12 rounded-xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/40 border-0">Register Source</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
              <Input placeholder="Search citation database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 bg-secondary/50 border-white/5 h-12 rounded-2xl focus-visible:ring-cyan-500" />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-white/5 h-12 rounded-2xl focus:ring-cyan-500">
                    <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#556987] mb-2 px-1">Source Footprint</p>
                    <p className="text-4xl font-black text-foreground">{citations.length}</p>
                </div>
                <div className="pt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><Globe size={12} className="text-cyan-400" /> Cumulative Coverage</div>
            </div>
            <div className="bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col justify-between border-l-4 border-l-cyan-500/50">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#556987] mb-2 px-1">Brand Verification</p>
                    <p className="text-4xl font-black text-cyan-400">{citations.filter(c => c.is_owned).length}</p>
                </div>
                <div className="pt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><ShieldCheck size={12} className="text-cyan-400" /> Owned Assertions</div>
            </div>
            <div className="bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col justify-between border-l-4 border-l-purple-500/50">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#556987] mb-2 px-1">Global Mentions</p>
                    <p className="text-4xl font-black text-purple-400">{citations.reduce((acc, c) => acc + (c.mention_count || 0), 0)}</p>
                </div>
                <div className="pt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><TrendingUp size={12} className="text-purple-400" /> Influence Velocity</div>
            </div>
          </div>

          <div className="bg-card rounded-[32px] border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-secondary/10">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#556987]">Entity Source Leaderboard</h3>
                <Badge variant="outline" className="text-[10px] font-bold border-cyan-500/20 text-cyan-400 uppercase tracking-widest">LIVE AUDIT</Badge>
            </div>
            
            <div className="divide-y divide-white/5">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-[0.2em]">Syncing Knowledge Base...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center">
                        <Globe className="h-16 w-16 text-muted-foreground/10 mx-auto mb-6" />
                        <p className="text-muted-foreground font-bold tracking-tight">No citation data discovered matching current parameters.</p>
                        <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-4 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Index New Source →</Button>
                    </div>
                ) : (
                    filtered.map((citation, index) => (
                        <motion.div 
                            key={citation.id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-6 p-6 group hover:bg-secondary/20 transition-all duration-300"
                        >
                            <div className="shrink-0">{getRankIcon(index)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-foreground truncate group-hover:text-cyan-400 transition-colors tracking-tight text-lg">{citation.source_name}</h4>
                                    {citation.is_owned && (
                                        <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-black uppercase tracking-widest">Brand Owned</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                                    <Globe className="h-3.5 w-3.5 opacity-50" />
                                    <span>{citation.domain || "Internal Node"}</span>
                                    <div className="h-1 w-1 rounded-full bg-white/10" />
                                    <a href={citation.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Verify source: ${citation.source_name}`} className="flex items-center gap-1 hover:text-cyan-400 transition-colors group/link underline decoration-white/5 underline-offset-4">
                                        Verify Source <ExternalLink className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-10 pr-4">
                                <div className="text-center group/metric cursor-help">
                                    <div className="text-xl font-black text-foreground group-hover/metric:text-purple-400 transition-colors">{citation.mention_count || 0}</div>
                                    <div className="text-[9px] uppercase font-black tracking-[0.2em] text-[#556987]">Mentions</div>
                                </div>
                                <div className="text-center group/metric cursor-help">
                                    <div className="text-xl font-black text-foreground group-hover/metric:text-cyan-400 transition-colors">{citation.authority_score || 0}%</div>
                                    <div className="text-[9px] uppercase font-black tracking-[0.2em] text-[#556987]">Domain Auth</div>
                                </div>
                                <div className="h-10 w-px bg-white/5" />
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500 rounded-xl"
                                    onClick={() => deleteCitation(citation.id)}
                                    aria-label={`Remove citation for ${citation.source_name}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
