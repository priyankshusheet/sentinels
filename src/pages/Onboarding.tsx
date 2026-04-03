import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, Building2, Globe, Users, Target, Zap,
  ShoppingCart, GraduationCap, Heart, CheckCircle, Loader2, Info,
  Plus, ExternalLink, Briefcase, BarChart3, Megaphone, MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/ui/Logo";

const industries = [
  { id: "saas", name: "SaaS", icon: Zap, description: "Software & Cloud" },
  { id: "ecommerce", name: "E-commerce", icon: ShoppingCart, description: "Online Retail" },
  { id: "edtech", name: "EdTech", icon: GraduationCap, description: "Education & Training" },
  { id: "healthtech", name: "HealthTech", icon: Heart, description: "Health & Wellness" },
];

const llms = [
  { id: "chatgpt", name: "ChatGPT", description: "OpenAI" },
  { id: "claude", name: "Claude", description: "Anthropic" },
  { id: "gemini", name: "Gemini", description: "Google" },
  { id: "perplexity", name: "Perplexity", description: "Perplexity AI" },
];

const goals = [
  { id: "visibility", name: "Brand Visibility", description: "Get mentioned more by AI assistants", icon: Megaphone },
  { id: "leads", name: "Lead Generation", description: "Drive qualified traffic from AI search", icon: MousePointerClick },
  { id: "revenue", name: "Revenue Growth", description: "Increase conversions from AI channels", icon: BarChart3 },
  { id: "actions", name: "AI Agent Actions", description: "Enable bookings & purchases via AI", icon: Briefcase },
];

const businessConnections = [
  { id: "google_business", name: "Google Business Profile", description: "Connect your GBP to track local AI visibility", icon: Globe, platform: "google_business" },
];

const TOTAL_STEPS = 6;

