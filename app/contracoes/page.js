"use client";

// app/contracoes/page.js
// Contador de contrações — disponível apenas para usuários premium a partir da semana 34
// Regra 5-1-1: contrações a cada 5 min, durando 1 min, por 1 hora → alerta para maternidade

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseBrowser } from "../../lib/supabase/client";

// ── Helpers ──────────────────────────────────────────────────

function formatDuration(ms) {
  if (ms === null || ms === undefined) return "--";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Regra 5-1-1: últimas contrações com intervalo ≤ 5 min e duração ≥ 60s por pelo menos 1h
function check511(contractions) {
  if (contractions.length < 3) return false;

  const recent = contractions.filter(c => c.duration !== null);
  if (recent.length < 3) return false;

  // Verifica as últimas contrações dentro de 1 hora
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const lastHour   = recent.filter(c => c.startTime >= oneHourAgo);

  if (lastHour.length < 3) return false;

  // Todas com duração ≥ 55s (margem) e intervalo ≤ 6 min
  const allLongEnough = lastHour.every(c => c.duration >= 55000);

  const intervals = [];
  for (let i = 1; i < lastHour.length; i++) {
    intervals.push(lastHour[i].startTime - lastHour[i - 1].startTime);
  }
  const allShortInterval = intervals.every(iv => iv <= 6 * 60 * 1000);

  return allLongEnough && allShortInterval;
}

// ── Componente principal ─────────────────────────────────────

export default function ContracoesPage() {
  const router   = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading]       = useState(true);
  const [allowed, setAllowed]       = useState(false); // premium + semana 34+
  const [profile, setProfile]       = useState(null);

  // Estado do contador
  const [contractions, setContractions] = useState([]); // [{ id, startTime, endTime, duration }]
  const [active, setActive]             = useState(false); // contração em andamento
  const [activeStart, setActiveStart]   = useState(null);
  const [elapsed, setElapsed]           = useState(0); // ms da contração atual
  const [alert511, setAlert511]         = useState(false);

  const timerRef = useRef(null);

  // ── Verifica acesso ──────────────────────────────────────
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data: p } = await supabase
        .from("profiles")
        .select("is_premium, current_week, stage, nome")
        .eq("id", user.id)
        .single();

      setProfile(p);

      if (p?.is_premium && p?.stage === "gestante" && p?.current_week >= 34) {
        setAllowed(true);
      }

      setLoading(false);
    }
    check();
  }, [supabase, router]);

  // ── Timer da contração ativa ──────────────────────────────
  useEffect(() => {
    if (active && activeStart) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - activeStart);
      }, 100);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [active, activeStart]);

  // ── Verifica regra 5-1-1 quando lista muda ───────────────
  useEffect(() => {
    setAlert511(check511(contractions));
  }, [contractions]);

  // ── Iniciar contração ────────────────────────────────────
  function startContraction() {
    if (active) return;
    setActive(true);
    setActiveStart(Date.now());
  }

  // ── Finalizar contração ──────────────────────────────────
  function stopContraction() {
    if (!active || !activeStart) return;
    const endTime  = Date.now();
    const duration = endTime - activeStart;

    setContractions(prev => [{
      id:        Date.now(),
      startTime: activeStart,
      endTime,
      duration,
    }, ...prev]);

    setActive(false);
    setActiveStart(null);
  }

  // ── Remover última ───────────────────────────────────────
  function removeLast() {
    setContractions(prev => prev.slice(1));
  }

  // ── Resetar sessão ───────────────────────────────────────
  function resetSession() {
    if (!confirm("Zerar todas as contrações desta sessão?")) return;
    setContractions([]);
    setActive(false);
    setActiveStart(null);
    setAlert511(false);
  }

  // ── Intervalo desde última contração ─────────────────────
  function getLastInterval() {
    if (contractions.length < 2) return null;
    return contractions[0].startTime - contractions[1].startTime;
  }

  const lastInterval  = getLastInterval();
  const avgDuration   = contractions.length > 0
    ? Math.round(contractions.filter(c => c.duration).reduce((s, c) => s + c.duration, 0) / contractions.filter(c => c.duration).length)
    : null;
  const avgInterval   = contractions.length > 1
    ? Math.round(contractions.slice(0, -1).reduce((s, c, i) => s + (contractions[i].startTime - contractions[i + 1].startTime), 0) / (contractions.length - 1))
    : null;

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #f43f5e", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Acesso negado ────────────────────────────────────────
  if (!allowed) {
    const isPremium    = profile?.is_premium;
    const isGestante   = profile?.stage === "gestante";
    const week         = profile?.current_week ?? 0;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a, #1e293b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "#1e293b", borderRadius: 24, padding: "40px 28px", maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid #334155" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>
            {!isGestante ? "👶" : !isPremium ? "👑" : "⏳"}
          </div>
          <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 900, margin: "0 0 10px" }}>
            {!isGestante
              ? "Disponível apenas para gestantes"
              : !isPremium
              ? "Recurso exclusivo Premium"
              : `Disponível a partir da semana 34`}
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
            {!isGestante
              ? "O contador de contrações é exclusivo para a jornada da gestante."
              : !isPremium
              ? "Assine o plano premium para ter acesso ao contador de contrações e outros recursos exclusivos."
              : `Você está na semana ${week}. O contador estará disponível a partir da semana 34.`}
          </p>
          {!isPremium && isGestante && (
            <button onClick={() => router.push("/planos")} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #f43f5e, #e11d48)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
              Ver planos premium
            </button>
          )}
          <button onClick={() => router.back()} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // ── Interface principal ──────────────────────────────────
  const buttonColor = active ? "#f43f5e" : "#22c55e";
  const buttonGlow  = active ? "rgba(244,63,94,.4)" : "rgba(34,197,94,.4)";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1a0a2e 50%, #0f172a 100%)", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#f1f5f9" }}>

      {/* HEADER */}
      <div style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "#94a3b8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            ← Voltar
          </button>
          <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={100} height={30} />
          <button onClick={resetSession} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "#94a3b8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Resetar
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            Contador de Contrações
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Semana {profile?.current_week} — Toque quando começar e quando parar
          </p>
        </div>
      </div>

      {/* ALERTA 5-1-1 */}
      {alert511 && (
        <div style={{ margin: "16px 20px 0", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", borderRadius: 16, padding: "16px 20px", animation: "pulse 1.5s infinite", textAlign: "center" }}>
            <p style={{ fontSize: 22, margin: "0 0 4px" }}>🚨</p>
            <p style={{ fontWeight: 900, fontSize: 16, margin: "0 0 4px", color: "#fff" }}>Padrão 5-1-1 detectado!</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.85)", margin: 0, lineHeight: 1.5 }}>
              Contrações regulares a cada ~5 minutos com duração de ~1 minuto por mais de 1 hora.
              <strong> Considere ir para a maternidade.</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>

        {/* BOTÃO PRINCIPAL */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>

          {/* Timer da contração ativa */}
          <div style={{ marginBottom: 20, textAlign: "center", minHeight: 60 }}>
            {active ? (
              <>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                  Duração atual
                </p>
                <p style={{ fontSize: 42, fontWeight: 900, margin: 0, color: "#f43f5e", letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(elapsed)}
                </p>
              </>
            ) : contractions.length > 0 ? (
              <>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                  Última duração
                </p>
                <p style={{ fontSize: 42, fontWeight: 900, margin: 0, color: "#22c55e", letterSpacing: "-2px" }}>
                  {formatDuration(contractions[0].duration)}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 15, color: "#475569", margin: 0 }}>Toque no botão quando começar uma contração</p>
            )}
          </div>

          {/* Botão grande */}
          <button
            onClick={active ? stopContraction : startContraction}
            style={{
              width: 200, height: 200, borderRadius: "50%",
              border: "none", cursor: "pointer",
              background: `radial-gradient(circle at 35% 35%, ${buttonColor}, ${active ? "#be123c" : "#16a34a"})`,
              boxShadow: `0 0 0 20px ${buttonColor}18, 0 0 0 40px ${buttonColor}08, 0 8px 40px ${buttonGlow}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span style={{ fontSize: 48, marginBottom: 4 }}>{active ? "⏹" : "▶"}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "0.5px" }}>
              {active ? "PARAR" : "INICIAR"}
            </span>
          </button>

          {/* Intervalo desde última */}
          {!active && contractions.length > 0 && lastInterval && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>Intervalo desde a última</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                {formatDuration(lastInterval)}
              </p>
            </div>
          )}
        </div>

        {/* ESTATÍSTICAS */}
        {contractions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Contrações", value: contractions.length, unit: "" },
              { label: "Duração média", value: avgDuration ? formatDuration(avgDuration) : "--", unit: "" },
              { label: "Intervalo médio", value: avgInterval ? formatDuration(avgInterval) : "--", unit: "" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,.08)" }}>
                <p style={{ fontSize: 18, fontWeight: 900, margin: "0 0 2px", color: "#f1f5f9" }}>{value}</p>
                <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* REGRA 5-1-1 INFO */}
        {!alert511 && (
          <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "14px 16px", marginBottom: 24, border: "1px solid rgba(255,255,255,.06)" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>Regra 5-1-1</p>
            <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.6 }}>
              Considere ir à maternidade quando as contrações ocorrerem a cada <strong style={{ color: "#94a3b8" }}>5 minutos</strong>, durando pelo menos <strong style={{ color: "#94a3b8" }}>1 minuto</strong> cada, por <strong style={{ color: "#94a3b8" }}>1 hora</strong> consecutiva.
            </p>
          </div>
        )}

        {/* HISTÓRICO */}
        {contractions.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                Histórico da sessão
              </p>
              <button onClick={removeLast} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                Remover última
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {contractions.map((c, i) => {
                const interval = i < contractions.length - 1
                  ? contractions[i].startTime - contractions[i + 1].startTime
                  : null;
                return (
                  <div key={c.id} style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#22c55e20" : "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? "#22c55e" : "#64748b" }}>{contractions.length - i}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>
                        {formatTime(new Date(c.startTime))}
                        <span style={{ color: "#475569", fontWeight: 400 }}> → </span>
                        {formatTime(new Date(c.endTime))}
                      </p>
                      {interval && (
                        <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                          Intervalo: {formatDuration(interval)}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: c.duration >= 60000 ? "#22c55e" : "#f1f5f9" }}>
                        {formatDuration(c.duration)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Aviso médico */}
        <p style={{ fontSize: 11, color: "#334155", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          ⚕️ Este contador é uma ferramenta de apoio. Sempre siga as orientações do seu médico ou equipe obstétrica.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .92; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}