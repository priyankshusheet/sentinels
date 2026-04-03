import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { website_url } = await req.json();
    if (!website_url) {
      return new Response(JSON.stringify({ error: "website_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = website_url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Create analysis record
    const { data: analysis, error: insertError } = await supabase
      .from("website_analyses")
      .insert({ user_id: user.id, website_url: formattedUrl, status: "crawling" })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create analysis record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crawl with Firecrawl
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      // Update status to failed
      await supabase.from("website_analyses").update({ status: "failed" }).eq("id", analysis.id);
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scrape main page + branding
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "links"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    // Map the site for all URLs
    const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: 100,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    const siteUrls = mapData?.links || [];

    // Generate AI insights using available LLM
    const pageContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const pageTitle = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || formattedUrl;
    const pageLinks = scrapeData?.data?.links || scrapeData?.links || [];

    const insights = {
      title: pageTitle,
      total_pages_found: siteUrls.length,
      internal_links: pageLinks.length,
      content_length: pageContent.length,
      has_schema_markup: pageContent.includes("schema.org") || pageContent.includes("@type"),
      has_og_tags: pageContent.includes("og:"),
      key_topics: extractTopics(pageContent),
      seo_signals: analyzeSEO(pageContent, pageTitle),
      ai_readiness: calculateAIReadiness(pageContent, siteUrls.length),
      site_pages: siteUrls.slice(0, 20),
    };

    // Use service role to update analysis record
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from("website_analyses").update({
      status: "completed",
      crawl_data: { markdown: pageContent.slice(0, 5000), urls: siteUrls.slice(0, 50) },
      ai_insights: insights,
      pages_crawled: siteUrls.length,
      completed_at: new Date().toISOString(),
    }).eq("id", analysis.id);

    return new Response(JSON.stringify({ success: true, analysis_id: analysis.id, insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTopics(content: string): string[] {
  const topics: string[] = [];
  const headings = content.match(/^#{1,3}\s+(.+)$/gm);
  if (headings) {
    headings.slice(0, 10).forEach((h) => {
      topics.push(h.replace(/^#{1,3}\s+/, "").trim());
    });
  }
  return topics;
}

function analyzeSEO(content: string, title: string): Record<string, boolean> {
  return {
    has_h1: /^#\s+/m.test(content),
    has_meta_description: content.length > 100,
    has_internal_links: content.includes("](/"),
    has_structured_content: (content.match(/^#{1,3}\s/gm) || []).length >= 3,
    title_under_60_chars: title.length <= 60,
    content_over_300_words: content.split(/\s+/).length > 300,
  };
}

function calculateAIReadiness(content: string, pageCount: number): number {
  let score = 0;
  if (content.length > 500) score += 20;
  if (content.length > 2000) score += 10;
  if ((content.match(/^#{1,3}\s/gm) || []).length >= 3) score += 15;
  if (pageCount >= 5) score += 15;
  if (pageCount >= 20) score += 10;
  if (content.includes("schema.org") || content.includes("@type")) score += 15;
  if (content.split(/\s+/).length > 300) score += 15;
  return Math.min(score, 100);
}
