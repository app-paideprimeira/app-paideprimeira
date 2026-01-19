import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getUserState() {
  const supabase = createServerComponentClient({
    cookies,
  });

  // 🔐 Usuário autenticado (lido do cookie HTTP-only)
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

  // 📄 Perfil oficial
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_complete, stage, current_week")
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

  return {
    user,
    onboardingComplete: profile.onboarding_complete,
    stage: profile.stage,
    currentWeek: profile.current_week,
  };
}
