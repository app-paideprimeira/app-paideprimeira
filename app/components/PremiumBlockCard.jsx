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

function PreviewBadge({ show }) {
  if (!show) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      marginLeft: "auto",
      background: "linear-gradient(90deg, #0b84f5, #1013d4)",
      color: "#fff", fontSize: 12, fontWeight: 800,
      padding: "3px 10px", borderRadius: 20,
      letterSpacing: "0.3px", whiteSpace: "nowrap",
      boxShadow: "0 5px 8px rgba(249,115,22,.5)",
    }}>
      <span style={{ fontSize: 18 }}>👑</span>
      Conteúdo Premium!
    </span>
  );
}

function BadgeRow({ label, accentColor, badgeBg, isPreview }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge label={label} accentColor={accentColor} badgeBg={badgeBg} />
      <PreviewBadge show={isPreview} />
    </div>
  );
}

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const CHAR_LIMIT = 300;

function ExpandableText({ text, subtleBg, leftBorder, accentColor }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > CHAR_LIMIT;
  const displayed = isLong && !expanded ? text.slice(0, CHAR_LIMIT).trimEnd() + "…" : text;
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
      <p className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line">{displayed}</p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)}
          className="mt-3 text-sm font-semibold transition hover:opacity-80 flex items-center gap-1"
          style={{ color: accentColor }}>
          {expanded ? "← Recolher" : "Ler mais →"}
        </button>
      )}
    </div>
  );
}

