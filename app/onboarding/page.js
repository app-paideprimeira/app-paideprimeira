"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function Onboarding() {
  const [tipo, setTipo] = useState("gravidez");
  const [data, setData] = useState("");
  const [genero, setGenero] = useState("menino");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function salvar() {
    if (!data) {
      alert("Por favor, informe a data!");
      return;
    }

    setLoading(true);

    const supabase = supabaseBrowser();

    try {
      // 🔐 Buscar usuário atual (logado)
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        alert("Você precisa estar logado.");
        router.push("/auth/login");
        return;
      }

      console.log("💾 Salvando dados do onboarding...");

      // 🧾 Salvar escolha no banco
      const { error } = await supabase.from("parent_profile").insert({
        user_id: user.id,
        tipo,
        data_evento: data,
        genero,
      });

      if (error) {
        console.error("❌ Erro ao salvar parent_profile:", error);
        alert("Erro ao salvar informações.");
        setLoading(false);
        return;
      }

      // ✅ ATUALIZAR STATUS DO ONBOARDING PARA COMPLETO
      console.log("✅ Atualizando status do onboarding...");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Erro ao atualizar onboarding:', profileError);
      } else {
        console.log('✅ Onboarding marcado como completo!');
      }

      // 📅 Cálculo de semanas e REDIRECIONAMENTO CORRETO
      const hoje = new Date();
      const dataEvento = new Date(data);

      if (tipo === "nascimento") {
        // 👶 Bebê já nasceu - calcular semanas de vida
        const diffDias = Math.floor((hoje - dataEvento) / (1000 * 60 * 60 * 24));
        let semanas = Math.max(0, Math.floor(diffDias / 7));
        
        console.log(`🎯 Bebê nascido - ${diffDias} dias de vida (${semanas} semanas)`);
        
        // 🔧 CORREÇÃO: Redirecionar para semana específica quando aplicável
        if (semanas === 0) {
          // Bebê nasceu hoje ou tem menos de 1 semana
          console.log(`➡️ Redirecionando para /semanas/bebe/1 (recém-nascido)`);
          router.push("/semanas/bebe/1");
        } else if (semanas <= 52) {
          // Bebê tem até 1 ano - redirecionar para semana específica
          console.log(`➡️ Redirecionando para /semanas/bebe/${semanas}`);
          router.push(`/semanas/bebe/${semanas}`);
        } else {
          // Bebê tem mais de 1 ano - redirecionar para área geral do bebê
          console.log(`➡️ Redirecionando para /bebe (mais de 1 ano)`);
          router.push("/bebe");
        }
      } else {
        // 🤰 Gestante - redirecionar para semana específica
        const dataUltimaMenstruacao = new Date(dataEvento);
        dataUltimaMenstruacao.setDate(dataUltimaMenstruacao.getDate() - 280);

        const diffDias = Math.floor(
          (hoje - dataUltimaMenstruacao) / (1000 * 60 * 60 * 24)
        );

        const semanas = Math.min(40, Math.max(1, Math.floor(diffDias / 7))); // Mínimo semana 1

        console.log(`🎯 Gestante - ${semanas} semanas de gestação`);
        console.log(`➡️ Redirecionando para /semanas/gestante/${semanas}`);
        router.push(`/semanas/gestante/${semanas}`);
      }

    } catch (error) {
      console.error("❌ Erro no onboarding:", error);
      alert("Erro ao processar informações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete seu Perfil</h1>
      <p className="text-gray-600 mb-6 text-center">
        Conte-nos mais sobre você para personalizarmos sua experiência
      </p>

      {/* Tipo */}
      <label className="block mb-2 font-medium">Você está:</label>
      <select
        className="p-2 border rounded mb-4 w-full"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
      >
        <option value="gravidez">Aguardando o nascimento</option>
        <option value="nascimento">Com o bebê já nascido</option>
      </select>

      {/* Data */}
      <label className="block mb-2 font-medium">
        {tipo === "gravidez"
          ? "Data provável do parto"
          : "Data de nascimento do bebê"}
      </label>

      <input
        type="date"
        className="p-2 border rounded mb-4 w-full"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
      />

      {/* Gênero */}
      <label className="block mb-2 font-medium">Gênero do bebê:</label>
      <select
        className="p-2 border rounded mb-6 w-full"
        value={genero}
        onChange={(e) => setGenero(e.target.value)}
      >
        <option value="menino">Menino</option>
        <option value="menina">Menina</option>
      </select>

      <button
        onClick={salvar}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading ? "Salvando..." : "Completar Cadastro"}
      </button>
    </div>
  );
}