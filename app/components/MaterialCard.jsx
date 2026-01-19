"use client";

export default function MaterialCard({ item }) {
  const { tipo, titulo, descricao, link, cta } = item;

  function getTipo() {
    if (tipo === "video") return { label: "🎥 Vídeo", color: "bg-red-50 text-red-700" };
    if (tipo === "leitura") return { label: "📖 Leitura", color: "bg-amber-50 text-amber-700" };
    if (tipo === "produto") return { label: "🛒 Recomendado", color: "bg-emerald-50 text-emerald-700" };
    return { label: "📌 Conteúdo", color: "bg-gray-100 text-gray-700" };
  }

  const tipoInfo = getTipo();

  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 space-y-4">
      {/* BADGE DE TIPO */}
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${tipoInfo.color}`}
      >
        {tipoInfo.label}
      </span>

      {/* TÍTULO */}
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">
        {titulo}
      </h2>

      {/* DESCRIÇÃO */}
      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
        {descricao}
      </p>

      {/* CTA */}
      <div className="pt-2">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          {cta || "Ir além"}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}
