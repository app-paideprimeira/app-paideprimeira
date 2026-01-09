"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";

export default function SemanaBebe({ params }) {
  const router = useRouter();
  const semana = parseInt(params.semana);
  const [infoSemana, setInfoSemana] = useState(null);
  const [semanaAnterior, setSemanaAnterior] = useState(null);
  const [proximaSemana, setProximaSemana] = useState(null);

  useEffect(() => {
    const dados = semanaData.bebe[semana];
    setInfoSemana(dados);
    
    const anterior = semana > 1 ? semana - 1 : null;
    const proxima = semana < 52 ? semana + 1 : null;
    
    setSemanaAnterior(anterior);
    setProximaSemana(proxima);
  }, [semana]);

  function navegarParaSemana(novaSemana) {
    router.push(`/semanas/bebe/${novaSemana}`);
  }

  if (!infoSemana) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Semana {semana} do bebê não encontrada
        </h1>
        <p>Conteúdo para esta semana do bebê ainda não está disponível.</p>
      </div>
    );
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
          <p className="mb-6 text-lg leading-relaxed" style={{ color: infoSemana.textColor }}>
            {infoSemana.descricao}
          </p>

          {infoSemana.dica && (
            <div 
              className="p-4 rounded-lg mb-6 shadow-md"
              style={{ 
                backgroundColor: infoSemana.bgColor + '20',
                borderLeft: `4px solid ${infoSemana.textColor}`
              }}
            >
              <h2 className="font-bold text-lg mb-2" style={{ color: infoSemana.textColor }}>
                Dica
              </h2>
              <p style={{ color: infoSemana.textColor }}>{infoSemana.dica}</p>
            </div>
          )}

          {infoSemana.acompanhe && (
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-bold text-lg mb-2 text-blue-800">Acompanhe</h3>
              <p className="text-blue-700">{infoSemana.acompanhe}</p>
            </div>
          )}

          {infoSemana.imagens && infoSemana.imagens.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-3" style={{ color: infoSemana.textColor }}>
                Imagens
              </h3>
              <div className="grid gap-4">
                {infoSemana.imagens.map((imagem, index) => (
                  <div key={index} className="relative h-64 w-full">
                    <img
                      src={imagem}
                      alt={`Imagem ${infoSemana.titulo}`}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}