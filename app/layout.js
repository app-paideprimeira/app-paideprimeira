import "./globals.css";
import Script from "next/script";
import SWRegister from "./sw-register";

export const metadata = {
  title: "Pai de Primeira",
  description: "Apoio para pais de primeira viagem",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E3A8A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        {/* 🔔 OneSignal SDK (apenas carrega, não inicializa) */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
      </head>

      <body className="min-h-screen bg-gray-100">
        {/* 🔧 Registro global do Service Worker */}
        <SWRegister />

        {/* Conteúdo das páginas */}
        {children}
      </body>
    </html>
  );
}
