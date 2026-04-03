import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Bell, Webhook, Send, CheckCircle, Zap, Puzzle, Copy, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReportGenerator } from "@/components/reports/ReportGenerator";

const ALERT_THRESHOLDS = [
  { id: "visibility_drop", label: "Visibility Drop Alert", description: "Notify when visibility drops >10% in 24h" },
  { id: "competitor_gain", label: "Competitor Overtake", description: "Alert when a competitor surpasses your ranking" },
  { id: "new_citation", label: "New Citation Detected", description: "Notify when your brand is newly cited" },
  { id: "weekly_summary", label: "Weekly Digest", description: "Send weekly AEO performance summary" },
];

export default function Settings() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [alertToggles, setAlertToggles] = useState<Record<string, boolean>>({
    visibility_drop: true,
    competitor_gain: true,
    new_citation: false,
    weekly_summary: true,
  });
  
  const [profile, setProfile] = useState({
    company_name: "",
    website_url: "",
    industry: "",
    selected_llms: ["ChatGPT", "Claude", "Gemini", "Perplexity"]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile + alert prefs + webhook on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile({
          company_name: data.company_name || "",
          website_url: data.website_url || "",
          industry: data.industry || "",
          selected_llms: data.selected_llms || ["ChatGPT", "Claude", "Gemini", "Perplexity"]
        });
        // Load persisted webhook and alert preferences
        const rawData = data as any;
        if (rawData.webhook_url) setWebhookUrl(rawData.webhook_url);
        if (rawData.alert_preferences) {
          setAlertToggles(prev => ({ ...prev, ...rawData.alert_preferences }));
        }
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: profile.company_name,
          website_url: profile.website_url,
          industry: profile.industry,
          selected_llms: profile.selected_llms,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAlertPreferences = async (newToggles: Record<string, boolean>, newWebhookUrl?: string) => {
    if (!user) return;
    setIsSavingAlerts(true);
    try {
      const updatePayload: any = {
        alert_preferences: newToggles,
        updated_at: new Date().toISOString()
      };
      if (newWebhookUrl !== undefined) {
        updatePayload.webhook_url = newWebhookUrl;
      }
      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Alert preferences saved!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingAlerts(false);
    }
  };

  const handleAlertToggle = (alertId: string) => {
    const newToggles = { ...alertToggles, [alertId]: !alertToggles[alertId] };
    setAlertToggles(newToggles);
    saveAlertPreferences(newToggles);
  };

  const saveWebhookUrl = () => {
    saveAlertPreferences(alertToggles, webhookUrl);
  };

  const testWebhook = async () => {
    if (!webhookUrl.trim()) { toast.error("Please enter a webhook URL first"); return; }
    setTestingWebhook(true);
    try {
      const { error } = await supabase.functions.invoke("send-webhook-alert", {
        body: {
          webhook_url: webhookUrl,
          alert_type: "test",
          title: "Sentinel AI – Webhook Test",
          message: "✅ Your webhook is configured correctly! You'll receive alerts here for critical AI visibility events.",
          severity: "info",
        }
      });
      if (error) throw error;
      // Also persist the webhook URL
      await saveAlertPreferences(alertToggles, webhookUrl);
      toast.success("Test alert sent and webhook saved!");
    } catch (e: any) {
      toast.error("Webhook test failed: " + e.message);
    } finally {
      setTestingWebhook(false);
    }
  };

  const exportData = async (type: string) => {
    if (!user) return;
    try {
      let csvContent = "";
      
      if (type === "prompts") {
        const { data } = await supabase.from("tracked_prompts").select("*").eq("user_id", user.id);
        if (!data || data.length === 0) { toast.error("No data to export"); return; }
        csvContent = "ID,Query,Category,Active,Created At\n" +
          data.map(p => `"${p.id}","${p.query}","${p.category}","${p.is_active}","${p.created_at}"`).join("\n");
      } else if (type === "citations") {
        const { data } = await supabase.from("citations").select("*").eq("user_id", user.id);
        if (!data || data.length === 0) { toast.error("No data to export"); return; }
        csvContent = "Source,URL,Sentiment,Authority,Mentions,Domain\n" +
          data.map(c => `"${c.source_name}","${c.source_url}","${c.sentiment}","${c.authority_score}","${c.mention_count}","${c.domain}"`).join("\n");
      } else if (type === "rankings") {
        const { data } = await supabase.from("prompt_rankings").select("*, tracked_prompts(query)").eq("user_id", user.id);
        if (!data || data.length === 0) { toast.error("No data to export"); return; }
        csvContent = "Date,Query,Platform,Visibility,Score,Citations\n" +
          data.map((r: any) => `"${r.checked_at}","${r.tracked_prompts?.query || ''}","${r.llm_platform}","${r.visibility}","${r.confidence_score}","${r.citations_found}"`).join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} data exported!`);
    } catch (e: any) {
      toast.error("Export failed: " + e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl py-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure alerts, integrations, and report exports</p>
        </div>

        {/* Profile Information */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Manage your brand and company details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={profile.company_name}
                onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
                placeholder="Acme Corp"
                className="bg-secondary/50 border-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={profile.website_url}
                onChange={e => setProfile(p => ({ ...p, website_url: e.target.value }))}
                placeholder="https://acme.com"
                className="bg-secondary/50 border-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <select 
                value={profile.industry}
                onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}
                className="w-full h-10 rounded-md bg-secondary/50 border-white/5 px-3 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="">Select Industry</option>
                <option value="SaaS">SaaS</option>
                <option value="FinTech">FinTech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target LLMs</Label>
              <div className="flex flex-wrap gap-2">
                {["ChatGPT", "Claude", "Gemini", "Perplexity"].map(llm => (
                  <button
                    key={llm}
                    onClick={() => setProfile(p => ({
                      ...p,
                      selected_llms: p.selected_llms.includes(llm) 
                        ? p.selected_llms.filter(l => l !== llm)
                        : [...p.selected_llms, llm]
                    }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      profile.selected_llms.includes(llm) ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {llm}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold" onClick={saveProfile} disabled={isSaving}>
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </section>

        {/* Data Export */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Data Export</h2>
              <p className="text-sm text-muted-foreground">Export your data as CSV files</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="gap-2" onClick={() => exportData("prompts")}>
              <Download className="h-4 w-4" /> Prompts
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => exportData("citations")}>
              <Download className="h-4 w-4" /> Citations
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => exportData("rankings")}>
              <Download className="h-4 w-4" /> Rankings
            </Button>
          </div>
        </section>

        {/* Webhook Integration */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Webhook Alerts</h2>
              <p className="text-sm text-muted-foreground">Connect Slack, Discord, or any custom endpoint</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..."
                className="bg-secondary/50 border-white/5 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveWebhookUrl} variant="outline" className="gap-2 border-white/10 hover:bg-secondary">
                Save URL
              </Button>
              <Button onClick={testWebhook} disabled={testingWebhook} variant="outline" className="gap-2 border-white/10 hover:bg-secondary">
                <Send className="h-4 w-4" />
                {testingWebhook ? "Sending..." : "Test Connection"}
              </Button>
            </div>
          </div>
        </section>

        {/* Alert Preferences */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Alert Preferences</h2>
              <p className="text-sm text-muted-foreground">Choose which events trigger notifications (auto-saved)</p>
            </div>
          </div>
          <div className="space-y-3">
            {ALERT_THRESHOLDS.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3">
                  <Zap className={`h-4 w-4 ${alertToggles[alert.id] ? "text-cyan-400" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.label}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAlertToggle(alert.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${alertToggles[alert.id] ? "bg-cyan-500" : "bg-muted"}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${alertToggles[alert.id] ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <ReportGenerator />
        </section>
      </div>
    </DashboardLayout>
  );
}
