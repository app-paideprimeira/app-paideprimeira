// app/api/cupom/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ── Rate limit — máx 20 tentativas por IP por minuto ─────────
const rateMap = new Map();
const RATE_LIMIT  = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now   = Date.now();
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

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  // ── Rate limit por IP ──────────────────────────────────────
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 });
  }

  const { codigo, planId } = await request.json();

  if (!codigo || !planId) {
    return NextResponse.json({ error: "Código e plano são obrigatórios" }, { status: 400 });
  }

  // Sanitiza — só aceita letras, números e hífen
  const codigoLimpo = codigo.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, "");
  if (!codigoLimpo) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: cupom, error } = await supabase
    .from("cupons")
    .select("codigo, desconto_percent, parceiro, planos, validade, usos_maximos, usos_atuais, ativo")
    .eq("codigo", codigoLimpo)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !cupom) {
    return NextResponse.json({ error: "Cupom inválido ou inexistente" }, { status: 404 });
  }

  if (!cupom.planos.includes(planId)) {
    return NextResponse.json({ error: `Este cupom é válido apenas para: ${cupom.planos.join(", ")}` }, { status: 400 });
  }

  if (cupom.validade && new Date(cupom.validade) < new Date()) {
    return NextResponse.json({ error: "Este cupom expirou" }, { status: 400 });
  }

  if (cupom.usos_maximos !== null && cupom.usos_atuais >= cupom.usos_maximos) {
    return NextResponse.json({ error: "Este cupom atingiu o limite de usos" }, { status: 400 });
  }

  // Retorna apenas o necessário — nunca expõe dados internos
  return NextResponse.json({
    valido:           true,
    desconto_percent: cupom.desconto_percent,
    parceiro:         cupom.parceiro,
    codigo:           cupom.codigo,
  });
}