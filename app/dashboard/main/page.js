"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/client";

export default function DashboardMain() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
      
      // ✅ BUSCAR PERFIL DO USUÁRIO COM O NOME
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
    }
    loadUser();
  }, []);

  function go(path) {
    router.push(path);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ✅ EXIBIR NOME DO USUÁRIO (se disponível) */}
      <h1 className="text-3xl font-bold mb-4">
        {userProfile?.nome ? (
          <>
            Bem-vindo, <span className="text-blue-600">{userProfile.nome}</span>! 👋
          </>
        ) : (
          `Bem-vindo, ${user?.email}`
        )}
      </h1>

      <p className="mb-6 text-gray-600">
        {userProfile?.nome 
          ? `Que bom ter você aqui, ${userProfile.nome.split(' ')[0]}! Escolha uma área do aplicativo:`
          : "Escolha uma área do aplicativo:"
        }
      </p>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => go("/gestante")}
          className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition-colors"
        >
          Área da Gestante
        </button>

        <button
          onClick={() => go("/bebe")}
          className="bg-green-600 text-white p-3 rounded hover:bg-green-700 transition-colors"
        >
          Área do Bebê
        </button>

        <button
          onClick={() => go("/semanas/gestante")}
          className="bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition-colors"
        >
          Semanas da Gestante
        </button>

        <button
          onClick={() => go("/semanas/bebe")}
          className="bg-pink-600 text-white p-3 rounded hover:bg-pink-700 transition-colors"
        >
          Semanas do Bebê
        </button>

        <button
          onClick={() => go("/onboarding")}
          className="bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 transition-colors"
        >
          Alterar Dados
        </button>
      </div>

      {/* 🔧 BOTÃO DE TESTE - RESETAR ONBOARDING */}
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ onboarding_complete: false })
              .eq('id', user.id);
            alert('Onboarding resetado! Faça login novamente.');
            await supabase.auth.signOut();
            router.push('/auth/login');
          }
        }}
        className="mt-6 bg-yellow-600 text-white p-3 rounded w-full hover:bg-yellow-700 font-semibold"
      >
        🔄 Resetar Onboarding (BOTÃO DE TESTE)
      </button>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/auth/login");
        }}
        className="mt-4 bg-red-600 text-white p-2 rounded w-full hover:bg-red-700"
      >
        Sair
      </button>
    </div>
  );
}