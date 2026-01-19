"use client";

export default function WeekCard({ data }) {
  if (!data) return null;

  const {
    titulo,
    empatia,
    imagens,
    descricao,
    dica,
    acompanhe,
    textColor,
    bgColor,
  } = data;

  return (
    <section className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-4">
      {/* TÍTULO */}
      <header className="text-center space-y-1">
        <h1
          className="text-3xl md:text-2xl font-bold tracking-tight"
          style={{ color: textColor }}
        >
          {titulo}
        </h1>
      </header>
        {/* FRASE EMPÁTICA */}
            {empatia && (
                <div
                className="text-center px-6 py-4 rounded-xl font-medium italic text-base md:text-lg"
                style={{
                    backgroundColor: bgColor + "25",
                    color: textColor,
                }}
                >
                “{empatia}”
                </div>
            )}

      {/* DESCRIÇÃO PRINCIPAL */}
      <p
        className="text-base md:text-lg leading-relaxed font-medium"
        style={{ color: textColor }}
        
      >
        {descricao}
      </p>
            {/* IMAGENS / GIFS */}
                        {imagens && imagens.length > 0 && (
                        <div className="flex justify-center">
                            {imagens.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Imagem da semana - ${titulo}`}
                                className="w-48 md:w-56 lg:w-64 h-auto object-contain"
                            />
                            ))}
                        </div>
                        )}

      {/* BLOCO DE DICA */}
      {dica && (
        <div
          className="rounded-xl p-3 shadow-sm space-y-1"
          style={{
            backgroundColor: bgColor + "20",
            borderLeft: `5px solid ${textColor}`,
          }}
        >
          <h2
            className="font-semibold text-lg flex items-center gap-2"
            style={{ color: textColor }}
          >
            💡 Dica de pai pra pai
          </h2>
          <p
            className="leading-relaxed text-sm md:text-base"
            style={{ color: textColor }}
          >
            {dica}
          </p>
        </div>
      )}

      {/* BLOCO ACOMPANHE */}
      {acompanhe && (
        <div className="rounded-xl p-5 bg-blue-50 border-l-4 border-blue-400 space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-800">
            👀 Fica de olho nisso
          </h3>
          <p className="text-blue-700 leading-relaxed text-sm md:text-base">
            {acompanhe}
          </p>
        </div>
      )}

      {/* FUTURO CTA / PREMIUM */}
      {/*
      <div className="pt-6 border-t">
        <button className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:opacity-90 transition">
          Desbloquear conteúdo extra ✨
        </button>
      </div>
      */}
    </section>
  );
}
