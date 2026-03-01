// lib/push/usePushPrompt.js

import { useState, useEffect } from "react";
import { supabaseBrowser } from "../supabase/client";

const PROMPT_DELAY_MS = 15000;

export function usePushPrompt(userId) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading]       = useState(false);

  // ── Verifica se deve mostrar o prompt ──
  useEffect(() => {
    if (!userId) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Já decidido pelo browser — não mostra prompt customizado
    if (Notification.permission !== "default") return;

    let timer;

    async function check() {
      const supabase = supabaseBrowser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("push_prompt_shown, push_enabled")
        .eq("id", userId)
        .single();

      if (!profile) return;
      if (!profile.push_prompt_shown && !profile.push_enabled) {
        timer = setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS);
      }
    }

    check();
    return () => clearTimeout(timer);
  }, [userId]);

  // ── Ativa push ──
  async function enablePush() {
    if (!userId || loading) return;
    setLoading(true);

    try {
      // 1. Solicita permissão — pode demorar (usuário decide)
      const permission = await Notification.requestPermission();

      // Independente da resposta, marca prompt como visto e fecha
      await markPromptShown();
      setShowPrompt(false);
      setLoading(false);

      if (permission !== "granted") return;

      // 2. Cria subscription (em background, sem travar a UI)
      const swReg = await navigator.serviceWorker.ready;

      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });

      // 3. Salva no banco
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, subscription }),
      });

    } catch (err) {
      console.error("Erro ao ativar push:", err);
      // Garante que o prompt some mesmo em caso de erro
      await markPromptShown();
      setShowPrompt(false);
      setLoading(false);
    }
  }

  // ── Dispensa o prompt ──
  async function dismissPush() {
    setShowPrompt(false);
    await markPromptShown();
  }

  // ── Marca prompt como visto no banco ──
  async function markPromptShown() {
    if (!userId) return;
    try {
      const supabase = supabaseBrowser();
      await supabase
        .from("profiles")
        .update({ push_prompt_shown: true })
        .eq("id", userId);
    } catch (_) {
      // silencioso
    }
  }

  return { showPrompt, loading, enablePush, dismissPush };
}

// ── Converte VAPID key ──
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}