import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";

serve(async (_req) => {
  try {
    // ENV
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT =
      Deno.env.get("VAPID_SUBJECT") ||
      "mailto:app.paideprimeira@gmail.com";

    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !VAPID_PUBLIC_KEY ||
      !VAPID_PRIVATE_KEY
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing environment variables",
        }),
        { status: 500 }
      );
    }

    // Configura web-push
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // 🔥 TESTE SIMPLES (por enquanto)
    return new Response(
      JSON.stringify({
        ok: true,
        message: "send-push-notifications funcionando 🚀",
        time: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unhandled error",
        details: String(error),
      }),
      { status: 500 }
    );
  }
});
