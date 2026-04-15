// app/api/push/subscribe/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── Rate limit simples em memória ─────────────────────────────
const rateMap = new Map();
const RATE_LIMIT = 10;       // máximo de chamadas
const RATE_WINDOW = 60_000;  // por minuto

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  rateMap.set(ip, entry);
  return true;
}

export async function POST(req) {
  try {
    // ── Rate limit por IP ──────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
    }

    // ── Valida token JWT — ignora userId do body ───────────────
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // ── Usa userId do token — nunca do body ────────────────────
    const userId = user.id;

    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;

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