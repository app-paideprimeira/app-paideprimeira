import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function calculateCurrentWeek(baseWeek: number, baseDate: string) {
  const now = new Date();
  const start = new Date(baseDate);

  const diffInMs = now.getTime() - start.getTime();
  const diffInWeeks = Math.floor(
    diffInMs / (1000 * 60 * 60 * 24 * 7)
  );

  return baseWeek + diffInWeeks;
}

export async function getUserState() {
  const supabase = createServerComponentClient({ cookies });

  // 🔐 Usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      onboardingComplete: false,
      stage: null,
      currentWeek: null,
    };
  }

  // 📄 Perfil
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_complete, stage, current_week, created_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return {
      user,
      onboardingComplete: false,
      stage: null,
      currentWeek: null,
    };
  }

  // 🧠 cálculo da semana real
  const calculatedWeek = calculateCurrentWeek(
    profile.current_week,
    profile.created_at
  );

  // 🔒 limites de segurança
  const maxWeek = profile.stage === "gestante" ? 42 : 52;
  const safeWeek = Math.min(calculatedWeek, maxWeek);

  return {
    user,
    onboardingComplete: profile.onboarding_complete,
    stage: profile.stage,
    currentWeek: safeWeek,
  };
}
