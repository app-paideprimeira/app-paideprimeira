"use client";

import { useRouter } from "next/navigation";
import { useGoToToday } from "@/lib/navigation/useGoToToday";

type Props = {
  stage: "gestante" | "bebe";
  currentWeek: number;
};

export default function WeekNavigation({
  stage,
  currentWeek,
}: Props) {
  const router = useRouter();
  const { goToToday } = useGoToToday();

  function goToWeek(week: number) {
    router.push(`/semanas/${stage}/${week}`);
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => goToWeek(currentWeek - 1)}
        disabled={currentWeek <= 1}
        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40"
      >
        ←
      </button>

      <button
        onClick={goToToday}
        className="px-4 py-2 rounded-lg border font-medium bg-white hover:bg-gray-50"
      >
        Hoje
      </button>

      <button
        onClick={() => goToWeek(currentWeek + 1)}
        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
      >
        →
      </button>
    </div>
  );
}
