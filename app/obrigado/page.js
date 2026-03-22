"use client";

// app/obrigado/page.js
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import Image from "next/image";

const PLAN_NAMES = {
  mensal:     "Plano Mensal",
  trimestral: "Plano Trimestral",
  jornada:    "Jornada Completa",
};

export default function ObrigadoPage() {
  return (
    <Suspense>
      <ObrigadoContent />
    </Suspense>
  );
}

function ObrigadoContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [weekUrl, setWeekUrl]     = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  const status   = searchParams.get("status");
  const userId   = searchParams.get("userId");
  const planId   = searchParams.get("plan");
  const approved = status === "approved";

  useEffect(() => {
    if (!userId) { setLoadingUrl(false); setWeekUrl("/dashboard"); return; }
    async function getWeekUrl() {
      const supabase = supabaseBrowser();
      const { data: profile } = await supabase
        .from("profiles").select("stage, current_week").eq("id", userId).single();
      setWeekUrl(profile ? `/semanas/${profile.stage}/${profile.current_week}` : "/dashboard");
      setLoadingUrl(false);
    }
    getWeekUrl();
  }, [userId]);

  useEffect(() => {
    if (!approved || !weekUrl) return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); router.replace(weekUrl); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [approved, weekUrl, router]);

  function handleGoNow() {
    if (!weekUrl || loadingUrl) return;
    router.replace(weekUrl);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: approved
        ? "linear-gradient(160deg, #1E3A8A 0%, #1e40af 50%, #1d4ed8 100%)"
        : "linear-gradient(160deg, #92400e 0%, #b45309 50%, #d97706 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={160} height={48} priority />
      </div>

      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 28px",
        maxWidth: 400, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        animation: "popIn .4s cubic-bezier(.34,1.56,.64,1)",
      }}>

        {approved ? (
          <>
            {/* Ícone de sucesso */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(34,197,94,.35)",
              animation: "bounceIn .5s .2s both",
            }}>
              🎉
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              Bem-vindo ao Premium!
            </h1>
            <p style={{ fontSize: 15, color: "#475569", margin: "0 0 6px", lineHeight: 1.5 }}>
              Seu acesso ao <strong>{PLAN_NAMES[planId] || "plano premium"}</strong> foi ativado com sucesso.
            </p>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
              Agora você tem acesso a todo o conteúdo exclusivo da sua jornada. 👶
            </p>

            {/* Countdown */}
            <div style={{
              background: "#f0fdf4", borderRadius: 12, padding: "14px 20px",
              marginBottom: 16, border: "1px solid #bbf7d0",
            }}>
              <p style={{ margin: 0, fontSize: 14, color: "#166534", fontWeight: 600 }}>
                Redirecionando em{" "}
                <span style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>{countdown}</span>s
              </p>
            </div>

            <button
              onClick={handleGoNow}
              disabled={loadingUrl}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: loadingUrl ? "#e2e8f0" : "linear-gradient(135deg, #1E3A8A, #3b82f6)",
                color: loadingUrl ? "#94a3b8" : "#fff",
                fontSize: 15, fontWeight: 800,
                cursor: loadingUrl ? "wait" : "pointer",
                boxShadow: loadingUrl ? "none" : "0 4px 16px rgba(30,58,138,.3)",
                transition: "all .2s",
              }}>
              {loadingUrl ? "Carregando..." : "Ver conteúdo premium agora →"}
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(245,158,11,.35)",
            }}>
              ⏳
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              Pagamento em processamento
            </h1>
            <p style={{ fontSize: 15, color: "#475569", margin: "0 0 24px", lineHeight: 1.5 }}>
              Seu pagamento está sendo processado. Você receberá uma confirmação em breve e o acesso será liberado automaticamente.
            </p>

            <button onClick={() => router.replace("/dashboard")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(245,158,11,.3)",
              }}>
              Voltar ao app
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(.9) translateY(20px) }
          to   { opacity: 1; transform: scale(1)  translateY(0) }
        }
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(.5) }
          to   { opacity: 1; transform: scale(1) }
        }
      `}</style>
    </div>
  );
}