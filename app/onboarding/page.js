"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function Onboarding() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [stage, setStage] = useState("gestante"); // gestante | bebe
  const [eventDate, setEventDate] = useState("");
  const [gender, setGender] = useState("menino");
  const [loading, setLoading] = useState(false);

  async function finalizarOnboarding() {
    if (!eventDate) {
      alert("Escolha uma data para a gente continuar juntos 🙂");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const hoje = new Date();
      const dataEvento = new Date(eventDate);

      let currentWeek = 1;

      if (stage === "bebe") {
        // 👶 bebê já nasceu
        const diffDias = Math.floor(
          (hoje - dataEvento) / (1000 * 60 * 60 * 24)
        );

        currentWeek = Math.max(1, Math.floor(diffDias / 7) + 1);
        currentWeek = Math.min(currentWeek, 52);
      } else {
        // 🤰 gestação
        const dataUltimaMenstruacao = new Date(dataEvento);
        dataUltimaMenstruacao.setDate(
          dataUltimaMenstruacao.getDate() - 280
        );

        const diffDias = Math.floor(
          (hoje - dataUltimaMenstruacao) / (1000 * 60 * 60 * 24)
        );

        currentWeek = Math.max(1, Math.floor(diffDias / 7) + 1);
        currentWeek = Math.min(currentWeek, 40);
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        onboarding_complete: true,
        stage,
        current_week: currentWeek,
        event_date: eventDate,
        baby_gender: gender,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push(
        stage === "bebe"
          ? `/semanas/bebe/${currentWeek}`
          : `/semanas/gestante/${currentWeek}`
      );
    } catch (err) {
      console.error(err);
      alert("Algo deu errado. Tenta de novo?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm p-8">
        {/* TÍTULO */}
        <h1 className="text-3xl font-bold text-center mb-3">
          Bem-vindo ao Pai de Primeira 🤍
        </h1>

        <p className="text-gray-600 text-center mb-8">
          A gente só precisa de algumas informações para caminhar com você da
          forma certa. Sem pressão. Sem julgamentos.
        </p>

        {/* ESTÁGIO */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-800">
            Em que momento você está agora?
          </label>

          <select
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="gestante">
              🤰 A gravidez já começou
            </option>
            <option value="bebe">
              👶 O bebê já nasceu
            </option>
          </select>

          <p className="text-sm text-gray-500 mt-2">
            Isso nos ajuda a mostrar conteúdos mais relevantes para você.
          </p>
        </div>

        {/* DATA */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-800">
            {stage === "gestante"
              ? "Data provável do parto"
              : "Data de nascimento do bebê"}
          </label>

          <input
            type="date"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <p className="text-sm text-gray-500 mt-2">
            Não precisa ser exato. Se mudar depois, tudo bem.
          </p>
        </div>

        {/* GÊNERO */}
        <div className="mb-8">
          <label className="block mb-2 font-semibold text-gray-800">
            Gênero do bebê
          </label>

          <select
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="menino">💙 Menino</option>
            <option value="menina">💗 Menina</option>
          </select>
        </div>

        {/* CTA */}
        <button
          onClick={finalizarOnboarding}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? "Preparando tudo..." : "Entrar na minha jornada"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Você pode ajustar essas informações depois, quando quiser.
        </p>
      </div>
    </div>
  );
}
