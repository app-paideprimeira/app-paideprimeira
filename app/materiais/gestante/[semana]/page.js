"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import { supabaseBrowser } from "../../../../lib/supabase/client";

export default function MaterialGestante({ params }) {
  const router = useRouter();
  const semana = Number(params.semana);

  const theme = semanaData.gestante?.[semana];
  const bgColor = theme?.bgColor || "#F3F4F6";
  const textColor = theme?.textColor || "#111827";

  const [loading, setLoading] = useState(true);

  /* ─────────────────────────────────────────────
     Se premium → redireciona para a semana
     (o conteúdo já está lá integrado)
     Se free → exibe paywall
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!Number.isFinite(semana) || semana <= 0) {
      setLoading(false);
      return;
    }

    let alive = true;

    async function check() {
      const supabase = supabaseBrowser();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (alive) router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (profile?.is_premium) {
        // Premium — manda de volta pra semana onde o conteúdo já aparece
        router.replace(`/semanas/gestante/${semana}`);
      } else {
        // Free — exibe o paywall
        setLoading(false);
      }
    }

    check();
    return () => { alive = false; };
  }, [semana, router]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="animate-spin rounded-full h-9 w-9 border-b-2"
          style={{ borderColor: textColor }}
        />
      </div>
    );
  }

  /* ── Paywall (usuário free) ── */
  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: bgColor }}>

      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <Image
          src="/logo/logo-app.svg"
          alt="Pai de Primeira"
          width={140}
          height={40}
          className="opacity-90"
          priority
        />
        <UserMenu />
      </header>

      <main className="max-w-3xl mx-auto">
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 md:p-8 border border-white/40 space-y-6">

          {/* Topo */}
          <div className="text-center space-y-3">
            <div className="text-4xl">👑</div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: textColor }}>
              Conteúdo Premium — Semana {semana}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Checklists práticos, textos exclusivos e materiais selecionados
              para você acompanhar cada semana com mais segurança.
            </p>
          </div>

          {/* O que está incluído */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: `${bgColor}55`, borderLeft: `5px solid ${textColor}` }}
          >
            <p className="font-semibold text-sm" style={{ color: textColor }}>
              ✨ O que você desbloqueia
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>✅</span> Checklists interativos por semana
              </li>
              <li className="flex items-start gap-2">
                <span>🎥</span> Vídeos e podcasts selecionados
              </li>
              <li className="flex items-start gap-2">
                <span>📝</span> Textos exclusivos de pai pra pai
              </li>
              <li className="flex items-start gap-2">
                <span>🛒</span> Dicas de produtos que fazem sentido
              </li>
              <li className="flex items-start gap-2">
                <span>📖</span> Leituras recomendadas e curadas
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/premium/assinar")}
              className="w-full py-3 rounded-xl font-semibold shadow-md transition hover:opacity-95"
              style={{ backgroundColor: textColor, color: "#fff" }}
            >
              Desbloquear Premium 👑
            </button>

            <button
              onClick={() => router.push(`/semanas/gestante/${semana}`)}
              className="w-full py-3 rounded-xl font-semibold bg-white/80 hover:bg-white transition"
              style={{ color: textColor }}
            >
              ← Voltar para a semana {semana}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">
            Você pode cancelar quando quiser.
          </p>

        </div>
      </main>
    </div>
  );
}