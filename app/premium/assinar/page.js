"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AssinarPremium() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-16 pb-10">
      
      {/* LOGO */}
      <div className="mb-10">
        <Image
          src="/logo/logo-app.svg"
          alt="Pai de Primeira"
          width={400}
          height={200}
          className="w-72 mx-auto drop-shadow-md"
          priority
        />
      </div>

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 border border-[#E5E7EB] space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Torne-se Premium 👑
          </h1>
          <p className="text-gray-600 text-sm">
            Conteúdos aprofundados, checklists práticos e materiais extras
            para você viver essa jornada com mais segurança.
          </p>
        </div>

        {/* BENEFÍCIOS */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span>📝</span>
            <p>Textos exclusivos semana a semana</p>
          </div>

          <div className="flex items-start gap-3">
            <span>✅</span>
            <p>Checklists práticos e objetivos</p>
          </div>

          <div className="flex items-start gap-3">
            <span>🎧</span>
            <p>Indicações de vídeos, áudios e leituras selecionadas</p>
          </div>

          <div className="flex items-start gap-3">
            <span>📌</span>
            <p>Lembretes importantes que fazem diferença</p>
          </div>
        </div>

        {/* CTA PRINCIPAL */}
        <button
          onClick={() => alert("Integração de pagamento em breve 🚀")}
          className="w-full py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold hover:bg-[#172554] transition"
        >
          Desbloquear Premium
        </button>

        {/* VOLTAR */}
        <button
          onClick={() => router.back()}
          className="w-full text-sm text-[#1E3A8A] font-medium hover:underline"
        >
          ← Voltar
        </button>

        <p className="text-xs text-center text-gray-500 pt-4 border-t">
          Você pode cancelar quando quiser.
        </p>
      </div>
    </div>
  );
}