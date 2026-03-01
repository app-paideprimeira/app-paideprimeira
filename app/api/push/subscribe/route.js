// app/api/push/subscribe/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription?.endpoint) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;

    // Upsert — atualiza se já existe o mesmo endpoint
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id:  userId,
          endpoint: endpoint,
          p256dh:   keys.p256dh,
          auth:     keys.auth,
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Erro ao salvar subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Marca push como ativo no profile
    await supabase
      .from("profiles")
      .update({ push_enabled: true, push_prompt_shown: true })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro na route subscribe:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}