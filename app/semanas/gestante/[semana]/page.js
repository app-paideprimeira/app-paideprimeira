"use client";

import { useRouter } from "next/navigation";
import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import WeekCard from "../../../components/WeekCard";
import { useGoToToday } from "../../../../lib/navigation/useGoToToday";

export default function SemanaGestante({ params }) {
  const router = useRouter();
  const { goToToday } = useGoToToday();

  const semana = Number(params.semana);
  const infoSemana = semanaData.gestante?.[semana];

  if (!infoSemana) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Semana não encontrada.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: infoSemana.bgColor }}
    >
      {/* HEADER */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="font-medium hover:opacity-80"
          style={{ color: infoSemana.textColor }}
        >
          ← Voltar
        </button>

        <div className="flex items-center gap-3">
                   <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-8">
        <WeekCard data={infoSemana} />

        {/* NAVEGAÇÃO ENTRE SEMANAS */}
        <div className="flex items-center justify-center gap-3">
          {/* Anterior */}
          <button
            disabled={semana <= 1}
            onClick={() =>
              router.push(`/semanas/gestante/${semana - 1}`)
            }
            className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40"
            style={{ color: infoSemana.textColor }}
          >
            ← Semana {semana - 1}
          </button>

          {/* Atual */}
          <button
            onClick={goToToday}
            className="px-5 py-2 rounded-xl font-semibold shadow-md"
            style={{
              backgroundColor: infoSemana.textColor,
              color: "#fff",
              textAlign: "center",
            }}
          >
            Semana Atual
          </button>

          {/* Próxima */}
          <button
            disabled={semana >= 42}
            onClick={() =>
              router.push(`/semanas/gestante/${semana + 1}`)
            }
            className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40"
            style={{ color: infoSemana.textColor }}
          >
             → Semana {semana + 1}
          </button>
        </div>
      </main>
    </div>
  );
}
