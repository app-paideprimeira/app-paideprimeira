// lib/session/useSession.js

import { supabaseBrowser } from "../supabase/client";

const SESSION_TOKEN_KEY  = "ppf_session_token";
const HEARTBEAT_INTERVAL = 5 * 60 * 1000;  // heartbeat a cada 5 min
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2h — deve bater com o SQL

// ── Gera ou recupera token único do dispositivo ──
function getOrCreateSessionToken() {
  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

// ── Detecta hint do dispositivo ──
function getDeviceHint() {
  const ua = navigator.userAgent;
  let browser = "Navegador";
  let device  = "Dispositivo";

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua))         browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua))                        browser = "Firefox";
  else if (/Edg/i.test(ua))                            browser = "Edge";

  if (/iPhone|iPad/i.test(ua))  device = "iPhone/iPad";
  else if (/Android/i.test(ua)) device = "Android";
  else if (/Mac/i.test(ua))     device = "Mac";
  else if (/Windows/i.test(ua)) device = "Windows";

  return `${browser} · ${device}`;
}

// ── Estado global do heartbeat (singleton) ──
let heartbeatTimer    = null;
let currentToken      = null;
let visibilityHandler = null;

// ── Verifica e registra sessão ──
// Retorna 'ok' ou 'limit_reached'
export async function checkAndRegisterSession(userId) {
  const supabase = supabaseBrowser();
  const token    = getOrCreateSessionToken();
  currentToken   = token;

  const { data, error } = await supabase.rpc("register_session", {
    p_user_id:     userId,
    p_token:       token,
    p_device_hint: getDeviceHint(),
  });

  if (error || data === "limit_reached") {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    currentToken = null;
    return "limit_reached";
  }

  startHeartbeat();
  return "ok";
}

// ── Heartbeat — mantém last_seen_at atualizado ──
function startHeartbeat() {
  stopHeartbeat();

  // Dispara imediatamente e depois a cada 5 min
  sendHeartbeat();
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // visibilitychange — mais confiável que beforeunload no mobile
  // Quando a aba/app vai para background, para o heartbeat
  // Quando volta, retoma
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
  }

  visibilityHandler = () => {
    if (document.visibilityState === "hidden") {
      // App foi para background — para heartbeat
      // O SQL vai expirar a sessão após 2h de inatividade
      stopHeartbeatTimer();
    } else {
      // App voltou ao foreground — retoma heartbeat
      sendHeartbeat();
      heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    }
  };

  document.addEventListener("visibilitychange", visibilityHandler);
}

async function sendHeartbeat() {
  if (!currentToken) return;
  try {
    const supabase = supabaseBrowser();
    await supabase.rpc("refresh_session", { p_token: currentToken });
  } catch (_) {
    // silencioso — não quebra o app
  }
}

function stopHeartbeatTimer() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function stopHeartbeat() {
  stopHeartbeatTimer();
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
}

// ── Logout limpo ──
export async function signOutClean() {
  const supabase = supabaseBrowser();
  const token    = localStorage.getItem(SESSION_TOKEN_KEY);

  stopHeartbeat();

  if (token) {
    try {
      await supabase.rpc("remove_session", { p_token: token });
    } catch (_) {
      // silencioso
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }

  currentToken = null;
  await supabase.auth.signOut();
}