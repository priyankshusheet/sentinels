import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Printer, TrendingUp, Eye, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportData {
  period: string;
  brandName: string;
  visibilityScore: number;
  visibilityDelta: number;
  citationCount: number;
  promptsCovered: number;
  sentimentScore: number;
  topPlatform: string;
}

interface ReportGeneratorProps {
  data?: ReportData;
}

const defaultData: ReportData = {
  period: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  brandName: "Your Brand",
  visibilityScore: 78,
  visibilityDelta: 5.2,
  citationCount: 487,
  promptsCovered: 24,
  sentimentScore: 72,
  topPlatform: "ChatGPT",
};

export function ReportGenerator({ data = defaultData }: ReportGeneratorProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContents = reportRef.current.innerHTML;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AEO Report – ${data.period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', system-ui, sans-serif; background: white; color: #111827; padding: 40px; }
            .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #6366f1; }
            .report-title { font-size: 28px; font-weight: 800; color: #111827; }
            .report-subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
            .sentinel-brand { font-size: 14px; font-weight: 600; color: #6366f1; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
            .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
            .metric-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .metric-value { font-size: 32px; font-weight: 800; color: #111827; }
            .metric-delta { font-size: 13px; font-weight: 500; margin-top: 4px; }
            .positive { color: #059669; }
            .section-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #111827; border-left: 4px solid #6366f1; padding-left: 12px; }
            .recs { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .rec-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; }
            .rec-item:last-child { border-bottom: none; }
            .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div>
              <div class="report-title">AEO Performance Report</div>
              <div class="report-subtitle">${data.period} · ${data.brandName}</div>
            </div>
            <div class="sentinel-brand">🛡️ Sentinel AI</div>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">AI Visibility Score</div>
              <div class="metric-value">${data.visibilityScore}%</div>
              <div class="metric-delta positive">+${data.visibilityDelta}% this month</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Citations</div>
              <div class="metric-value">${data.citationCount}</div>
              <div class="metric-delta" style="color:#6b7280">Across all platforms</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Prompts Covered</div>
              <div class="metric-value">${data.promptsCovered}</div>
              <div class="metric-delta" style="color:#6b7280">Top LLM: ${data.topPlatform}</div>
            </div>
          </div>
          <div class="section-title">Executive Summary</div>
          <div class="recs">
            <p style="font-size:14px;color:#374151;line-height:1.7">
              Your brand achieved a <strong>${data.visibilityScore}% AI visibility score</strong> in ${data.period}, 
              representing a <strong>+${data.visibilityDelta}% improvement</strong> vs. the prior month. 
              You were cited <strong>${data.citationCount} times</strong> across tracked AI platforms, 
              with <strong>${data.sentimentScore}% positive sentiment</strong>. 
              <strong>${data.topPlatform}</strong> remains the highest-traffic source of brand mentions.
            </p>
          </div>
          <div class="section-title">Top Recommendations for Next Month</div>
          <div class="recs">
            <div class="rec-item">1. 🔍 Create comparison pages for your top 3 competitors to close the 47-point visibility gap</div>
            <div class="rec-item">2. 📝 Add FAQ schema markup to your pricing and features pages</div>
            <div class="rec-item">3. 🔗 Increase citations on G2/Capterra by requesting reviews from recent customers</div>
            <div class="rec-item">4. 📊 Expand prompt tracking from ${data.promptsCovered} to 50+ queries for fuller coverage</div>
          </div>
          <div class="footer">Generated by Sentinel AI · ${new Date().toLocaleDateString()} · Confidential</div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Monthly AEO Report</h3>
          <p className="text-sm text-muted-foreground">{data.period} performance summary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div ref={reportRef} className="space-y-4 p-4 bg-secondary/20 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">AEO Performance Report</h2>
            <p className="text-sm text-muted-foreground">{data.period} · {data.brandName}</p>
          </div>
          <span className="text-primary font-semibold text-sm">🛡️ Sentinel AI</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "AI Visibility", value: `${data.visibilityScore}%`, delta: `+${data.visibilityDelta}%`, icon: Eye, positive: true },
            { label: "Citations", value: data.citationCount, delta: "all platforms", icon: FileText, positive: false },
            { label: "Prompts Covered", value: data.promptsCovered, delta: `Top: ${data.topPlatform}`, icon: BarChart3, positive: false },
          ].map(m => (
            <motion.div key={m.label} className="bg-card rounded-xl p-4 border border-border" whileHover={{ scale: 1.01 }}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <m.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className={`text-xs mt-0.5 ${m.positive ? "text-success" : "text-muted-foreground"}`}>{m.delta}</p>
            </motion.div>
          ))}
        </div>

        <div className="p-3 bg-card rounded-xl border border-border text-sm text-muted-foreground leading-relaxed">
          Your brand achieved a <strong className="text-foreground">{data.visibilityScore}% AI visibility score</strong> in {data.period},
          representing a <strong className="text-success">+{data.visibilityDelta}% improvement</strong> vs. the prior month.
          You were cited <strong className="text-foreground">{data.citationCount} times</strong> across tracked AI platforms.
        </div>
      </div>
    </div>
  );
}
