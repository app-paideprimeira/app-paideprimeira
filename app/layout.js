import "./globals.css";
import SWRegister from "./sw-register";

export const metadata = {
  title: "Pai de Primeira",
  description: "Apoio para pais de primeira viagem",

  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// ✅ Next.js 14 usa viewport para themeColor
export const viewport = {
  themeColor: "#1E3A8A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* 🔧 Registro global do Service Worker */}
        <SWRegister />

        {/* Container central do app */}
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">
          {children}
        </div>
      </body>
    </html>
  );
}
