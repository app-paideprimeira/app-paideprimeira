// lib/navigation/calcularSemanaAtual.js

export function calcularSemanaAtual(baseWeek, baseWeekDate, stage) {
  if (!baseWeek || !baseWeekDate) return 1;

  const hoje = new Date();
  const dataBase = new Date(baseWeekDate);

  const diffDias = Math.floor(
    (hoje - dataBase) / (1000 * 60 * 60 * 24)
  );

  const semanasPassadas = Math.floor(diffDias / 7);

  let semanaAtual = baseWeek + semanasPassadas;

  // 🔒 limites por estágio
  if (stage === "gestante") {
    semanaAtual = Math.min(Math.max(1, semanaAtual), 42);
  } else {
    semanaAtual = Math.min(Math.max(1, semanaAtual), 52);
  }

  return semanaAtual;
}
