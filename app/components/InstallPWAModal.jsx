"use client";

// app/components/InstallPWAModal.jsx

import { useInstallPrompt } from "../../lib/pwa/useInstallPrompt";

// Instruções por browser iOS
const IOS_INSTRUCTIONS = {
  "ios-safari": [
    { icon: "⬆️", text: 'Toque no botão "Compartilhar" na barra inferior do Safari' },
    { icon: "➕", text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
    { icon: "✅", text: 'Toque em "Adicionar" no canto superior direito' },
  ],
  "ios-chrome": [
    { icon: "⋯",  text: 'Toque nos três pontos (⋯) no canto inferior direito' },
    { icon: "➕", text: 'Toque em "Adicionar à tela de início"' },
    { icon: "✅", text: 'Toque em "Adicionar" para confirmar' },
  ],
  "ios-firefox": [
    { icon: "⋯",  text: 'Toque nos três pontos no canto inferior direito' },
    { icon: "➕", text: 'Toque em "Adicionar à tela de início"' },
    { icon: "✅", text: 'Toque em "Adicionar" para confirmar' },
  ],
  "ios-edge": [
    { icon: "⋯",  text: 'Toque nos três pontos na barra inferior' },
    { icon: "📱", text: 'Toque em "Adicionar à tela de início"' },
    { icon: "✅", text: 'Toque em "Adicionar" para confirmar' },
  ],
};

const IOS_BROWSER_NAMES = {
  "ios-safari":  "Safari",
  "ios-chrome":  "Chrome",
  "ios-firefox": "Firefox",
  "ios-edge":    "Edge",
};

export default function InstallPWAModal() {
  const { showModal, platform, triggerInstall, dismissInstall } = useInstallPrompt();

  if (!showModal || !platform) return null;

  const isIOS      = platform.startsWith("ios");
  const steps      = IOS_INSTRUCTIONS[platform] ?? IOS_INSTRUCTIONS["ios-safari"];
  const browserName = IOS_BROWSER_NAMES[platform] ?? "Safari";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn .2s ease",
    }}>
      <div style={{
        background: "#fff",
        width: "100%",
        maxWidth: 480,
        borderRadius: "24px 24px 0 0",
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(0,0,0,.15)",
        animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)",
      }}>

        {/* Ícone + cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, #1E3A8A, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", boxShadow: "0 4px 12px rgba(59,130,246,.35)",
          }}>
           <img src="/icons/icon-192.png" alt="Pai de Primeira" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "#0f172a", margin: 0 }}>
              Adicionar à tela inicial
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
              Acesse mais rápido, sem abrir o navegador
            </p>
          </div>
        </div>

        {/* Benefícios */}
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: "⚡", text: "Abre instantaneamente como um app" },
            { icon: "🔔", text: "Recebe lembretes semanais" },
            { icon: "📵", text: "Funciona offline" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#334155" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Instruções iOS */}
        {isIOS && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Como instalar no {browserName}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map(({ icon, text }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "#1E3A8A", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#334155", lineHeight: 1.4 }}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(platform === "android" || platform === "desktop") && (
            <button onClick={triggerInstall} style={{
              width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #1E3A8A, #3b82f6)",
              color: "#fff", fontSize: 16, fontWeight: 800,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(59,130,246,.35)",
            }}>
              📲 Instalar agora
            </button>
          )}

          <button onClick={dismissInstall} style={{
            width: "100%", padding: "13px 0", borderRadius: 14,
            border: "1.5px solid #e2e8f0", background: "transparent",
            color: "#64748b", fontSize: 15, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}>
            {isIOS ? "Entendi, farei depois" : "Agora não"}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}