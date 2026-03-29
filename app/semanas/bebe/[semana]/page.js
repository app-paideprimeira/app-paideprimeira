"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import WeekCard from "../../../components/WeekCard";
import PremiumBlockCard from "../../../components/PremiumBlockCard";
import { useGoToToday } from "../../../../lib/navigation/useGoToToday";
import { supabaseBrowser } from "../../../../lib/supabase/client";
import { usePushPrompt } from "../../../../lib/push/usePushPrompt";

const TIPO_LABELS = {
  checklist:      "✅ Checklist",
  texto:          "📝 Texto",
  lembrete_fixo:  "📌 Lembrete",
  video:          "🎥 Vídeo",
  filme:          "🎬 Dica de Filme",
  podcast:        "🎧 Podcast",
  audio:          "🔊 Áudio",
  leitura:        "📖 Leitura",
  produto:        "🛒 Produto",
  lista_produtos: "🛍️ Lista de Produtos",
  imagem:         "🖼️ Imagem",
  download:       "📥 Download",
};

function isPremiumWeekUnlocked(semana, currentWeek, premiumActivatedAt) {
  const diasAssinado = premiumActivatedAt
    ? Math.floor((Date.now() - new Date(premiumActivatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (diasAssinado < 7) {
    // Primeiros 7 dias — janela restrita: 2 antes + atual + 2 depois
    return semana >= currentWeek - 2 && semana <= currentWeek + 2;
  }

  // Após 7 dias — todo passado + 2 semanas à frente
  return semana <= currentWeek + 2;
}

function NascimentoBanner({ textColor, onClose }) {
  return (
    <div className="rounded-3xl p-6 text-center space-y-3 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fef3c7, #fff7ed)", border: "2px solid #fbbf24" }}>
      <div style={{ position: "absolute", top: 8, left: 16, fontSize: 20, opacity: 0.4 }}>🎊</div>
      <div style={{ position: "absolute", top: 8, right: 16, fontSize: 20, opacity: 0.4 }}>🎊</div>
      <div style={{ fontSize: 52 }}>👶</div>
      <h2 className="text-xl font-black text-gray-900">Bem-vindo à fase do bebê!</h2>
      <p className="text-sm text-gray-600 leading-relaxed">
        A gestação acabou e uma nova jornada começa. A partir de agora você acompanha o desenvolvimento semana a semana do seu bebê.
      </p>
      <button onClick={onClose}
        className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
        style={{ backgroundColor: textColor }}>
        Começar essa nova fase 🚀
      </button>
    </div>
  );
}

function LockedBlockCard({ block, textColor, onUpgrade }) {
  const label = TIPO_LABELS[block.tipo] || block.tipo;
  return (
    <div
      className="bg-white/60 rounded-2xl p-5 shadow-md border border-white/40 flex items-center gap-4 cursor-pointer"
      style={{ borderLeft: `4px solid ${textColor}40` }}
      onClick={onUpgrade}
    >
      <div className="text-2xl flex-shrink-0">🔒</div>
      <div className="flex-1 min-w-0">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
          style={{ backgroundColor: textColor + "20", color: textColor }}>
          {label}
        </span>
        <p className="text-sm font-bold text-gray-700 truncate">{block.titulo}</p>
        {block.descricao && <p className="text-xs text-gray-400 truncate">{block.descricao}</p>}
      </div>
      <div className="flex-shrink-0">
        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: textColor, color: "#fff" }}>
          Premium
        </span>
      </div>
    </div>
  );
}

function UpgradeCTA({ textColor, onUpgrade, blocksCount }) {
  return (
    <div className="bg-white/90 rounded-2xl p-6 text-center space-y-4 shadow-xl"
      style={{ border: `2px solid ${textColor}30` }}>
      <div className="text-3xl">✨</div>
      <div>
        <p className="font-black text-lg text-gray-900">
          {blocksCount > 0
            ? `+ ${blocksCount} conteúdo${blocksCount > 1 ? "s" : ""} exclusivo${blocksCount > 1 ? "s" : ""} nessa semana`
            : "Conteúdo exclusivo nessa semana"}
        </p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Assine o Premium e acesse todos os extras da sua jornada como pai.
        </p>
      </div>
      <button onClick={onUpgrade}
        className="w-full py-3 rounded-xl font-bold text-white text-base transition hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${textColor}, #3b82f6)` }}>
        🚀 Ver planos e assinar
      </button>
    </div>
  );
}

