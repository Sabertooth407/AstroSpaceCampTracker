import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { title, body } = await req.json();

  const SUPABASE_URL = "https://oclwbllfeslheerxhzbv.supabase.co";
  const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbHdibGxmZXNsaGVlcnhoemJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODMyNCwiZXhwIjoyMDkxNjM0MzI0fQ.RuJ1NnNbmbFrRQksj2dnRnQe7p_IUCMlWMrbe97zgtw";

  const tokensRes = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
    headers: {
      "apikey": SERVICE_ROLE,
      "Authorization": `Bearer ${SERVICE_ROLE}`
    }
  });

  const tokens = await tokensRes.json();

  for (const t of tokens) {
    try {
      const sub = JSON.parse(t.token);

      await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          body
        })
      });

    } catch (e) {
      console.log("Push failed", e);
    }
  }

  return new Response("Done");
});