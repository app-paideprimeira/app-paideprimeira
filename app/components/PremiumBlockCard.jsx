"use client";

import { useState, useCallback } from "react";
import MaterialCard from "./MaterialCard";

function withAlpha(hex, alphaHex) {
  if (!hex || typeof hex !== "string") return undefined;
  if (hex.startsWith("#") && hex.length === 7) return `${hex}${alphaHex}`;
  return undefined;
}

function Badge({ label, accentColor, badgeBg }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: badgeBg, color: accentColor }}>
      {label}
    </span>
  );
}

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function PremiumBlockCard({ block, accentColor = "#1E3A8A", softBg = "#EFF6FF" }) {
  const badgeBg    = withAlpha(accentColor, "20") || softBg;
  const subtleBg   = withAlpha(accentColor, "12") || "#F3F4F6";
  const leftBorder = accentColor;
  const hasLink    = !!block.link;

  const rawItems = block.payload?.items ?? [];
  const [checked, setChecked] = useState(() => rawItems.map(() => false));
  const toggle = useCallback((i) => setChecked((prev) => prev.map((v, idx) => idx === i ? !v : v)), []);
  const completedCount = checked.filter(Boolean).length;
  const allDone = rawItems.length > 0 && completedCount === rawItems.length;

  // ── IMAGEM ───────────────────────────────────────────────
  if (block.tipo === "imagem") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <Badge label="🖼️ Imagem" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.link && (
          <div className="w-full rounded-xl overflow-hidden">
            <img src={block.link} alt={block.titulo} className="w-full h-auto object-cover rounded-xl" style={{ maxHeight: 400 }} />
          </div>
        )}
        {block.payload?.body && (
          <div className="rounded-xl p-4 text-sm text-gray-900 leading-relaxed whitespace-pre-line"
            style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            {block.payload.body}
          </div>
        )}
        {hasLink && block.cta && (
          <a href={block.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90" style={{ color: accentColor }}>
            {block.cta} <span aria-hidden>→</span>
          </a>
        )}
      </article>
    );
  }

  // ── VÍDEO ────────────────────────────────────────────────
  if (block.tipo === "video") {
    const ytId = getYouTubeId(block.link);
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <Badge label="🎥 Vídeo" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {ytId ? (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
            <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytId}`}
              title={block.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : hasLink ? (
          <a href={block.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90" style={{ color: accentColor }}>
            {block.cta || "Assistir vídeo"} <span aria-hidden>→</span>
          </a>
        ) : null}
      </article>
    );
  }

  // ── PODCAST / ÁUDIO ──────────────────────────────────────
  if (block.tipo === "podcast" || block.tipo === "audio") {
    const label = block.tipo === "podcast" ? "🎧 Podcast" : "🔊 Áudio";
    const isDirectAudio = block.link && /\.(mp3|ogg|wav|m4a)(\?.*)?$/i.test(block.link);
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <Badge label={label} accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {isDirectAudio ? (
          <audio controls className="w-full rounded-xl" style={{ accentColor }} src={block.link}>Seu navegador não suporta áudio.</audio>
        ) : hasLink ? (
          <a href={block.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90" style={{ color: accentColor }}>
            {block.cta || "Ouvir episódio"} <span aria-hidden>→</span>
          </a>
        ) : null}
        {block.payload?.body && (
          <div className="rounded-xl p-4 text-sm text-gray-900 leading-relaxed whitespace-pre-line"
            style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            {block.payload.body}
          </div>
        )}
      </article>
    );
  }

  // ── LEITURA ──────────────────────────────────────────────
  if (block.tipo === "leitura") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <Badge label="📖 Leitura" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.payload?.body && (
          <div className="rounded-xl p-4" style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            <p className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line">{block.payload.body}</p>
          </div>
        )}
        {hasLink && (
          <a href={block.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90" style={{ color: accentColor }}>
            {block.cta || "Ver recomendação"} <span aria-hidden>→</span>
          </a>
        )}
      </article>
    );
  }

  // ── PRODUTO ──────────────────────────────────────────────
  if (block.tipo === "produto") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <Badge label="🛒 Produto" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.payload?.body && (
          <div className="rounded-xl p-4" style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            <p className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line">{block.payload.body}</p>
          </div>
        )}
        {hasLink && (
          <a href={block.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-90" style={{ color: accentColor }}>
            {block.cta || "Ver produto"} <span aria-hidden>→</span>
          </a>
        )}
      </article>
    );
  }

  // ── TEXTO ────────────────────────────────────────────────
  if (block.tipo === "texto") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-3">
        <Badge label="📝 Texto" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700">{block.descricao}</p>}
        {block.payload?.body && (
          <div className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line rounded-xl p-4"
            style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            {block.payload.body}
          </div>
        )}
      </article>
    );
  }

  // ── CHECKLIST ────────────────────────────────────────────
  if (block.tipo === "checklist") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <div className="flex items-center justify-between">
          <Badge label="✅ Checklist" accentColor={accentColor} badgeBg={badgeBg} />
          {rawItems.length > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: allDone ? accentColor : badgeBg, color: allDone ? "#fff" : accentColor }}>
              {completedCount}/{rawItems.length}
            </span>
          )}
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700">{block.descricao}</p>}
        {rawItems.length > 0 && (
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / rawItems.length) * 100}%`, backgroundColor: accentColor }} />
          </div>
        )}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
          {rawItems.map((item, i) => (
            <button key={i} onClick={() => toggle(i)} className="flex items-start gap-3 w-full text-left group">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                style={{ borderColor: accentColor, backgroundColor: checked[i] ? accentColor : "transparent" }}>
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="text-sm md:text-base leading-relaxed transition-all"
                style={{ color: checked[i] ? "#9CA3AF" : "#111827", textDecoration: checked[i] ? "line-through" : "none" }}>
                {item}
              </span>
            </button>
          ))}
        </div>
        {allDone && (
          <p className="text-sm font-semibold text-center py-2 rounded-xl transition-all"
            style={{ backgroundColor: badgeBg, color: accentColor }}>
            🎉 Semana concluída! Você arrasou.
          </p>
        )}
      </article>
    );
  }

  // ── LEMBRETE FIXO ────────────────────────────────────────
  if (block.tipo === "lembrete_fixo") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-3">
        <Badge label="📌 Lembrete" accentColor={accentColor} badgeBg={badgeBg} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700">{block.descricao}</p>}
        {block.payload?.note && (
          <div className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line rounded-xl p-4"
            style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
            {block.payload.note}
          </div>
        )}
      </article>
    );
  }

  // ── FALLBACK ─────────────────────────────────────────────
  if (hasLink) {
    return <MaterialCard item={{ tipo: block.tipo, titulo: block.titulo, descricao: block.descricao, link: block.link, cta: block.cta }} accentColor={accentColor} />;
  }

  return (
    <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">{block.titulo}</h2>
      {block.descricao && <p className="text-gray-700">{block.descricao}</p>}
    </article>
  );
}