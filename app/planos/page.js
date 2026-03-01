"use client";

// app/planos/page.js

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabaseBrowser } from "../../lib/supabase/client";

const PLANS = [
  {
    id:       "mensal",
    name:     "Mensal",
    price:    "R$ 19,90",
    period:   "/mês",
    saving:   null,
    featured: false,
    color:    "#64748b",
    benefits: [
      "Acesso a todo conteúdo premium da semana",
      "Notificações semanais personalizadas",
      "Cancele quando quiser",
    ],
  },
  {
    id:       "jornada",
    name:     "Jornada Completa",
    price:    "R$ 129,90",
    period:   "pagamento único",
    saving:   "Economize 41% vs mensal",
    featured: true,
    color:    "#1E3A8A",
    benefits: [
      "Acesso por toda a jornada (~22 meses)",
      "Notificações semanais personalizadas",
      "Conteúdo de gestação + primeiro ano do bebê",
      "Melhor custo-benefício",
    ],
  },
  {
    id:       "trimestral",
    name:     "Trimestral",
    price:    "R$ 49,90",
    period:   "/trimestre",
    saving:   "Economize 17% vs mensal",
    featured: false,
    color:    "#0369a1",
    benefits: [
      "3 meses de acesso premium",
      "Notificações semanais personalizadas",
      "Renovação automática opcional",
    ],
  },
];

export default function PlanosPage() {
  return (
    <Suspense>
      <PlanosContent />
    </Suspense>
  );
}

function PlanosContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId]   = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState(null);
  const failed = searchParams.get("status") === "failed";

  useEffect(() => {
    async function getUser() {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      setUserId(user.id);
    }
    getUser();
  }, [router]);

  async function handleSelectPlan(planId) {
    if (!userId || loading) return;
    setLoading(planId);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planId, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar checkout");

      const url = process.env.NODE_ENV === "development"
        ? data.sandboxUrl
        : data.checkoutUrl;

      window.location.href = url;

    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 40%, #f8fafc 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "24px 16px 48px",
    }}>

      {/* Header */}
      <div style={{ maxWidth: 480, margin: "0 auto 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Título */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Acesse o conteúdo premium
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.5 }}>
            Conteúdo exclusivo para cada semana da sua jornada como pai
          </p>
        </div>

        {/* Aviso de falha */}
        {failed && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 14, textAlign: "center" }}>
            ❌ O pagamento não foi concluído. Tente novamente.
          </div>
        )}

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              background:   plan.featured ? `linear-gradient(135deg, ${plan.color}, #3b82f6)` : "#fff",
              borderRadius: 20,
              padding:      plan.featured ? "2px" : "0",
              boxShadow:    plan.featured ? "0 8px 32px rgba(30,58,138,.25)" : "0 2px 12px rgba(0,0,0,.08)",
              position: "relative",
            }}>

              {plan.featured && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(90deg, #f59e0b, #f97316)",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "4px 14px", borderRadius: 20,
                  letterSpacing: "0.5px", whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(249,115,22,.4)",
                }}>
                  ⭐ MAIS POPULAR
                </div>
              )}

              <div style={{
                background:   plan.featured ? "#fff" : "transparent",
                borderRadius: plan.featured ? 18 : 20,
                padding:      "20px",
                border:       plan.featured ? "none" : `2px solid ${plan.color}20`,
              }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: plan.featured ? plan.color : "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                      {plan.name}
                    </p>
                    {plan.saving && (
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 20, fontWeight: 700, display: "inline-block", marginTop: 4 }}>
                        {plan.saving}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: plan.featured ? plan.color : "#0f172a", letterSpacing: "-1px" }}>
                      {plan.price}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{plan.period}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  {plan.benefits.map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: plan.featured ? plan.color : "#22c55e", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.4 }}>{b}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!!loading}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                    background: plan.featured
                      ? `linear-gradient(135deg, ${plan.color}, #3b82f6)`
                      : `${plan.color}15`,
                    color:   plan.featured ? "#fff" : plan.color,
                    fontSize: 15, fontWeight: 800,
                    cursor:  loading ? "wait" : "pointer",
                    opacity: loading && loading !== plan.id ? 0.5 : 1,
                    transition: "opacity .2s",
                    boxShadow: plan.featured ? "0 4px 16px rgba(30,58,138,.3)" : "none",
                  }}
                >
                  {loading === plan.id ? "Aguarde..." : plan.featured ? "🚀 Começar agora" : "Selecionar plano"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", borderRadius: 10, color: "#991b1b", fontSize: 13, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            🔒 Pagamento seguro via Mercado Pago<br />
            PIX, cartão de crédito e boleto
          </p>
        </div>

      </div>
    </div>
  );
}