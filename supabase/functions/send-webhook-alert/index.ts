import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { webhook_url, alert_type, title, message, severity, platform } = await req.json();

    if (!webhook_url || !title) {
      return new Response(JSON.stringify({ error: "webhook_url and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const severityEmoji: Record<string, string> = {
      critical: "🚨",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅",
    };

    const emoji = severityEmoji[severity] || "📢";
    const isDiscord = webhook_url.includes("discord.com") || webhook_url.includes("discordapp.com");

    let body: string;

    if (isDiscord) {
      // Discord webhook format
      body = JSON.stringify({
        embeds: [{
          title: `${emoji} ${title}`,
          description: message || "No additional details.",
          color: severity === "critical" ? 0xff4444 : severity === "warning" ? 0xffaa00 : severity === "success" ? 0x44ff44 : 0x4488ff,
          fields: [
            { name: "Type", value: alert_type || "general", inline: true },
            { name: "Severity", value: severity || "info", inline: true },
            ...(platform ? [{ name: "Platform", value: platform, inline: true }] : []),
          ],
          footer: { text: "Sentinel AI Alerts" },
          timestamp: new Date().toISOString(),
        }],
      });
    } else {
      // Slack webhook format
      body = JSON.stringify({
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: `${emoji} ${title}`, emoji: true },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: message || "_No additional details._" },
          },
          {
            type: "context",
            elements: [
              { type: "mrkdwn", text: `*Type:* ${alert_type || "general"} | *Severity:* ${severity || "info"}${platform ? ` | *Platform:* ${platform}` : ""}` },
            ],
          },
          { type: "divider" },
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: "Sent from *Sentinel AI* 🛡️" }],
          },
        ],
      });
    }

    const webhookResponse = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook delivery failed:", webhookResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Webhook failed: ${webhookResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-webhook-alert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
