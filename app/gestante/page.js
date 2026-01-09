"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Input from "../components/Input";
import Button from "../components/Button";
import Title from "../components/Title";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GestantePage() {
  const [dpp, setDpp] = useState("");

  async function handleSalvar() {
    if (!dpp) {
      alert("Informe a data provável do parto!");
      return;
    }

    // pega usuário logado
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      alert("Usuário não autenticado");
      return;
    }

    // cálculo de semana atual
    const hoje = new Date();
    const dataParto = new Date(dpp);

    const diffMs = dataParto - hoje;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    const semanasRestantes = Math.floor(diffDias / 7);
    const semanaAtual = 40 - semanasRestantes;

    // pega dados do onboarding
    let genero = null;
    try {
      const onboarding = JSON.parse(localStorage.getItem("paiData"));
      genero = onboarding?.genero ?? null;
    } catch (error) {
      console.warn("Erro ao ler paiData no localStorage:", error);
    }

    // salva no banco
    const { error } = await supabase.from("parent_profile").insert({
      user_id: user.id,
      tipo: "gravidez",
      data_evento: dpp,
      genero,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar no banco!");
      return;
    }

    // envia para página da semana
    window.location.href = `/gestante/semana/${semanaAtual}`;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
      <Title>Data Provável do Parto</Title>

      <Input
        label="Informe a data provável do parto"
        type="date"
        value={dpp}
        onChange={(e) => setDpp(e.target.value)}
      />

      <Button className="mt-4" onClick={handleSalvar}>
        Continuar
      </Button>
    </div>
  );
}
