"use client";

// app/cancelamento/page.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function CancelamentoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("nome, email, is_premium, premium_plan, premium_activated_at, premium_expires_at")
        .eq("id", user.id)
        .single();
      setProfile({ ...data, email: user.email });
      setLoading(false);
    }
    load();
  }, [router]);

  // Verifica se está dentro do prazo de 7 dias
  const dentroDosPrazoDias7 = profile?.premium_activated_at
    ? Math.floor((Date.now() - new Date(profile.premium_activated_at).getTime()) / (1000 * 60 * 60 * 24)) <= 7
    : false;

  async function handleCancelar() {
    if (!motivo.trim()) return;
    setEnviando(true);
    try {
      const assunto = dentroDosPrazoDias7
        ? `Cancelamento com reembolso — ${profile.email}`
        : `Cancelamento de assinatura — ${profile.email}`;

      const corpo = `
Nome: ${profile.nome || "Não informado"}
E-mail: ${profile.email}
Plano: ${profile.premium_plan || "N/A"}
Data de ativação: ${profile.premium_activated_at ? new Date(profile.premium_activated_at).toLocaleDateString("pt-BR") : "N/A"}
Direito a reembolso: ${dentroDosPrazoDias7 ? "SIM (dentro dos 7 dias)" : "NÃO (fora do prazo)"}

Motivo: ${motivo}
      `.trim();

      window.location.href = `mailto:contato@apppaideprimeira.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

      setTimeout(() => setEnviado(true), 1000);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #1E3A8A", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      <header style={{ background: "#1E3A8A", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 80px" }}>

        {enviado ? (
          <div style={{ background: "#f0fdf4", borderRadius: 16, padding: 32, textAlign: "center", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#166534", marginBottom: 8 }}>Solicitação enviada!</h2>
            <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
              Recebemos sua solicitação de cancelamento. Responderemos em até <strong>2 dias úteis</strong> pelo e-mail {profile.email}.
            </p>
            {dentroDosPrazoDias7 && (
              <p style={{ fontSize: 13, color: "#166534", marginTop: 12, fontWeight: 700 }}>
                🔄 O reembolso será processado em até 7 dias úteis.
              </p>
            )}
            <button onClick={() => router.push("/dashboard")}
              style={{ marginTop: 24, padding: "12px 28px", borderRadius: 10, border: "none", background: "#1E3A8A", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Voltar ao início
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
              Cancelar assinatura
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>
              Lamentamos que queira cancelar. Antes de prosseguir, veja as informações abaixo.
            </p>

            {/* STATUS DO PLANO */}
            {profile?.is_premium && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 24, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Sua assinatura</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Row label="Plano" value={
                    profile.premium_plan === "mensal" ? "Mensal" :
                    profile.premium_plan === "trimestral" ? "Trimestral" :
                    profile.premium_plan === "jornada" ? "Jornada Completa" : profile.premium_plan
                  } />
                  <Row label="Ativado em" value={profile.premium_activated_at ? new Date(profile.premium_activated_at).toLocaleDateString("pt-BR") : "—"} />
                  <Row label="Acesso até" value={profile.premium_expires_at ? new Date(profile.premium_expires_at).toLocaleDateString("pt-BR") : "—"} />
                </div>
              </div>
            )}

            {/* AVISO DE REEMBOLSO */}
            <div style={{
              borderRadius: 14, padding: 20, marginBottom: 24,
              background: dentroDosPrazoDias7 ? "#f0fdf4" : "#fefce8",
              border: `1px solid ${dentroDosPrazoDias7 ? "#bbf7d0" : "#fde68a"}`,
            }}>
              {dentroDosPrazoDias7 ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#166534", marginBottom: 6 }}>
                    ✅ Você tem direito ao reembolso integral
                  </p>
                  <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                    Sua assinatura foi ativada há menos de 7 dias. Conforme o Código de Defesa do Consumidor, você tem direito ao cancelamento com reembolso total, sem necessidade de justificativa.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#92400e", marginBottom: 6 }}>
                    ⚠️ Prazo de reembolso encerrado
                  </p>
                  <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                    O prazo de 7 dias para reembolso já expirou. Ao cancelar, seu acesso premium permanece ativo até <strong>{profile?.premium_expires_at ? new Date(profile.premium_expires_at).toLocaleDateString("pt-BR") : "o fim do período"}</strong>.
                  </p>
                </>
              )}
            </div>

            {/* MOTIVO */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>
                Conte-nos o motivo do cancelamento (obrigatório)
              </label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: O app não atendeu às minhas expectativas, achei caro, não tenho mais tempo..."
                rows={4}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none", resize: "vertical", color: "#0f172a", lineHeight: 1.5 }}
              />
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Seu feedback nos ajuda a melhorar o app.
              </p>
            </div>

            <button
              onClick={handleCancelar}
              disabled={!motivo.trim() || enviando}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: motivo.trim() ? "#dc2626" : "#e2e8f0",
                color: motivo.trim() ? "#fff" : "#94a3b8",
                fontWeight: 800, fontSize: 15, cursor: motivo.trim() ? "pointer" : "default",
              }}>
              {enviando ? "Abrindo e-mail..." : dentroDosPrazoDias7 ? "Solicitar cancelamento com reembolso" : "Solicitar cancelamento"}
            </button>

            <button onClick={() => router.back()}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 12 }}>
              Voltar sem cancelar
            </button>

            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
              Ao clicar em "Solicitar cancelamento", um e-mail será preparado com suas informações para envio a <strong>contato@apppaideprimeira.com</strong>. Nossa equipe responderá em até 2 dias úteis.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#0f172a" }}>{value}</span>
    </div>
  );
}