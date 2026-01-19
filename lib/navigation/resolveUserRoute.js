// lib/navigation/resolveUserRoute.js

export function resolveUserRoute({ user, profile }) {
  if (!user) {
    return "/auth/login";
  }

  if (!profile || !profile.onboarding_complete) {
    return "/onboarding";
  }

  const hoje = new Date();
  const dataEvento = new Date(profile.event_date);

  // 👶 Bebê já nasceu
  if (profile.stage === "bebe") {
    const diffDias = Math.floor(
      (hoje - dataEvento) / (1000 * 60 * 60 * 24)
    );

    const semanas = Math.min(
      52,
      Math.max(1, Math.floor(diffDias / 7) + 1)
    );

    return `/semanas/bebe/${semanas}`;
  }

  // 🤰 Gestação
  const dataUltimaMenstruacao = new Date(dataEvento);
  dataUltimaMenstruacao.setDate(
    dataUltimaMenstruacao.getDate() - 280
  );

  const diffDias = Math.floor(
    (hoje - dataUltimaMenstruacao) / (1000 * 60 * 60 * 24)
  );

  const semanas = Math.min(
    40,
    Math.max(1, Math.floor(diffDias / 7) + 1)
  );

  return `/semanas/gestante/${semanas}`;
}
