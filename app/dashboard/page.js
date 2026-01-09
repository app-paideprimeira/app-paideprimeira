"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function Dashboard() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Carregando...");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        setMessage("Verificando sua conta...");
        
        // 1. Verificar se usuário está logado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log("❌ Usuário não autenticado, redirecionando para login");
          router.push("/auth/login");
          return;
        }

        setMessage("Carregando seus dados...");

        // ✅ BUSCAR NOME DO USUÁRIO PARA MENSAGEM PERSONALIZADA
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single();

        if (profile?.nome) {
          setUserName(profile.nome);
          setMessage(`Quase lá, ${profile.nome.split(' ')[0]}...`);
        }

        // 2. Verificar status do onboarding
        const { data: onboardingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (profileError || !onboardingProfile) {
          console.log("❌ Perfil não encontrado, redirecionando para onboarding");
          router.push("/onboarding");
          return;
        }

        if (!onboardingProfile.onboarding_complete) {
          console.log("➡️ Onboarding incompleto, redirecionando");
          router.push("/onboarding");
          return;
        }

        setMessage("Calculando sua semana atual...");

        // 3. Onboarding completo - redirecionar direto para semana atual
        await redirecionarParaSemanaAtual(user.id);

      } catch (error) {
        console.error("❌ Erro na verificação:", error);
        // Em caso de erro, mostrar dashboard como fallback
        setLoading(false);
        setMessage("Erro ao carregar. Redirecionando para o dashboard...");
        setTimeout(() => {
          router.push("/dashboard/main");
        }, 2000);
      }
    }

    checkAndRedirect();
  }, []);

  async function redirecionarParaSemanaAtual(userId) {
    try {
      setMessage(userName ? `Buscando suas informações, ${userName.split(' ')[0]}...` : "Buscando suas informações...");

      // Buscar o último registro do parent_profile do usuário
      const { data: parentProfile, error } = await supabase
        .from('parent_profile')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log("❌ Nenhum dado encontrado, indo para dashboard principal");
        router.push("/dashboard/main");
        return;
      }

      setMessage("Quase lá...");

      const hoje = new Date();
      
      if (parentProfile.tipo === "nascimento") {
        // 👶 Bebê já nasceu - calcular semanas de vida
        const dataNascimento = new Date(parentProfile.data_evento);
        const diffDias = Math.floor((hoje - dataNascimento) / (1000 * 60 * 60 * 24));
        const semanas = Math.max(0, Math.floor(diffDias / 7));
        
        console.log(`🎯 Redirecionando para área do bebê - ${semanas} semanas`);
        router.push("/bebe");
      } else {
        // 🤰 Gestante - calcular semana atual
        const dataParto = new Date(parentProfile.data_evento);
        const dataUltimaMenstruacao = new Date(dataParto);
        dataUltimaMenstruacao.setDate(dataUltimaMenstruacao.getDate() - 280);

        const diffDias = Math.floor(
          (hoje - dataUltimaMenstruacao) / (1000 * 60 * 60 * 24)
        );

        const semanas = Math.min(40, Math.max(0, Math.floor(diffDias / 7)));

        console.log(`🎯 Redirecionando para semana ${semanas} da gestante`);
        router.push(`/semanas/gestante/${semanas}`);
      }

    } catch (error) {
      console.error("❌ Erro ao redirecionar:", error);
      // Fallback para dashboard principal
      router.push("/dashboard/main");
    }
  }

  // Tela de loading enquanto faz a verificação
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
        <p className="text-gray-400 text-sm mt-2">Aguarde um momento...</p>
      </div>
    </div>
  );
}