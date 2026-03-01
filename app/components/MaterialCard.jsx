"use client";

export default function MaterialCard({ item, accentColor }) {
  const { tipo, titulo, descricao, link, cta } = item;

  // Compatível: se não vier accentColor, usa o azul padrão do app
  const primary = accentColor || "#1E3A8A";
  const softBg = `${primary}20`; // fundo leve (hex + alpha)

  function getTipo() {
    if (tipo === "video") return { label: "🎥 Vídeo" };
    if (tipo === "podcast") return { label: "🎧 Podcast" };
    if (tipo === "audio") return { label: "🔊 Áudio" };
    if (tipo === "leitura") return { label: "📖 Leitura" };
    if (tipo === "produto") return { label: "🛒 Produto" };
    return { label: "📌 Conteúdo" };
  }

  const tipoInfo = getTipo();

  return (
    <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
      {/* BADGE */}
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: softBg, color: primary }}
      >
        {tipoInfo.label}
      </span>

      {/* TÍTULO */}
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">
        {titulo}
      </h2>

      {/* DESCRIÇÃO */}
      {descricao && (
        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
          {descricao}
        </p>
      )}

      {/* CTA */}
      {link && (
        <div className="pt-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90"
            style={{ color: primary }}
          >
            {cta || "Abrir"}
            <span aria-hidden>→</span>
          </a>
        </div>
      )}
    </article>
  );
}