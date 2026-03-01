// app/api/checkout/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLANS = {
  mensal: {
    title: "Pai de Primeira — Plano Mensal",
    unit_price: 19.90,
    description: "Acesso premium mensal a todo o conteúdo da sua jornada",
  },
  trimestral: {
    title: "Pai de Primeira — Plano Trimestral",
    unit_price: 49.90,
    description: "3 meses de acesso premium com 17% de desconto",
  },
  jornada: {
    title: "Pai de Primeira — Jornada Completa",
    unit_price: 129.90,
    description: "Acesso premium por toda a jornada (~22 meses) com 41% de desconto",
  },
};

export async function POST(req) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: "planId e userId são obrigatórios" }, { status: 400 });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // Busca email do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, current_week, stage")
      .eq("id", userId)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painel.apppaideprimeira.com";

    // Cria preferência no Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            id:          planId,
            title:       plan.title,
            description: plan.description,
            quantity:    1,
            currency_id: "BRL",
            unit_price:  plan.unit_price,
          },
        ],
        payer: {
          email: profile?.email || "",
        },
        back_urls: {
          success: `${baseUrl}/obrigado?status=approved&userId=${userId}&plan=${planId}`,
          failure: `${baseUrl}/planos?status=failed`,
          pending: `${baseUrl}/obrigado?status=pending&userId=${userId}&plan=${planId}`,
        },
        auto_return: "approved",
        external_reference: `${userId}|${planId}`,
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
        statement_descriptor: "PAI DE PRIMEIRA",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("MP error:", err);
      return NextResponse.json({ error: "Erro ao criar preferência" }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      checkoutUrl: data.init_point,       // produção
      sandboxUrl:  data.sandbox_init_point, // testes
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}