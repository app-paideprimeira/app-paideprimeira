"use client";

// components/SessionLimitModal.jsx
// Exibido quando o usuário tenta logar em um 3º dispositivo.

import { signOutClean } from "../../lib/session/useSession";
import { useRouter } from "next/navigation";

export default function SessionLimitModal() {
  const router = useRouter();

  async function handleSignOut() {
    await signOutClean();
    router.replace("/auth/login");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">

        <div className="text-4xl">🔒</div>

        <h2 className="text-xl font-bold text-gray-900">
          Limite de dispositivos atingido
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed">
          Sua conta já está ativa em <strong>2 dispositivos</strong>.
          Para acessar aqui, saia em um dos outros dispositivos primeiro.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
          <p className="text-xs text-amber-800 font-medium">
            💡 Como liberar acesso
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Abra o app no outro dispositivo, acesse o menu do usuário e clique em "Sair". 
            Sessões inativas por 15 dias são liberadas automaticamente.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition"
        >
          Entendi, sair desta tentativa
        </button>

      </div>
    </div>
  );
}