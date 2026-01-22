"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import { calcularSemanaAtual } from "../../lib/navigation/calcularSemanaAtual";

export default function Dashboard() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    async function resolve() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "onboarding_complete, stage, base_week, base_week_date"
        )
        .eq("id", user.id)
        .single();

      if (error || !profile || !profile.onboarding_complete) {
        router.replace("/onboarding");
        return;
      }

      const { stage, base_week, base_week_date } = profile;

      // 🔒 Segurança: se não houver base_week, algo quebrou
      if (!base_week || !base_week_date) {
        router.replace("/onboarding");
        return;
      }

      const semanaAtual = calcularSemanaAtual(
        base_week,
        base_week_date,
        stage
      );

      // Atualiza current_week apenas como cache
      await supabase.from("profiles").update({
        current_week: semanaAtual,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      router.replace(
        stage === "bebe"
          ? `/semanas/bebe/${semanaAtual}`
          : `/semanas/gestante/${semanaAtual}`
      );
    }

    resolve();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
