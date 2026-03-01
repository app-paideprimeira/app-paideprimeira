"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import WeekCard from "../../../components/WeekCard";
import PremiumBlockCard from "../../../components/PremiumBlockCard";
import { useGoToToday } from "../../../../lib/navigation/useGoToToday";
import { supabaseBrowser } from "../../../../lib/supabase/client";
import { usePushPrompt } from "../../../../lib/push/usePushPrompt";

// ─── lógica de acesso premium ────────────────────────────────
function isPremiumWeekUnlocked(semana, currentWeek, premiumSinceWeek) {
  const sinceWeek = premiumSinceWeek ?? currentWeek;
  return semana >= sinceWeek && semana <= currentWeek + 2;
}

export default function SemanaGestante({ params }) {
  const router = useRouter();
  const { goToToday } = useGoToToday();

  const [userId, setUserId]             = useState(null);
  const [isPremium, setIsPremium]       = useState(false);
  const [isUnlocked, setIsUnlocked]     = useState(false);
  const [premiumContent, setPremiumContent] = useState(null);
  const [loadingPremium, setLoadingPremium] = useState(false);

  const semana     = Number(params.semana);
  const infoSemana = semanaData.gestante?.[semana];

  // ── Hook de push — passa userId quando disponível ──
  const { showPrompt, loading: loadingPush, enablePush, dismissPush } = usePushPrompt(userId);

  /* ────────────────────────────────
     INIT — usuário + premium
  ──────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;

    async function init() {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !alive) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, current_week, premium_since_week")
        .eq("id", user.id)
        .single();

      if (!profile || !alive) return;

      if (profile.is_premium) {
        setIsPremium(true);
        const unlocked = isPremiumWeekUnlocked(
          semana,
          profile.current_week,
          profile.premium_since_week
        );
        setIsUnlocked(unlocked);
        if (unlocked) loadPremiumContent(alive, supabase);
      }
    }

    async function loadPremiumContent(alive, supabase) {
      setLoadingPremium(true);
      try {
        const { data: header, error: headerError } = await supabase
          .from("premium_week_materials")
          .select("id, title, intro")
          .eq("stage", "gestante")
          .eq("week", semana)
          .maybeSingle();

        if (headerError || !header?.id || !alive) return;

        const { data: blocks } = await supabase
          .from("premium_week_blocks")
          .select("type, title, description, url, cta, payload, sort_order")
          .eq("week_id", header.id)
          .order("sort_order", { ascending: true });

        if (!alive) return;

        setPremiumContent({
          titulo: header.title,
          intro:  header.intro || "",
          conteudos: (blocks ?? []).map((b) => ({
            tipo:      b.type,
            titulo:    b.title,
            descricao: b.description,
            link:      b.url,
            cta:       b.cta,
            payload:   b.payload,
          })),
        });
      } catch (_) {
        // silencioso
      } finally {
        if (alive) setLoadingPremium(false);
      }
    }

    init();
    return () => { alive = false; };
  }, [semana]);

  if (!infoSemana) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Semana não encontrada.</p>
      </div>
    );
  }

  const { bgColor, textColor } = infoSemana;

  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: bgColor }}>

      {/* HEADER */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={140} height={40} className="opacity-90" priority />
        <UserMenu />
      </header>

      <main className="max-w-3xl mx-auto space-y-8">

        <WeekCard data={infoSemana} />

        {/* ── SEÇÃO PREMIUM ── */}
        {isPremium ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: `${textColor}30` }} />
              <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide" style={{ backgroundColor: textColor, color: "#fff" }}>
                ✨ Conteúdo Premium
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `${textColor}30` }} />
            </div>

            {!isUnlocked && (
              <div className="bg-white/80 rounded-2xl p-6 text-center space-y-3" style={{ border: `2px dashed ${textColor}40` }}>
                <div className="text-3xl">🔒</div>
                <p className="font-bold text-lg" style={{ color: textColor }}>Conteúdo ainda não disponível</p>
                <p className="text-sm text-gray-600">
                  Este conteúdo será liberado quando você chegar na <strong>semana {semana - 2}</strong> da gestação.
                </p>
                <div className="inline-block px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: `${textColor}15`, color: textColor }}>
                  📅 Disponível na semana {semana - 2}
                </div>
              </div>
            )}

            {isUnlocked && loadingPremium && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: textColor }} />
              </div>
            )}

            {isUnlocked && !loadingPremium && premiumContent && (
              <>
                {premiumContent.intro && (
                  <div className="bg-white/80 rounded-2xl px-6 py-4 text-center" style={{ borderLeft: `5px solid ${textColor}` }}>
                    <p className="text-sm md:text-base text-gray-700 italic">{premiumContent.intro}</p>
                  </div>
                )}
                <div className="space-y-6">
                  {premiumContent.conteudos.map((item, index) => (
                    <PremiumBlockCard key={index} block={item} accentColor={textColor} softBg={bgColor} />
                  ))}
                </div>
              </>
            )}

            {isUnlocked && !loadingPremium && !premiumContent && (
              <div className="bg-white/80 rounded-2xl p-6 text-center space-y-2" style={{ borderLeft: `5px solid ${textColor}` }}>
                <p className="text-2xl">🛠️</p>
                <p className="font-semibold" style={{ color: textColor }}>Conteúdo a caminho</p>
                <p className="text-sm text-gray-600">Estamos preparando os extras dessa semana. Volte em breve!</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => router.push(`/materiais/gestante/${semana}`)}
              className="px-5 py-3 rounded-xl font-semibold shadow-md bg-white/90 hover:bg-white transition"
              style={{ color: textColor }}
            >
              {infoSemana.cta_premium || "Ver conteúdos extras da semana ✨"}
            </button>
          </div>
        )}

        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-center gap-3">
          <button disabled={semana <= 1} onClick={() => router.push(`/semanas/gestante/${semana - 1}`)} className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40" style={{ color: textColor }}>
            ← Semana {semana - 1}
          </button>
          <button onClick={goToToday} className="px-5 py-2 rounded-xl font-semibold shadow-md" style={{ backgroundColor: textColor, color: "#fff" }}>
            Semana Atual
          </button>
          <button disabled={semana >= 42} onClick={() => router.push(`/semanas/gestante/${semana + 1}`)} className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40" style={{ color: textColor }}>
            → Semana {semana + 1}
          </button>
        </div>

      </main>

      {/* ── PUSH PROMPT ── */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quer receber lembretes importantes?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Avisos semanais da gestação, exames importantes e datas que fazem diferença nesse momento.
            </p>
            <div className="flex gap-3">
              <button onClick={dismissPush} className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600">
                Agora não
              </button>
              <button onClick={enablePush} disabled={loadingPush} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold">
                {loadingPush ? "Ativando..." : "Ativar avisos"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}