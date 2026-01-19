// lib/navigation/useGoToToday.js

"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../supabase/client";
import { resolveUserRoute } from "./resolveUserRoute";

export function useGoToToday() {
  const router = useRouter();

  async function goToToday() {
    const supabase = supabaseBrowser();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const route = resolveUserRoute({
      user,
      profile,
    });

    router.push(route);
  }

  return { goToToday };
}
