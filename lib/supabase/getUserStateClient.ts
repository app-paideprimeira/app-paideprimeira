import { supabaseBrowser } from "./client";

export async function getUserStateClient() {
  const supabase = supabaseBrowser();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, stage, current_week")
    .eq("id", user.id)
    .single();

  if (!profile) {
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
