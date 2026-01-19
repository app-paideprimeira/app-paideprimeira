"use client";

import { useRouter } from "next/navigation";
import materiais from "../../../../data/materiais-gestante.json";
import UserMenu from "../../../components/UserMenu";
import MaterialCard from "../../../components/MaterialCard";

export default function MaterialGestante({ params }) {
  const router = useRouter();
  const semana = Number(params.semana);

  const material = materiais[semana];

  if (!material) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">
          Material não disponível
        </h1>
        <p className="text-gray-600 mb-6">
          Ainda não temos materiais para essa semana da gestação.
        </p>

        <button
          onClick={() => router.push(`/semanas/gestante/${semana}`)}
          className="text-blue-600 font-medium hover:underline"
        >
          ← Voltar para a semana {semana}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* HEADER */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <button
          onClick={() => router.push(`/semanas/gestante/${semana}`)}
          className="text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          ← Voltar para Semana {semana}
        </button>

        <UserMenu />
      </header>

      <main className="max-w-3xl mx-auto space-y-8">
        {/* TÍTULO */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            {material.titulo}
          </h1>
          <p className="text-gray-600">
            {material.intro}
          </p>
        </div>

        {/* CONTEÚDOS */}
        <div className="space-y-6">
          {material.conteudos.map((item, index) => (
            <MaterialCard key={index} item={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
