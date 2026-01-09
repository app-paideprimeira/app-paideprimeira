"use client";

import { useSearchParams } from "next/navigation";
import Title from "../components/Title";

export default function BebePage() {
  const params = useSearchParams();
  const semana = params.get("semana") ?? 0;

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md mx-auto">
      <Title>Bebê • Semana {semana}</Title>

      <p className="mt-4 text-gray-700">
        Aqui começa o conteúdo do desenvolvimento do bebê na semana {semana}.  
        Depois vamos integrar o conteúdo exato da semana com base na sua base de dados.
      </p>

      <p className="mt-4 text-gray-500 text-sm">
        (Esta é apenas a tela base.  
        O onboarding já faz todo o cálculo e salva no banco automaticamente.)
      </p>
    </div>
  );
}
