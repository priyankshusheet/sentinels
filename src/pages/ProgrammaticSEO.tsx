import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Globe, Plus, FileText, Settings, Sparkles, Wand2, Rocket, ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ProgrammaticSEO() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);

  const startCampaign = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setWizardOpen(false);
      setStep(1);
      toast.success("AEO Campaign Launched", {
        description: "50 landing pages are now being generated and indexed.",
        icon: <Rocket className="h-4 w-4 text-cyan-400" />
      });
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Programmatic SEO</h1>
            <p className="text-muted-foreground mt-1">Scale your AEO presence with autonomous, schema-optimized content</p>
          </div>
          <Button 
            onClick={() => setWizardOpen(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] border-0 px-8 h-12 rounded-xl transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-[28px] border border-border p-8 flex flex-col items-center text-center group hover:border-cyan-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/5">
                <div className="h-16 w-16 rounded-[20px] bg-cyan-500/10 flex items-center justify-center mb-8 shadow-inner group-hover:rotate-6 transition-transform">
                    <Sparkles className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 tracking-tight">Dynamic Templates</h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">Create high-conversion AEO templates with automated JSON-LD schema injection.</p>
                <Button variant="outline" className="mt-auto w-full h-11 rounded-xl border-white/10 hover:bg-white/5 transition-colors">Configure System</Button>
            </div>
            <div className="bg-card rounded-[28px] border border-border p-8 flex flex-col items-center text-center group hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/5">
                <div className="h-16 w-16 rounded-[20px] bg-purple-500/10 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform">
                    <FileText className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 tracking-tight">Content Gap Bridge</h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">Target the specific content gaps identified during your LLM visibility audits.</p>
                <Button variant="outline" className="mt-auto w-full h-11 rounded-xl border-white/10 hover:bg-white/5 transition-colors">Discover Gaps</Button>
            </div>
            <div className="bg-card rounded-[28px] border border-border p-8 flex flex-col items-center text-center group hover:border-yellow-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/5">
                <div className="h-16 w-16 rounded-[20px] bg-yellow-500/10 flex items-center justify-center mb-8 shadow-inner group-hover:-rotate-6 transition-transform">
                    <Wand2 className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 tracking-tight">Mass Deployment</h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">Inject hundreds of optimized entries into your CMS via headless API.</p>
                <Button variant="outline" className="mt-auto w-full h-11 rounded-xl border-white/10 hover:bg-white/5 transition-colors">Setup Integration</Button>
            </div>
        </div>

        <div className="space-y-6 pt-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold tracking-tight">Recent Infrastructure Campaigns</h2>
                <Badge variant="secondary" className="px-4 py-1.5 bg-secondary/50 text-xs font-black uppercase tracking-widest text-[#556987]">0 Active Chains</Badge>
            </div>
            <div className="bg-card rounded-[32px] border border-border p-20 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Globe className="h-20 w-20 text-muted-foreground/10 mx-auto mb-8 transition-transform group-hover:scale-110 duration-700" />
                <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">No SEO campaigns are currently active. Deploy landing pages to dominate semantic search clusters.</p>
                <Button onClick={() => setWizardOpen(true)} variant="link" className="mt-6 text-cyan-400 font-bold hover:text-cyan-300 gap-2 group">
                    Launch your first campaign <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>

        {/* Campaign Wizard Modal */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogContent className="bg-card border-border max-w-xl p-0 overflow-hidden rounded-[32px]">
                <div className="p-8 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-b border-white/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"><Rocket className="h-5 w-5 text-cyan-400" /></div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Campaign Orchestrator</DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground font-medium">Step {step} of 3: Configure your programmatic infrastructure</DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-10 space-y-8 min-h-[300px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Campaign Identity</Label>
                                    <Input placeholder="e.g., Q2 Mid-Market Expansion" className="bg-secondary/50 border-white/5 h-12 text-lg rounded-xl focus:ring-1 focus:ring-cyan-500/50" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Target Cluster</Label>
                                    <select className="w-full h-12 rounded-xl bg-secondary/50 border-white/5 px-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500/50">
                                        <option>Enterprise Content Management</option>
                                        <option>AI Productivity Tools</option>
                                        <option>B2B SaaS Comparisons</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 px-1">Generation Parameters</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5 space-y-2 cursor-pointer hover:border-cyan-500/30 transition-all">
                                        <div className="text-xs font-bold text-foreground">High Volume</div>
                                        <p className="text-[10px] text-muted-foreground">Focus on wide coverage across long-tail keywords.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-secondary/30 border-2 border-cyan-500/40 space-y-2 cursor-pointer shadow-lg shadow-cyan-500/5">
                                        <div className="text-xs font-bold text-cyan-400">Deep Reasoning</div>
                                        <p className="text-[10px] text-muted-foreground">Focus on authority and entity link-building.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                                    <CheckCircle2 className="h-12 w-12 text-cyan-400" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-foreground mb-2">Ready for Lift-off</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed px-4">Sentinel AI will now generate 50 unique, schema-optimized landing pages targeting your chosen cluster.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 bg-secondary/10 flex justify-between items-center border-t border-white/5">
                    <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setWizardOpen(false)} className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("h-1.5 w-4 rounded-full transition-all", step === i ? "bg-cyan-400 w-8" : "bg-white/10")} />
                        ))}
                    </div>
                    {step < 3 ? (
                        <Button onClick={() => setStep(step + 1)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest text-[10px] px-8 rounded-xl h-10 transition-all flex items-center gap-2">
                            Next Stage <ArrowRight className="h-3 w-3" />
                        </Button>
                    ) : (
                        <Button onClick={startCampaign} disabled={isLaunching} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold uppercase tracking-widest text-[10px] px-10 rounded-xl h-10 shadow-lg shadow-cyan-900/40 border-0 flex items-center gap-2">
                            {isLaunching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deploy Chain"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}

