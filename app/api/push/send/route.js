// app/api/push/send/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Verifica se é admin (localhost ou JWT + is_admin) ─────────
async function verificaAdmin(request) {
  const host = request.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) return true;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return false;

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}

export async function POST(req) {
  // ── Bloqueia acesso não autorizado ────────────────────────
  const admin = await verificaAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { userId, title, body, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "title e body são obrigatórios" }, { status: 400 });
    }

    // Sanitiza tamanho dos campos
    if (title.length > 100 || body.length > 300) {
      return NextResponse.json({ error: "title ou body muito longos" }, { status: 400 });
    }

    // Busca subscriptions — de um usuário específico ou de todos
    let query = supabase.from("push_subscriptions").select("*");
    if (userId) query = query.eq("user_id", userId);

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions?.length) {
      return NextResponse.json({ error: "Nenhuma subscription encontrada" }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          return { ok: true, endpoint: sub.endpoint };
        } catch (err) {
          // Remove subscriptions inválidas (410 = expirada)
          if (err.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { ok: false, endpoint: sub.endpoint, error: err.message };
        }
      })
    );

    const sent   = results.filter(r => r.value?.ok).length;
    const failed = results.filter(r => !r.value?.ok).length;

    await supabase.from("push_notifications").insert({
      user_id:    userId || null,
      endpoint:   "broadcast",
      user_agent: `Sent: ${sent}, Failed: ${failed}`,
      platform:   "web",
      enabled:    true,
    });

    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    console.error("Erro na route send:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}