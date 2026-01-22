"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import WeekCard from "../../../components/WeekCard";
import { useGoToToday } from "../../../../lib/navigation/useGoToToday";
import { supabaseBrowser } from "../../../../lib/supabase/client";
import { registerPush } from "../../../../lib/push/registerPush";

export default function SemanaGestante({ params }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const { goToToday } = useGoToToday();

  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [userId, setUserId] = useState(null);

  const semana = Number(params.semana);
  const infoSemana = semanaData.gestante?.[semana];

  /* ────────────────────────────────
     BUSCA USUÁRIO + CONTROLE DO PUSH
  ──────────────────────────────── */
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("push_prompt_shown, push_enabled")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      // Só agenda o prompt se ainda não foi mostrado nem ativado
      if (!profile.push_prompt_shown && !profile.push_enabled) {
        const timer = setTimeout(() => {
          setShowPushPrompt(true);
        }, 15000);

        return () => clearTimeout(timer);
      }
    }

    init();
  }, [supabase]);

  /* ────────────────────────────────
     AÇÕES DO PROMPT
  ──────────────────────────────── */
  async function handleEnablePush() {
    if (!userId) return;

    const subscription = await registerPush(userId);

    if (subscription) {
      await supabase.from("push_notifications").insert(subscription);
    }

    await supabase
      .from("profiles")
      .update({
        push_enabled: true,
        push_prompt_shown: true,
      })
      .eq("id", userId);

    setShowPushPrompt(false);
  }

  async function handleDismissPush() {
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({ push_prompt_shown: true })
      .eq("id", userId);

    setShowPushPrompt(false);
  }

  /* ──────────────────────────────── */

  if (!infoSemana) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Semana não encontrada.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: infoSemana.bgColor }}
    >
      {/* HEADER */}
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

      <main className="max-w-3xl mx-auto space-y-8">
        <WeekCard data={infoSemana} />

        {/* NAVEGAÇÃO ENTRE SEMANAS */}
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={semana <= 1}
            onClick={() => router.push(`/semanas/gestante/${semana - 1}`)}
            className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40"
            style={{ color: infoSemana.textColor }}
          >
            ← Semana {semana - 1}
          </button>

          <button
            onClick={goToToday}
            className="px-5 py-2 rounded-xl font-semibold shadow-md"
            style={{
              backgroundColor: infoSemana.textColor,
              color: "#fff",
            }}
          >
            Semana Atual
          </button>

          <button
            disabled={semana >= 42}
            onClick={() => router.push(`/semanas/gestante/${semana + 1}`)}
            className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40"
            style={{ color: infoSemana.textColor }}
          >
            → Semana {semana + 1}
          </button>
        </div>
      </main>

      {/* ────────────────────────────────
          PUSH PROMPT
      ──────────────────────────────── */}
      {showPushPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Quer receber lembretes importantes?
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Avisos semanais da gestação, exames importantes e datas que fazem
              diferença nesse momento.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDismissPush}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600"
              >
                Agora não
              </button>

              <button
                onClick={handleEnablePush}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Ativar avisos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
