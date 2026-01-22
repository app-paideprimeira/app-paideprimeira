"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import Image from "next/image";

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

      let baseWeek = 1;

      if (stage === "bebe") {
        // 👶 bebê já nasceu
        const diffDias = Math.floor(
          (hoje - dataEvento) / (1000 * 60 * 60 * 24)
        );

        baseWeek = Math.max(1, Math.floor(diffDias / 7) + 1);
        baseWeek = Math.min(baseWeek, 52);
      } else {
        // 🤰 gestação
        const dataUltimaMenstruacao = new Date(dataEvento);
        dataUltimaMenstruacao.setDate(
          dataUltimaMenstruacao.getDate() - 280
        );

        const diffDias = Math.floor(
          (hoje - dataUltimaMenstruacao) / (1000 * 60 * 60 * 24)
        );

        baseWeek = Math.max(1, Math.floor(diffDias / 7) + 1);
        baseWeek = Math.min(baseWeek, 42);
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        onboarding_complete: true,
        stage,
        current_week: baseWeek, // compatibilidade
        base_week: baseWeek,
        base_week_date: hoje.toISOString().split("T")[0],
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
          ? `/semanas/bebe/${baseWeek}`
          : `/semanas/gestante/${baseWeek}`
      );
    } catch (err) {
      console.error(err);
      alert("Algo deu errado. Tenta de novo?");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-10">
          
                {/* LOGO NO FUNDO AZUL */}
                <div className="mb-8">
                  <Image
                    src="/logo/logo-app.svg"
                    alt="Pai de Primeira"
                    width={400}
                    height={200}
                    className="w-72 mx-auto drop-shadow-md"
                    priority
                  />
                </div>
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-md p-8 border border-[#E5E7EB]">
        {/* TÍTULO */}
        <h1 className="text-3xl font-bold text-center text-[#111827] mb-3">
          Bem-vindo ao Pai de Primeira
        </h1>

        <p className="text-[#6B7280] text-center mb-8">
          A gente só precisa de algumas informações para caminhar com você da
          forma certa.<br /> Sem pressão.<br /> Sem julgamentos.
        </p>

        {/* ESTÁGIO */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-[#111827]">
            Em que momento você está agora?
          </label>

          <select
            className="w-full p-3 border border-[#E5E7EB] rounded-xl bg-white
              text-[#111827]
              focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="gestante">🤰 A gravidez já começou</option>
            <option value="bebe">👶 O bebê já nasceu</option>
          </select>
        </div>

        {/* DATA */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-[#111827]">
            {stage === "gestante"
              ? "Data provável do parto"
              : "Data de nascimento do bebê"}
          </label>

          <input
            type="date"
            className="w-full p-3 border border-[#E5E7EB] rounded-xl
              text-[#111827]
              focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        {/* GÊNERO */}
        <div className="mb-8">
          <label className="block mb-2 font-semibold text-[#111827]">
            Gênero do bebê
          </label>

          <select
            className="w-full p-3 border border-[#E5E7EB] rounded-xl bg-white
              text-[#111827]
              focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
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
          className="
            w-full p-4 rounded-xl font-semibold text-white
            bg-[#1E3A8A] hover:bg-[#172554]
            transition disabled:opacity-60
          "
        >
          {loading ? "Preparando tudo..." : "Entrar na minha jornada"}
        </button>

        <p className="text-xs text-[#6B7280] text-center mt-4">
          Você pode ajustar essas informações depois, quando quiser.
        </p>
      </div>
    </div>
  );
}