// Detecta URLs no texto e transforma em links clicáveis
function LinkableText({ text, subtleBg, leftBorder, accentColor }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <div className="rounded-xl p-4 text-sm text-gray-900 leading-relaxed whitespace-pre-line"
      style={{ backgroundColor: subtleBg, borderLeft: `5px solid ${leftBorder}` }}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            style={{ color: accentColor, fontWeight: 600, textDecoration: "underline", wordBreak: "break-all" }}>
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

function getDownloadUrl(url) {
  if (!url) return url;
  if (url.includes("supabase.co/storage")) {
    return url.includes("?") ? url + "&download=" : url + "?download=";
  }
  return url;
}

export default function PremiumBlockCard({ block, accentColor = "#1E3A8A", softBg = "#EFF6FF" }) {
  const badgeBg    = withAlpha(accentColor, "20") || softBg;
  const subtleBg   = withAlpha(accentColor, "12") || "#F3F4F6";
  const leftBorder = accentColor;
  const hasLink    = !!block.link;
  const isPreview  = block.isPreview === true;

  const rawItems = block.payload?.items ?? [];
  const [checked, setChecked] = useState(() => rawItems.map(() => false));
  const toggle = useCallback((i) => setChecked((prev) => prev.map((v, idx) => idx === i ? !v : v)), []);
  const completedCount = checked.filter(Boolean).length;
  const allDone = rawItems.length > 0 && completedCount === rawItems.length;

  // ── DOWNLOAD ─────────────────────────────────────────────
  if (block.tipo === "download") {
    const downloadUrl = getDownloadUrl(block.link);
    const fileName = block.link?.split("/").pop()?.split("?")[0] || "arquivo";
    const ext = fileName.split(".").pop()?.toUpperCase() || "";
    const extColors = {
      PDF:  { bg: "#fef2f2", border: "#fecaca", badge: "#dc2626", icon: "📄" },
      DOCX: { bg: "#eff6ff", border: "#bfdbfe", badge: "#2563eb", icon: "📝" },
      DOC:  { bg: "#eff6ff", border: "#bfdbfe", badge: "#2563eb", icon: "📝" },
      XLSX: { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", icon: "📊" },
      ZIP:  { bg: "#fefce8", border: "#fde68a", badge: "#ca8a04", icon: "🗜️" },
    };
    const colors = extColors[ext] || { bg: "#f8fafc", border: "#e2e8f0", badge: accentColor, icon: "📥" };

    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label="📥 Download" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.payload?.body && (
          <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
        )}
        {downloadUrl && (
          <a href={downloadUrl} download={fileName} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl p-4 transition hover:opacity-90"
            style={{ background: colors.bg, border: `1px solid ${colors.border}`, textDecoration: "none" }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: colors.badge + "20" }}>
              {colors.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{block.titulo}</p>
              {ext && (
                <span className="inline-block text-xs font-bold px-2 py-0.5 rounded mt-1"
                  style={{ background: colors.badge, color: "#fff" }}>
                  {ext}
                </span>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-lg"
              style={{ background: accentColor, color: "#fff" }}>
              <span>↓</span>
              <span>{block.cta || "Baixar"}</span>
            </div>
          </a>
        )}
      </article>
    );
  }

  // ── IMAGEM ───────────────────────────────────────────────
  if (block.tipo === "imagem") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label="🖼️ Imagem" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.link && (
          <div className="w-full rounded-xl overflow-hidden">
            <img src={block.link} alt={block.titulo} className="w-full rounded-xl"
              style={{ objectFit: "contain", maxHeight: 400, background: "#f8fafc" }} />
          </div>
        )}
        {block.payload?.body && (
          <LinkableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
        )}
      </article>
    );
  }

  // ── VÍDEO ────────────────────────────────────────────────
  if (block.tipo === "video") {
    const ytId = getYouTubeId(block.link);
    const isShorts = block.link?.includes("/shorts/");
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label="🎥 Vídeo" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {ytId ? (
          <div className="w-full rounded-xl overflow-hidden">
            <iframe className="w-full" style={{ height: isShorts ? 500 : 300, display: "block" }}
              src={`https://www.youtube.com/embed/${ytId}`}
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

  // ── FILME ────────────────────────────────────────────────
  if (block.tipo === "filme") {
    const ytId = getYouTubeId(block.payload?.trailer);
    return (
      <article className="bg-white/90 rounded-2xl overflow-hidden shadow-xl border border-white/40">
        <div className="px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
              🎬 Dica de Filme
            </span>
            {block.payload?.onde && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70">
                📺 {block.payload.onde}
              </span>
            )}
            <PreviewBadge show={isPreview} />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white leading-snug">{block.titulo}</h2>
          {block.descricao && <p className="text-sm text-white/60 mt-1 leading-relaxed">{block.descricao}</p>}
        </div>
        {ytId && (
          <div className="w-full">
            <iframe className="w-full" style={{ height: 300, display: "block" }}
              src={`https://www.youtube.com/embed/${ytId}`}
              title={`Trailer — ${block.titulo}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        )}
        {block.payload?.body && (
          <div className="px-6 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Por que assistir</p>
            <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
          </div>
        )}
      </article>
    );
  }

  // ── PODCAST / ÁUDIO ──────────────────────────────────────
  if (block.tipo === "podcast" || block.tipo === "audio") {
    const label = block.tipo === "podcast" ? "🎧 Podcast" : "🔊 Áudio";
    const isDirectAudio = block.link && /\.(mp3|ogg|wav|m4a)(\?.*)?$/i.test(block.link);
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label={label} accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
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
          <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
        )}
      </article>
    );
  }

  // ── LEITURA ──────────────────────────────────────────────
  if (block.tipo === "leitura") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label="📖 Leitura" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.payload?.body && (
          <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
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
        <BadgeRow label="🛒 Produto" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        {block.payload?.body && (
          <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
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

  // ── LISTA DE PRODUTOS ────────────────────────────────────
  if (block.tipo === "lista_produtos") {
    const produtos = block.payload?.produtos ?? [];
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
        <BadgeRow label="🛍️ Lista de Produtos" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700 leading-relaxed">{block.descricao}</p>}
        <div className="space-y-3">
          {produtos.map((produto, i) => (
            <div key={i} className="rounded-xl p-4 flex items-start gap-4"
              style={{ backgroundColor: subtleBg, borderLeft: `4px solid ${leftBorder}` }}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: accentColor }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-semibold text-gray-900">{produto.nome}</p>
                {produto.descricao && <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{produto.descricao}</p>}
                {produto.link && (
                  <a href={produto.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold mt-2 transition hover:opacity-80"
                    style={{ color: accentColor }}>
                    Ver produto →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>
    );
  }

  // ── TEXTO ────────────────────────────────────────────────
  if (block.tipo === "texto") {
    return (
      <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-3">
        <BadgeRow label="📝 Texto" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700">{block.descricao}</p>}
        {block.payload?.body && (
          <ExpandableText text={block.payload.body} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
        )}
      </article>
    );
  }

  // ── CHECKLIST ────────────────────────────────────────────
  if (block.tipo === "checklist") {
  return (
    <article className="bg-white/90 rounded-2xl p-6 shadow-xl border border-white/40 space-y-4">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Linha 1: tipo + badge preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <Badge label="✅ Checklist" accentColor={accentColor} badgeBg={badgeBg} />
          <PreviewBadge show={isPreview} />
        </div>
        {/* Linha 2: contador */}
        {rawItems.length > 0 && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ alignSelf: "flex-start",
            backgroundColor: allDone ? accentColor : badgeBg, color: allDone ? "#fff" : accentColor }}>
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
        <BadgeRow label="📌 Lembrete" accentColor={accentColor} badgeBg={badgeBg} isPreview={isPreview} />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{block.titulo}</h2>
        {block.descricao && <p className="text-sm md:text-base text-gray-700">{block.descricao}</p>}
        {block.payload?.note && (
          <ExpandableText text={block.payload.note} subtleBg={subtleBg} leftBorder={leftBorder} accentColor={accentColor} />
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