const stepTitles = [
  "Select Your Industry",
  "Your Website",
  "Competitors",
  "AI Platforms to Monitor",
  "Your Goals",
  "Connect Business Platforms",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [brandUrl, setBrandUrl] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>(["chatgpt", "claude"]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["visibility"]);
  const [connectedServices, setConnectedServices] = useState<string[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const nextStep = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Final step — save everything
    if (!user) { navigate("/login"); return; }
    setSaving(true);

    try {
      await supabase.from("profiles").update({
        industry: selectedIndustry,
        website_url: brandUrl,
        selected_llms: selectedLLMs,
        goals: selectedGoals,
        onboarding_completed: true,
      }).eq("user_id", user.id);

      const validComps = competitors.filter(c => c.trim());
      if (validComps.length > 0) {
        await supabase.from("competitors").insert(
          validComps.map(c => ({
            user_id: user.id,
            name: new URL(c.startsWith("http") ? c : `https://${c}`).hostname.replace("www.", ""),
            domain: c.trim(),
          }))
        );
      }

      // Background website crawl
      if (brandUrl.trim()) {
        supabase.functions.invoke("crawl-website", {
          body: { website_url: brandUrl },
        }).catch(err => console.error("Background crawl failed:", err));
      }

      toast.success("Setup complete! Welcome to Sentinel AI.");
      navigate("/dashboard");
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); };
  const toggleLLM = (id: string) => setSelectedLLMs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleGoal = (id: string) => setSelectedGoals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const addCompetitor = () => { if (competitors.length < 5) setCompetitors([...competitors, ""]); };

  const toggleConnection = async (platformId: string) => {
    if (connectedServices.includes(platformId)) {
      setConnectedServices(prev => prev.filter(x => x !== platformId));
      return;
    }

    setConnectingPlatform(platformId);
    try {
      const { data, error } = await supabase.functions.invoke("oauth-connect", {
        body: { action: "get_auth_url", platform: platformId },
      });

      if (error || data?.setup_required) {
        toast.error(data?.message || "OAuth not configured. Contact support.");
        setConnectingPlatform(null);
        return;
      }

      if (data?.auth_url) {
        const callbackUri = data.callback_uri;
        const popup = window.open(data.auth_url, "oauth_popup", "width=600,height=700,scrollbars=yes");

        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === "oauth_callback") {
            window.removeEventListener("message", handleMessage);
            const { code } = event.data;

            const { data: exchangeData, error: exchangeError } = await supabase.functions.invoke("oauth-connect", {
              body: { action: "exchange_code", platform: platformId, code, redirect_uri: callbackUri },
            });

            if (exchangeError) {
              toast.error("Failed to connect. Please try again.");
            } else {
              setConnectedServices(prev => [...prev, platformId]);
              toast.success(`${exchangeData?.account_name || "Account"} connected!`);
            }
            setConnectingPlatform(null);
          } else if (event.data?.type === "oauth_error") {
            window.removeEventListener("message", handleMessage);
            toast.error("Connection was cancelled or failed.");
            setConnectingPlatform(null);
          }
        };

        window.addEventListener("message", handleMessage);
        setTimeout(() => {
          window.removeEventListener("message", handleMessage);
          if (connectingPlatform === platformId) setConnectingPlatform(null);
        }, 120000);
      }
    } catch (err) {
      console.error("OAuth error:", err);
      toast.error("Failed to initiate connection.");
      setConnectingPlatform(null);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!selectedIndustry;
    if (step === 4) return selectedLLMs.length > 0;
    if (step === 5) return selectedGoals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <span className="text-xs text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-semibold text-foreground">{stepTitles[step - 1]}</h1>
              <span className="text-xs text-muted-foreground font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step content */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-sm min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Choose your industry so we can tailor AI visibility tracking to your market.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {industries.map((industry) => (
                        <button
                          key={industry.id}
                          onClick={() => setSelectedIndustry(industry.id)}
                          className={cn(
                            "relative p-5 rounded-xl border transition-all text-left",
                            selectedIndustry === industry.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-secondary/30 hover:border-primary/30"
                          )}
                        >
                          <industry.icon className={cn("h-6 w-6 mb-3", selectedIndustry === industry.id ? "text-primary" : "text-muted-foreground")} />
                          <h3 className="font-semibold text-sm text-foreground">{industry.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{industry.description}</p>
                          {selectedIndustry === industry.id && <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Enter your website URL. We'll analyze it to establish your baseline AI visibility and SEO signals.</p>
                    <div className="space-y-3">
                      <Label htmlFor="url" className="text-sm font-medium">Website URL</Label>
                      <Input
                        id="url"
                        value={brandUrl}
                        onChange={(e) => setBrandUrl(e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="h-12"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our AI will crawl your site to identify content structure, schema markup, and topic coverage for visibility optimization.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Add competitor domains to benchmark your AI visibility against them.</p>
                    <div className="space-y-3">
                      {competitors.map((comp, index) => (
                        <div key={index} className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={comp}
                            onChange={(e) => { const n = [...competitors]; n[index] = e.target.value; setCompetitors(n); }}
                            placeholder={`competitor${index + 1}.com`}
                            className="pl-10 h-11"
                          />
                        </div>
                      ))}
                      {competitors.length < 5 && (
                        <Button variant="outline" onClick={addCompetitor} className="w-full gap-2">
                          <Plus className="h-4 w-4" /> Add Competitor
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Select which AI platforms you want to monitor for brand visibility.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {llms.map((llm) => (
                        <button
                          key={llm.id}
                          onClick={() => toggleLLM(llm.id)}
                          className={cn(
                            "relative p-4 rounded-xl border transition-all text-left",
                            selectedLLMs.includes(llm.id)
                              ? "border-primary bg-primary/5"
                              : "border-border bg-secondary/30 hover:border-primary/30"
                          )}
                        >
                          <h3 className="font-semibold text-sm text-foreground">{llm.name}</h3>
                          <p className="text-xs text-muted-foreground">{llm.description}</p>
                          {selectedLLMs.includes(llm.id) && <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">What are your primary goals? We'll prioritize insights that matter most.</p>
                    <div className="space-y-3">
                      {goals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={cn(
                            "w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4",
                            selectedGoals.includes(goal.id)
                              ? "border-primary bg-primary/5"
                              : "border-border bg-secondary/30 hover:border-primary/30"
                          )}
                        >
                          <goal.icon className={cn("h-5 w-5 shrink-0", selectedGoals.includes(goal.id) ? "text-primary" : "text-muted-foreground")} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-foreground">{goal.name}</h3>
                            <p className="text-xs text-muted-foreground">{goal.description}</p>
                          </div>
                          {selectedGoals.includes(goal.id) && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Connect your business platforms to enrich visibility data. You can skip this and connect later from Settings.</p>
                    <div className="space-y-3">
                      {businessConnections.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => toggleConnection(service.id)}
                          disabled={connectingPlatform === service.id}
                          className={cn(
                            "w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between",
                            connectedServices.includes(service.id)
                              ? "border-primary bg-primary/5"
                              : "border-border bg-secondary/30 hover:border-primary/30",
                            connectingPlatform === service.id && "opacity-70 cursor-wait"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <service.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{service.name}</h3>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                          {connectingPlatform === service.id ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                          ) : connectedServices.includes(service.id) ? (
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={saving || !canProceed()}
              className="gap-2 min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up...
                </>
              ) : step === TOTAL_STEPS ? (
                <>
                  Complete Setup <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
