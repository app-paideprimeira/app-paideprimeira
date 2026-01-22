"use client";

import { useRouter } from "next/navigation";
import semanaData from "../../../../data/semanas.json";
import UserMenu from "../../../components/UserMenu";
import WeekCard from "../../../components/WeekCard";
import { useGoToToday } from "../../../../lib/navigation/useGoToToday";
import Image from "next/image";

export default function SemanaBebe({ params }) {
  const router = useRouter();
  const { goToToday } = useGoToToday();

  const semana = Number(params.semana);
  const infoSemana = semanaData.bebe?.[semana];

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
        {/* LOGO */}
        <Image
          src="/logo/logo-app.svg"
          alt="Pai de Primeira"
          width={120}
          height={40}
          className="opacity-90"
          priority
        />

        {/* MENU DO USUÁRIO */}
        <UserMenu />
      </header>


      <main className="max-w-3xl mx-auto space-y-8">
        <WeekCard data={infoSemana} />

        {/* NAVEGAÇÃO ENTRE SEMANAS */}
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={semana <= 1}
            onClick={() =>
              router.push(`/semanas/bebe/${semana - 1}`)
            }
            className="px-4 py-2 rounded-xl bg-white/80 shadow-md hover:bg-white transition disabled:opacity-40"
            style={{ color: infoSemana.textColor }}
          >
            ← Semana {semana - 1}
          </button>

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

          <button
            disabled={semana >= 52}
            onClick={() =>
              router.push(`/semanas/bebe/${semana + 1}`)
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
