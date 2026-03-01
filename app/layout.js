import "./globals.css";
import SWRegister from "./sw-register";
import InstallPWAModal from "./components/InstallPWAModal";

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
      <body className="min-h-screen bg-gray-100">
        <SWRegister />
        {children}
        <InstallPWAModal />
      </body>
    </html>
  );
}