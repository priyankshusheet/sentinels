const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Build the frontend origin from the state or fallback
  let frontendOrigin = "*";
  
  if (error) {
    return new Response(
      `<!DOCTYPE html><html><body><script>
        window.opener.postMessage({type:'oauth_error',error:'${error.replace(/'/g, "\\'")}'},'*');
        window.close();
      </script><p>Connection failed. You can close this window.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code || !state) {
    return new Response(
      `<!DOCTYPE html><html><body><script>
        window.opener.postMessage({type:'oauth_error',error:'missing_params'},'*');
        window.close();
      </script><p>Missing parameters. You can close this window.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Safely pass code and state back to the opener
  return new Response(
    `<!DOCTYPE html><html><body><script>
      try {
        window.opener.postMessage({
          type: 'oauth_callback',
          code: ${JSON.stringify(code)},
          state: ${JSON.stringify(state)}
        }, '*');
      } catch(e) {
        document.body.innerHTML = '<p>Connected! You can close this window.</p>';
      }
      setTimeout(function() { window.close(); }, 1000);
    </script><p>Completing connection... This window will close automatically.</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
});
