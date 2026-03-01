// lib/pwa/useInstallPrompt.js

import { useState, useEffect } from "react";

const INSTALL_DISMISSED_KEY = "ppf_install_dismissed";
const SHOW_DELAY_MS         = 3 * 60 * 1000; // 3 minutos

export function useInstallPrompt() {
  const [showModal, setShowModal]           = useState(false);
  const [platform, setPlatform]             = useState(null); // 'ios-safari' | 'ios-chrome' | 'ios-other' | 'android' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Já está rodando como PWA instalado
    if (window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Usuário já dispensou
    if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    const ua      = navigator.userAgent;
    const isIOS   = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      // Detecta browser específico no iOS
      const isSafari  = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
      const isChrome  = /CriOS/i.test(ua);
      const isFirefox = /FxiOS/i.test(ua);
      const isEdge    = /EdgiOS/i.test(ua);

      if (isSafari)       setPlatform("ios-safari");
      else if (isChrome)  setPlatform("ios-chrome");
      else if (isFirefox) setPlatform("ios-firefox");
      else if (isEdge)    setPlatform("ios-edge");
      else                setPlatform("ios-safari"); // fallback

      setTimeout(() => setShowModal(true), SHOW_DELAY_MS);
      return;
    }

    // Android / Desktop — evento nativo
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform(isAndroid ? "android" : "desktop");
      setTimeout(() => setShowModal(true), SHOW_DELAY_MS);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowModal(false);
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    });

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    }
    setShowModal(false);
    setDeferredPrompt(null);
  }

  function dismissInstall() {
    setShowModal(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  }

  return { showModal, platform, isInstalled, triggerInstall, dismissInstall };
}