function SemanaBebePage({ params }) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { goToToday } = useGoToToday();

  const [userId, setUserId]                 = useState(null);
  const [isPremium, setIsPremium]           = useState(false);
  const [isUnlocked, setIsUnlocked]         = useState(false);
  const [premiumContent, setPremiumContent] = useState(null);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [showBanner, setShowBanner]         = useState(false);

  const semana     = Number(params.semana);
  const infoSemana = semanaData.bebe?.[semana];

  const { showPrompt, loading: loadingPush, enablePush, dismissPush } = usePushPrompt(userId);

  useEffect(() => {
    if (searchParams.get("nascimento") === "true") {
      setShowBanner(true);
      window.history.replaceState({}, "", `/semanas/bebe/${semana}`);
    }
  }, [searchParams, semana]);

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
        .select("is_premium, current_week, is_admin, premium_activated_at")
        .eq("id", user.id)
        .single();

      if (!profile || !alive) return;

      if (profile.is_premium || profile.is_admin) {
        setIsPremium(true);
        const unlocked = profile.is_admin || isPremiumWeekUnlocked(
          semana,
          profile.current_week,
          profile.premium_activated_at
        );
        setIsUnlocked(unlocked);
        if (unlocked) loadPremiumContent(alive, supabase);
      } else {
        loadPremiumContent(alive, supabase);
      }
    }

    async function loadPremiumContent(alive, supabase) {
      setLoadingPremium(true);
      try {
        const { data: header } = await supabase
          .from("premium_week_materials")
          .select("id, title, intro")
          .eq("stage", "bebe")
          .eq("week", semana)
          .maybeSingle();

        if (!header?.id || !alive) return;

        const { data: blocks } = await supabase
          .from("premium_week_blocks")
          .select("type, title, description, url, cta, payload, sort_order")
          .eq("week_id", header.id)
          .order("sort_order", { ascending: true });

        if (!alive) return;

        setPremiumContent({
          titulo:    header.title,
          intro:     header.intro || "",
          conteudos: (blocks ?? []).map((b) => ({
            tipo:      b.type,
            titulo:    b.title,
            descricao: b.description,
            link:      b.url,
            cta:       b.cta,
            payload:   b.payload,
            isPreview: b.payload?.is_preview === true,
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

  const previewBlocks = premiumContent?.conteudos.filter(b => b.isPreview) ?? [];
  const lockedBlocks  = premiumContent?.conteudos.filter(b => !b.isPreview) ?? [];
  const hasAnyPreview = previewBlocks.length > 0;

  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: bgColor }}>

      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={40} className="opacity-90" priority />
        <UserMenu />
      </header>

      <main className="max-w-3xl mx-auto space-y-8">

        {showBanner && (
          <NascimentoBanner textColor={textColor} onClose={() => setShowBanner(false)} />
        )}

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
                <p className="text-sm text-gray-600">Este conteúdo será liberado conforme você avança na jornada.</p>
                <div className="inline-block px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: `${textColor}15`, color: textColor }}>
                  📅 Disponível em breve
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
          <>
            {loadingPremium && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: textColor }} />
              </div>
            )}

            {!loadingPremium && hasAnyPreview && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: `${textColor}30` }} />
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide" style={{ backgroundColor: textColor, color: "#fff" }}>
                    ✨ Prévia do Conteúdo Premium
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${textColor}30` }} />
                </div>

                <div className="space-y-6">
                  {previewBlocks.map((item, index) => (
                    <PremiumBlockCard key={index} block={item} accentColor={textColor} softBg={bgColor} />
                  ))}
                </div>

                {lockedBlocks.length > 0 && (
                  <div className="space-y-3">
                    {lockedBlocks.map((item, index) => (
                      <LockedBlockCard
                        key={index}
                        block={item}
                        textColor={textColor}
                        onUpgrade={() => router.push("/planos")}
                      />
                    ))}
                  </div>
                )}

                <UpgradeCTA
                  textColor={textColor}
                  onUpgrade={() => router.push("/planos")}
                  blocksCount={lockedBlocks.length}
                />
              </>
            )}

            {!loadingPremium && !hasAnyPreview && (
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/materiais/bebe/${semana}`)}
                  className="px-5 py-3 rounded-xl font-semibold shadow-md bg-white/90 hover:bg-white transition"
                  style={{ color: textColor }}
                >
                  {infoSemana.cta_premium || "Ver conteúdos extras da semana ✨"}
                </button>
              </div>
            )}
          </>
        )}

        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-center gap-3">
          {semana > 1 ? (
            <button onClick={() => router.push(`/semanas/bebe/${semana - 1}`)} className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition" style={{ color: textColor }}>
              ← Semana {semana - 1}
            </button>
          ) : (
            <button onClick={() => router.push(`/semanas/gestante/42`)} className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition" style={{ color: textColor }}>
              ← Gestação
            </button>
          )}

          <button onClick={goToToday} className="px-5 py-2 rounded-xl font-semibold shadow-md" style={{ backgroundColor: textColor, color: "#fff" }}>
            Semana Atual
          </button>

          {semana < 52 ? (
            <button onClick={() => router.push(`/semanas/bebe/${semana + 1}`)} className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition" style={{ color: textColor }}>
              → Semana {semana + 1}
            </button>
          ) : (
            <div className="w-28" />
          )}
        </div>

      </main>

      {showPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quer receber lembretes importantes?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Avisos semanais, marcos do desenvolvimento e datas importantes para não esquecer nada nessa jornada.
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

export default function SemanaBebe({ params }) {
  return (
    <Suspense>
      <SemanaBebePage params={params} />
    </Suspense>
  );
}