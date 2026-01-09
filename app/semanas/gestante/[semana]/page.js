"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import semanasData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";

export default function SemanaGestante({ params }) {
  const router = useRouter();
  const semana = parseInt(params.semana);
  const [infoSemana, setInfoSemana] = useState(null);
  const [semanaAnterior, setSemanaAnterior] = useState(null);
  const [proximaSemana, setProximaSemana] = useState(null);

  useEffect(() => {
    const dados = semanasData.gestante[semana];
    setInfoSemana(dados);
    
    const anterior = semana > 1 ? semana - 1 : null;
    const proxima = semana < 40 ? semana + 1 : null;
    
    setSemanaAnterior(anterior);
    setProximaSemana(proxima);
  }, [semana]);

  function navegarParaSemana(novaSemana) {
    router.push(`/semanas/gestante/${novaSemana}`);
  }

  if (!infoSemana) {
    return <p>Semana não encontrada.</p>;
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: infoSemana.bgColor }}>
      
      {/* 🔥 NOVO HEADER COM MENU */}
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          {/* Logo/Botão Home */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 text-white font-semibold hover:opacity-80 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar</span>
          </button>

          {/* Menu do Usuário */}
          <UserMenu />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        
        {/* Título no Topo */}
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: infoSemana.textColor }}>
          {infoSemana.titulo}
        </h1>

        {/* Navegação Abaixo do Título */}
        <div className="flex justify-between items-center mb-8">
          {semanaAnterior ? (
            <button
              onClick={() => navegarParaSemana(semanaAnterior)}
              className="flex items-center px-4 py-2 bg-white bg-opacity-80 rounded-lg shadow-md hover:bg-opacity-100 transition-all"
              style={{ color: infoSemana.textColor }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Semana {semanaAnterior}
            </button>
          ) : (
            <div></div>
          )}

          {proximaSemana ? (
            <button
              onClick={() => navegarParaSemana(proximaSemana)}
              className="flex items-center px-4 py-2 bg-white bg-opacity-80 rounded-lg shadow-md hover:bg-opacity-100 transition-all"
              style={{ color: infoSemana.textColor }}
            >
              Semana {proximaSemana}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div></div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-lg leading-relaxed mb-6" style={{ color: infoSemana.textColor }}>
            {infoSemana.descricao}
          </p>

          {infoSemana.dica && (
            <div className="mb-6 p-4 rounded-lg shadow-md" style={{ backgroundColor: infoSemana.bgColor }}>
              <h2 className="font-bold text-lg mb-2">Dica</h2>
              <p>{infoSemana.dica}</p>
            </div>
          )}

          {infoSemana.acompanhe && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <h3 className="font-bold text-lg mb-2 text-yellow-800">Acompanhe</h3>
              <p className="text-yellow-700">{infoSemana.acompanhe}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}