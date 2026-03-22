"use client";

// app/onboarding/page.js
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import Image from "next/image";

export default function Onboarding() {
  const router  = useRouter();

  const [step, setStep]           = useState(1); // 1 = boas-vindas/nome, 2 = jornada
  const [nome, setNome]           = useState("");
  const [stage, setStage]         = useState("gestante");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function finalizarOnboarding() {
    if (!eventDate) {
      setError("Escolha uma data para continuar 🙂");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const hoje       = new Date();
      const dataEvento = new Date(eventDate);
      let baseWeek     = 1;

      if (stage === "bebe") {
        const diffDias = Math.floor((hoje - dataEvento) / (1000 * 60 * 60 * 24));
        baseWeek = Math.min(52, Math.max(1, Math.floor(diffDias / 7) + 1));
      } else {
        const dum = new Date(dataEvento);
        dum.setDate(dum.getDate() - 280);
        const diffDias = Math.floor((hoje - dum) / (1000 * 60 * 60 * 24));
        baseWeek = Math.min(42, Math.max(1, Math.floor(diffDias / 7) + 1));
      }

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id:                 user.id,
        nome:               nome.trim() || null,
        onboarding_complete: true,
        stage,
        current_week:       baseWeek,
        base_week:          baseWeek,
        base_week_date:     hoje.toISOString().split("T")[0],
        event_date:         eventDate,
        updated_at:         new Date().toISOString(),
      });

      if (upsertError) { setError(upsertError.message); return; }

      router.push(stage === "bebe" ? `/semanas/bebe/${baseWeek}` : `/semanas/gestante/${baseWeek}`);
    } catch (err) {
      console.error(err);
      setError("Algo deu errado. Tenta de novo?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1E3A8A 0%, #1e40af 50%, #1d4ed8 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", padding: "40px 16px 40px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={180} height={54} priority />
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#fff", borderRadius: 24,
        padding: "36px 28px", boxShadow: "0 20px 60px rgba(0,0,0,.2)",
      }}>

        {/* Indicador de steps */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: 4, borderRadius: 4,
              width: step >= s ? 40 : 20,
              background: step >= s ? "#1E3A8A" : "#e2e8f0",
              transition: "all .3s",
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                Bem-vindo, pai!
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                A gente só precisa de algumas informações para caminhar com você da forma certa. Sem pressão. Sem julgamentos.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Como podemos te chamar?</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu primeiro nome"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Opcional — pode pular se preferir</p>
            </div>

            <button onClick={() => setStep(2)} style={btnStyle}>
              Continuar →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {stage === "gestante" ? "🤰" : "👶"}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                Em que momento você está?
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Isso define toda a sua jornada no app
              </p>
            </div>

            {/* Seleção de stage */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[
                { value: "gestante", emoji: "🤰", label: "Gestante", sub: "Companheira grávida" },
                { value: "bebe",     emoji: "👶", label: "Bebê nasceu", sub: "Pós-parto" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStage(opt.value)}
                  style={{
                    flex: 1, padding: "14px 10px", borderRadius: 14,
                    border: `2px solid ${stage === opt.value ? "#1E3A8A" : "#e2e8f0"}`,
                    background: stage === opt.value ? "#eff6ff" : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{opt.emoji}</div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: stage === opt.value ? "#1E3A8A" : "#334155" }}>{opt.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{opt.sub}</p>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                {stage === "gestante" ? "Data provável do parto" : "Data de nascimento do bebê"}
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={e => { setEventDate(e.target.value); setError(""); }}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, textAlign: "center" }}>{error}</p>
            )}

            <button onClick={finalizarOnboarding} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Preparando tudo..." : "Entrar na minha jornada 🚀"}
            </button>

            <button onClick={() => setStep(1)}
              style={{ width: "100%", background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", marginTop: 12 }}>
              ← Voltar
            </button>
          </>
        )}

        <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
          Você pode ajustar essas informações depois no seu perfil.
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#475569",
  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8,
};
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1.5px solid #e2e8f0", fontSize: 15, color: "#0f172a",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  transition: "border-color .15s",
};
const btnStyle = {
  width: "100%", padding: "14px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, #1E3A8A, #3b82f6)",
  color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
  boxShadow: "0 4px 16px rgba(30,58,138,.3)", fontFamily: "inherit",
};