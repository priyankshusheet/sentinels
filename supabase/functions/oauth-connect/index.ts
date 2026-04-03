import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OAUTH_CONFIGS: Record<string, { authUrl: string; tokenUrl: string; scopes: string[]; envPrefix: string }> = {
  google_business: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    envPrefix: "GOOGLE_BUSINESS",
  },
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

    const { action, platform, code, redirect_uri } = await req.json();

    if (!platform || !OAUTH_CONFIGS[platform]) {
      return new Response(
        JSON.stringify({ error: "Invalid platform. Supported: google_business" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = OAUTH_CONFIGS[platform];
    const clientId = Deno.env.get(`${config.envPrefix}_CLIENT_ID`);
    const clientSecret = Deno.env.get(`${config.envPrefix}_CLIENT_SECRET`);

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          error: `${platform} OAuth not configured`,
          setup_required: true,
          message: `Please add ${config.envPrefix}_CLIENT_ID and ${config.envPrefix}_CLIENT_SECRET to your Supabase Edge Function secrets.`,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_auth_url") {
      const state = btoa(JSON.stringify({ user_id: user.id, platform }));
      
      // Use the Supabase function URL as the redirect URI for the OAuth callback
      const callbackUri = `${supabaseUrl}/functions/v1/oauth-callback`;
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUri,
        response_type: "code",
        scope: config.scopes.join(" "),
        state,
        access_type: "offline",
        prompt: "consent",
      });

      return new Response(
        JSON.stringify({ auth_url: `${config.authUrl}?${params.toString()}`, callback_uri: callbackUri }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange_code") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "code is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const callbackUri = redirect_uri || `${supabaseUrl}/functions/v1/oauth-callback`;

      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUri,
        grant_type: "authorization_code",
      });

      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", tokenData);
        return new Response(
          JSON.stringify({ error: "Token exchange failed", details: tokenData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store connection using service role
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Get user profile info from Google
      let accountName = null;
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          accountName = profile.name || profile.email;
        }
      } catch (e) {
        console.error("Failed to fetch Google profile:", e);
      }

      await adminClient.from("business_connections").upsert({
        user_id: user.id,
        platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
        scopes: config.scopes,
        is_active: true,
        connected_at: new Date().toISOString(),
        platform_account_name: accountName,
      }, { onConflict: "user_id,platform" });

      return new Response(
        JSON.stringify({ success: true, platform, account_name: accountName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_status") {
      const { data: connections } = await supabase
        .from("business_connections")
        .select("platform, is_active, platform_account_name, connected_at")
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ connections: connections || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      
      await adminClient.from("business_connections")
        .update({ is_active: false, access_token: null, refresh_token: null })
        .eq("user_id", user.id)
        .eq("platform", platform);

      return new Response(
        JSON.stringify({ success: true, platform }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Supported: get_auth_url, exchange_code, check_status, disconnect" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
