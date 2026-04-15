// app/api/webhook/mercadopago/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_DURATION_DAYS = {
  mensal:     30,
  trimestral: 90,
  jornada:    670,
};

// ── Valida assinatura do Mercado Pago ─────────────────────────
function validateSignature(req) {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("⚠️  MP_WEBHOOK_SECRET não configurado — validação ignorada");
      return true;
    }

    const xSignature = req.headers.get("x-signature") || "";
    const xRequestId = req.headers.get("x-request-id") || "";
    const urlParams  = new URL(req.url).searchParams;
    const dataId     = urlParams.get("data.id") || "";

    const parts = {};
    xSignature.split(",").forEach(part => {
      const [key, value] = part.trim().split("=");
      if (key && value) parts[key] = value;
    });

    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hash = createHmac("sha256", secret).update(template).digest("hex");

    return hash === v1;
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    // ── Valida assinatura antes de qualquer coisa ─────────────
    if (!validateSignature(req)) {
      console.error("❌ Assinatura do webhook inválida");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const body = await req.json();

    const topic = body.type || body.topic;
    if (topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id || body.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!paymentRes.ok) {
      console.error("Erro ao buscar pagamento:", paymentId);
      return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 });
    }

    const payment = await paymentRes.json();

    if (payment.status !== "approved") {
      console.log("Pagamento não aprovado:", payment.status);
      return NextResponse.json({ ok: true });
    }

    const [userId, planId, cupomCodigo] = (payment.external_reference || "").split("|");
    if (!userId || !planId) {
      console.error("external_reference inválido:", payment.external_reference);
      return NextResponse.json({ error: "Referência inválida" }, { status: 400 });
    }

    // ── Valida se o plano é legítimo ──────────────────────────
    if (!PLAN_DURATION_DAYS[planId]) {
      console.error("Plano inválido:", planId);
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_week, premium_activated_at")
      .eq("id", userId)
      .single();

    if (!profile) {
      console.error("Usuário não encontrado:", userId);
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const currentWeek      = profile.current_week ?? 1;
    const premiumSinceWeek = Math.max(1, currentWeek - 2);
    const expiresAt        = new Date();
    expiresAt.setDate(expiresAt.getDate() + PLAN_DURATION_DAYS[planId]);

    // Só salva premium_activated_at na primeira ativação
    const activatedAt = profile.premium_activated_at ?? new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium:           true,
        premium_since_week:   premiumSinceWeek,
        premium_plan:         planId,
        premium_expires_at:   expiresAt.toISOString(),
        premium_activated_at: activatedAt,
        updated_at:           new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Erro ao ativar premium:", error);
      return NextResponse.json({ error: "Erro ao ativar premium" }, { status: 500 });
    }

    console.log(`✅ Premium ativado: userId=${userId} plano=${planId} expira=${expiresAt.toISOString()}`);

    // ── Incrementa uso do cupom após pagamento confirmado ─────
    if (cupomCodigo) {
      const { data: cupom } = await supabase
        .from("cupons")
        .select("id, usos_atuais, usos_maximos")
        .eq("codigo", cupomCodigo.toUpperCase())
        .maybeSingle();

      if (cupom) {
        await supabase
          .from("cupons")
          .update({ usos_atuais: (cupom.usos_atuais || 0) + 1 })
          .eq("id", cupom.id);

        // Desativa automaticamente se atingiu o limite
        if (cupom.usos_maximos && (cupom.usos_atuais + 1) >= cupom.usos_maximos) {
          await supabase.from("cupons").update({ ativo: false }).eq("id", cupom.id);
          console.log(`🔒 Cupom ${cupomCodigo} desativado — limite atingido`);
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}