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
    rawPrice: 19.90,
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
    rawPrice: 129.90,
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
    rawPrice: 49.90,
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

  const [userId, setUserId]             = useState(null);
  const [loading, setLoading]           = useState(null);
  const [error, setError]               = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cupomInput, setCupomInput]     = useState("");
  const [cupomStatus, setCupomStatus]   = useState(null);
  const [cupomData, setCupomData]       = useState(null);
  const [cupomError, setCupomError]     = useState("");

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

  function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    setCupomInput("");
    setCupomStatus(null);
    setCupomData(null);
    setCupomError("");
    setError(null);
    setTimeout(() => {
      document.getElementById("cupom-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  async function handleValidarCupom() {
    if (!cupomInput.trim() || !selectedPlan) return;
    setCupomStatus("checking");
    setCupomError("");
    setCupomData(null);
    try {
      const res = await fetch("/api/cupom", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ codigo: cupomInput.trim(), planId: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCupomStatus("invalid");
        setCupomError(data.error || "Cupom inválido");
      } else {
        setCupomStatus("valid");
        setCupomData(data);
      }
    } catch {
      setCupomStatus("invalid");
      setCupomError("Erro ao validar cupom");
    }
  }

  async function handleCheckout() {
    if (!userId || loading || !selectedPlan) return;
    setLoading(selectedPlan.id);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          planId:      selectedPlan.id,
          userId,
          cupomCodigo: cupomStatus === "valid" ? cupomInput.trim() : null,
        }),
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

  const precoFinal = selectedPlan && cupomStatus === "valid" && cupomData
    ? selectedPlan.rawPrice * (1 - cupomData.desconto_percent / 100)
    : selectedPlan?.rawPrice;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 40%, #f8fafc 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "24px 16px 48px",
    }}>

      <div style={{ maxWidth: 480, margin: "0 auto 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => selectedPlan ? setSelectedPlan(null) : router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            {selectedPlan ? "Confirmar pedido" : "Acesse o conteúdo premium"}
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.5 }}>
            {selectedPlan
              ? `Plano ${selectedPlan.name} selecionado`
              : "Conteúdo exclusivo para cada semana da sua jornada como pai"}
          </p>
        </div>

        {failed && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 14, textAlign: "center" }}>
            ❌ O pagamento não foi concluído. Tente novamente.
          </div>
        )}

        {/* TELA 1 — Seleção de plano */}
        {!selectedPlan && (
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
                    padding: "4px 14px", borderRadius: 20, letterSpacing: "0.5px", whiteSpace: "nowrap",
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
                  <button onClick={() => handleSelectPlan(plan)}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                      background: plan.featured ? `linear-gradient(135deg, ${plan.color}, #3b82f6)` : `${plan.color}15`,
                      color: plan.featured ? "#fff" : plan.color,
                      fontSize: 15, fontWeight: 800, cursor: "pointer",
                      boxShadow: plan.featured ? "0 4px 16px rgba(30,58,138,.3)" : "none",
                    }}>
                    {plan.featured ? "🚀 Começar agora" : "Selecionar plano"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TELA 2 — Cupom + Checkout */}
        {selectedPlan && (
          <div id="cupom-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Resumo */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: `2px solid ${selectedPlan.color}30`, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cupomStatus === "valid" ? 12 : 0 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{selectedPlan.name}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569" }}>{selectedPlan.period}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {cupomStatus === "valid" && cupomData ? (
                    <>
                      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{selectedPlan.price}</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#166534" }}>
                        R$ {precoFinal.toFixed(2).replace(".", ",")}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: selectedPlan.color }}>{selectedPlan.price}</p>
                  )}
                </div>
              </div>
              {cupomStatus === "valid" && cupomData && (
                <div style={{ background: "#dcfce7", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🏷️</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                    Cupom {cupomData.codigo} — {cupomData.desconto_percent}% de desconto aplicado!
                  </span>
                </div>
              )}
            </div>

            {/* Campo cupom — só para Jornada */}
            {selectedPlan.id === "jornada" && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                  🏷️ Tem um cupom de desconto?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={cupomInput}
                    onChange={e => { setCupomInput(e.target.value.toUpperCase()); setCupomStatus(null); setCupomData(null); setCupomError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleValidarCupom()}
                    placeholder="CÓDIGO"
                    disabled={cupomStatus === "valid"}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10,
                      border: `1px solid ${cupomStatus === "valid" ? "#86efac" : cupomStatus === "invalid" ? "#fca5a5" : "#e2e8f0"}`,
                      fontSize: 14, fontWeight: 700, letterSpacing: 2, outline: "none",
                      textTransform: "uppercase",
                      background: cupomStatus === "valid" ? "#f0fdf4" : "#fff",
                      color: "#1e293b",
                    }}
                  />
                  {cupomStatus !== "valid" ? (
                    <button onClick={handleValidarCupom} disabled={!cupomInput.trim() || cupomStatus === "checking"}
                      style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", opacity: !cupomInput.trim() ? 0.5 : 1 }}>
                      {cupomStatus === "checking" ? "..." : "Aplicar"}
                    </button>
                  ) : (
                    <button onClick={() => { setCupomStatus(null); setCupomData(null); setCupomInput(""); }}
                      style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#94a3b8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      ✕
                    </button>
                  )}
                </div>
                {cupomError && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef4444" }}>❌ {cupomError}</p>}
              </div>
            )}

            {/* Botão checkout */}
            <button onClick={handleCheckout} disabled={!!loading}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${selectedPlan.color}, #3b82f6)`,
                color: "#fff", fontSize: 16, fontWeight: 800,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 20px rgba(30,58,138,.3)",
                transition: "opacity .2s",
              }}>
              {loading ? "Aguarde..." : `🔒 Pagar R$ ${precoFinal?.toFixed(2).replace(".", ",")}`}
            </button>

            <button onClick={() => setSelectedPlan(null)}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textAlign: "center" }}>
              ← Escolher outro plano
            </button>

            {error && (
              <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: 10, color: "#991b1b", fontSize: 13, textAlign: "center" }}>
                {error}
              </div>
            )}
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