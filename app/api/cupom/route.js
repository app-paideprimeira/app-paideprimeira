// app/api/cupom/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  const { codigo, planId } = await request.json();

  if (!codigo || !planId) {
    return NextResponse.json({ error: "Código e plano são obrigatórios" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: cupom, error } = await supabase
    .from("cupons")
    .select("*")
    .eq("codigo", codigo.trim().toUpperCase())
    .eq("ativo", true)
    .maybeSingle();

  if (error || !cupom) {
    return NextResponse.json({ error: "Cupom inválido ou inexistente" }, { status: 404 });
  }

  // Verifica se o cupom se aplica ao plano escolhido
  if (!cupom.planos.includes(planId)) {
    return NextResponse.json({ error: `Este cupom é válido apenas para: ${cupom.planos.join(", ")}` }, { status: 400 });
  }

  // Verifica validade
  if (cupom.validade && new Date(cupom.validade) < new Date()) {
    return NextResponse.json({ error: "Este cupom expirou" }, { status: 400 });
  }

  // Verifica limite de usos
  if (cupom.usos_maximos !== null && cupom.usos_atuais >= cupom.usos_maximos) {
    return NextResponse.json({ error: "Este cupom atingiu o limite de usos" }, { status: 400 });
  }

  return NextResponse.json({
    valido:           true,
    desconto_percent: cupom.desconto_percent,
    parceiro:         cupom.parceiro,
    codigo:           cupom.codigo,
  });
}