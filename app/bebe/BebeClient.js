"use client";

import { useSearchParams } from "next/navigation";
import Title from "../components/Title";

export default function BebeClient() {
  const searchParams = useSearchParams();
  const semana = searchParams.get("semana");

  return (
    <div className="p-6">
      <Title>Bebê</Title>

      {semana ? (
        <p>Semana selecionada: {semana}</p>
      ) : (
        <p>Nenhuma semana selecionada</p>
      )}
    </div>
  );
}
