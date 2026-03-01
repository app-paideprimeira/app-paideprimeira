"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import { calcularSemanaAtual } from "../../lib/navigation/calcularSemanaAtual";
import { checkAndRegisterSession } from "../../lib/session/useSession";
import SessionLimitModal from "../components/SessionLimitModal";

export default function Dashboard() {
  const router = useRouter();
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    async function resolve() {
      const supabase = supabaseBrowser();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // ── Verifica limite de sessões ANTES de redirecionar ──
      const sessionResult = await checkAndRegisterSession(user.id);

      if (sessionResult === "limit_reached") {
        setLimitReached(true);
        return; // para aqui — não redireciona
      }

      // ── Sessão ok — continua o fluxo normal ──
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_complete, stage, base_week, base_week_date")
        .eq("id", user.id)
        .single();

      if (error || !profile || !profile.onboarding_complete) {
        router.replace("/onboarding");
        return;
      }

      const { stage, base_week, base_week_date } = profile;

      if (!base_week || !base_week_date) {
        router.replace("/onboarding");
        return;
      }

      const semanaAtual = calcularSemanaAtual(base_week, base_week_date, stage);

      await supabase
        .from("profiles")
        .update({ current_week: semanaAtual, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      router.replace(
        stage === "bebe"
          ? `/semanas/bebe/${semanaAtual}`
          : `/semanas/gestante/${semanaAtual}`
      );
    }

    resolve();
  }, [router]);

  // Bloqueio por limite de sessões
  if (limitReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SessionLimitModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}