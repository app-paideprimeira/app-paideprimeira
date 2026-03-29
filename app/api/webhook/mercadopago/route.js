// app/api/webhook/mercadopago/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_DURATION_DAYS = {
  mensal:     30,
  trimestral: 90,
  jornada:    670, // ~22 meses
};

export async function POST(req) {
  try {
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

    const [userId, planId] = (payment.external_reference || "").split("|");
    if (!userId || !planId) {
      console.error("external_reference inválido:", payment.external_reference);
      return NextResponse.json({ error: "Referência inválida" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_week, premium_activated_at")
      .eq("id", userId)
      .single();

    const currentWeek      = profile?.current_week ?? 1;
    const premiumSinceWeek = Math.max(1, currentWeek - 2);
    const expiresAt        = new Date();
    expiresAt.setDate(expiresAt.getDate() + (PLAN_DURATION_DAYS[planId] ?? 30));

    // Só salva premium_activated_at se for a primeira ativação
    // Renovações não resetam o contador de 7 dias
    const activatedAt = profile?.premium_activated_at ?? new Date().toISOString();

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

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}