import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIRequest {
  messages: AIMessage[];
  tools?: any[];
  tool_choice?: any;
  use_case?: string; // "analysis" | "generation" | "suggestion" | "followup"
}

interface ProviderResult {
  provider: string;
  content: string;
  raw?: any;
}

// Provider 1: Gemini AI Gateway
async function callGeminiAI(messages: AIMessage[], tools?: any[], toolChoice?: any): Promise<ProviderResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch("https://ai.gateway.gemini.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Gemini AI error ${response.status}: ${t}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    return { provider: "gemini", content: toolCall.function.arguments, raw: result };
  }
  return { provider: "gemini", content: result.choices?.[0]?.message?.content || "", raw: result };
}

// Provider 2: Google Gemini Direct
async function callGeminiDirect(messages: AIMessage[]): Promise<ProviderResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemMsg = messages.find(m => m.role === "system")?.content || "";
  const userMsg = messages.find(m => m.role === "user")?.content || "";
  const fullPrompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Gemini Direct error ${response.status}: ${t}`);
  }

  const result = await response.json();
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { provider: "gemini-direct", content, raw: result };
}

// Provider 3: OpenRouter (access to many models)
async function callOpenRouter(messages: AIMessage[]): Promise<ProviderResult> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sentinel-ai.app",
      "X-Title": "Sentinel AI",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-exp:free",
      messages,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${t}`);
  }

  const result = await response.json();
  return { provider: "openrouter", content: result.choices?.[0]?.message?.content || "", raw: result };
}

// Provider 4: Groq (fast inference)
async function callGroq(messages: AIMessage[]): Promise<ProviderResult> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Groq error ${response.status}: ${t}`);
  }

  const result = await response.json();
  return { provider: "groq", content: result.choices?.[0]?.message?.content || "", raw: result };
}

// Provider 5: Cohere
async function callCohere(messages: AIMessage[]): Promise<ProviderResult> {
  const COHERE_API_KEY = Deno.env.get("COHERE_API_KEY");
  if (!COHERE_API_KEY) throw new Error("COHERE_API_KEY not configured");

  const systemMsg = messages.find(m => m.role === "system")?.content;
  const chatHistory = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "user" ? "USER" : "CHATBOT", message: m.content }));
  
  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";

  const response = await fetch("https://api.cohere.com/v1/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "command-r-plus",
      message: lastUserMsg,
      preamble: systemMsg || undefined,
      chat_history: chatHistory.slice(0, -1),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Cohere error ${response.status}: ${t}`);
  }

  const result = await response.json();
  return { provider: "cohere", content: result.text || "", raw: result };
}

// Fallback chain: tries providers in order until one succeeds
async function callWithFallback(
  messages: AIMessage[],
  tools?: any[],
  toolChoice?: any
): Promise<ProviderResult> {
  const providers = [
    { name: "Gemini AI", fn: () => callGeminiAI(messages, tools, toolChoice) },
    { name: "Gemini Direct", fn: () => callGeminiDirect(messages) },
    { name: "OpenRouter", fn: () => callOpenRouter(messages) },
    { name: "Groq", fn: () => callGroq(messages) },
    { name: "Cohere", fn: () => callCohere(messages) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`Trying provider: ${provider.name}`);
      const result = await provider.fn();
      console.log(`Success with provider: ${provider.name}`);
      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error(`Provider ${provider.name} failed: ${errMsg}`);
      errors.push(`${provider.name}: ${errMsg}`);
    }
  }

  throw new Error(`All AI providers failed. Errors:\n${errors.join("\n")}`);
}

// Parallel call to multiple providers
async function callParallel(messages: AIMessage[]): Promise<ProviderResult[]> {
  const providers = [
    { name: "Gemini AI", fn: () => callGeminiAI(messages) },
    { name: "Groq", fn: () => callGroq(messages) },
    { name: "OpenRouter", fn: () => callOpenRouter(messages) },
  ];

  const results = await Promise.allSettled(providers.map(p => p.fn()));
  const successes: ProviderResult[] = [];

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "fulfilled") {
      successes.push((results[i] as PromiseFulfilledResult<ProviderResult>).value);
    } else {
      console.error(`Parallel provider ${providers[i].name} failed:`, (results[i] as PromiseRejectedResult).reason);
    }
  }

  if (successes.length === 0) throw new Error("All parallel providers failed");
  return successes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, tools, tool_choice, parallel = false } = await req.json() as AIRequest & { parallel?: boolean };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    if (parallel) {
      const results = await callParallel(messages);
      result = { success: true, parallel: true, results };
    } else {
      const singleResult = await callWithFallback(messages, tools, tool_choice);
      result = { success: true, ...singleResult };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-fallback error:", e);

    const errMsg = e instanceof Error ? e.message : "Unknown error";
    const status = errMsg.includes("Rate limit") || errMsg.includes("429") ? 429
      : errMsg.includes("402") ? 402 : 500;

    return new Response(JSON.stringify({ error: errMsg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
