"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export async function initOneSignal(userId: string) {
  if (typeof window === "undefined") return;
  if (!(window as any).OneSignalDeferred) return;

  const supabase = supabaseBrowser();

  (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      // Associa o usuário logado ao OneSignal
      await OneSignal.login(userId);

      // Solicita permissão (OneSignal controla UX)
      const permission = await OneSignal.Notifications.requestPermission();

      // Atualiza perfil no Supabase
      await supabase
        .from("profiles")
        .update({
          push_prompt_shown: true,
          push_enabled: permission === "granted",
        })
        .eq("id", userId);

      console.log("[Push] OneSignal inicializado:", permission);
    } catch (err) {
      console.error("[Push] Erro OneSignal", err);
    }
  });
}
