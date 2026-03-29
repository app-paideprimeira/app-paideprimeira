"use client";

// app/bebe/page.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserMenu from "../components/UserMenu";

// ── Helpers localStorage ────────────────────────────────────
function loadData(key) {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveData(key, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

const KEYS = {
  amamenta: "bebe_amamenta",
  fraldas:  "bebe_fraldas",
  sono:     "bebe_sono",
};

// ── Formatadores ────────────────────────────────────────────
function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtDataCompleta(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDuracao(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}min` : `${h}h`;
}
function ultimos14dias(lista) {
  const corte = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return lista.filter(i => new Date(i.inicio || i.hora || i.fim).getTime() > corte);
}
function toLocalDatetimeInput(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Gerador de PDF ──────────────────────────────────────────
async function gerarPDF({ titulo, subtitulo, resumo, colunas, linhas, nomeArquivo }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const hoje  = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // ── Cabeçalho timbrado ──
  doc.setFillColor(30, 58, 138); // navy
  doc.rect(0, 0, pageW, 28, "F");

  // Logo
  try {
    const img = await fetch("/logo/logo_email.png");
    const blob = await img.blob();
    const reader = new FileReader();
    const logoBase64 = await new Promise(res => {
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
    doc.addImage(logoBase64, "PNG", 10, 4, 50, 18);
  } catch {
    // Se logo falhar, coloca texto
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Pai de Primeira", 10, 18);
  }

  // Título no cabeçalho
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, pageW - 10, 12, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitulo, pageW - 10, 20, { align: "right" });

  // ── Linha separadora ──
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(10, 32, pageW - 10, 32);

  // ── Data de geração ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Gerado em ${hoje} via app Pai de Primeira`, 10, 37);

  // ── Cards de resumo ──
  let y = 44;
  const cardW = (pageW - 20 - (resumo.length - 1) * 4) / resumo.length;

  resumo.forEach((item, i) => {
    const x = 10 + i * (cardW + 4);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(x, y, cardW, 18, 3, 3, "F");
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(item.valor, x + cardW / 2, y + 9, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + cardW / 2, y + 15, { align: "center" });
  });

  // ── Tabela ──
  autoTable(doc, {
    startY: y + 24,
    head: [colunas],
    body: linhas,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: { fontSize: 8, halign: "center" },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { left: 10, right: 10 },
    styles: { cellPadding: 3 },
  });

  // ── Rodapé ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Pai de Primeira — painel.apppaideprimeira.com — Página ${i} de ${pageCount}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  // ── Download ──
  doc.save(`${nomeArquivo}.pdf`);

  // ── Compartilhar ──
  if (navigator.share) {
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `${nomeArquivo}.pdf`, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: titulo });
    }
  }
}

// ── Card explicativo ────────────────────────────────────────
function InfoCard({ emoji, titulo, descricao }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1E3A8A, #3b82f6)",
      borderRadius: 16, padding: "18px 20px", marginBottom: 20,
      display: "flex", gap: 14, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>{emoji}</span>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{titulo}</p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>{descricao}</p>
      </div>
    </div>
  );
}

// ── ABA AMAMENTAÇÃO ─────────────────────────────────────────
function AbaAmamentacao() {
  const [registros, setRegistros] = useState([]);
  const [ativo, setAtivo]         = useState(null);
  const [seioAtual, setSeioAtual] = useState("esquerdo");
  const [elapsed, setElapsed]     = useState(0);
  const [gerando, setGerando]     = useState(false);

  useEffect(() => {
    setRegistros(loadData(KEYS.amamenta));
    const a = localStorage.getItem("bebe_amamenta_ativo");
    if (a) setAtivo(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const iv = setInterval(() => setElapsed(Date.now() - new Date(ativo.inicio).getTime()), 1000);
    return () => clearInterval(iv);
  }, [ativo]);

  function iniciar() {
    const a = { inicio: new Date().toISOString(), seio: seioAtual };
    setAtivo(a);
    localStorage.setItem("bebe_amamenta_ativo", JSON.stringify(a));
    setElapsed(0);
  }

  function parar() {
    if (!ativo) return;
    const fim = new Date().toISOString();
    const duracao = Date.now() - new Date(ativo.inicio).getTime();
    const novo = { ...ativo, fim, duracao };
    const lista = [novo, ...registros].slice(0, 200);
    setRegistros(lista);
    saveData(KEYS.amamenta, lista);
    localStorage.removeItem("bebe_amamenta_ativo");
    setAtivo(null);
    setElapsed(0);
  }

  function remover(i) {
    const lista = registros.filter((_, idx) => idx !== i);
    setRegistros(lista);
    saveData(KEYS.amamenta, lista);
  }

  async function exportar() {
    const r14 = ultimos14dias(registros);
    if (!r14.length) return;
    setGerando(true);
    try {
      const total    = r14.reduce((s, r) => s + (r.duracao || 0), 0);
      const mediaMin = r14.length ? Math.round(total / r14.length / 60000) : 0;
      const esq      = r14.filter(r => r.seio === "esquerdo").length;
      const dir      = r14.filter(r => r.seio === "direito").length;

      await gerarPDF({
        titulo:      "Relatório de Amamentação",
        subtitulo:   "Últimos 14 dias",
        nomeArquivo: "relatorio-amamentacao",
        resumo: [
          { label: "Total de mamadas", valor: r14.length + "x" },
          { label: "Duração média",    valor: mediaMin + " min" },
          { label: "Seio esquerdo",    valor: esq + "x" },
          { label: "Seio direito",     valor: dir + "x" },
        ],
        colunas: ["Data", "Horário", "Seio", "Duração"],
        linhas: r14.map(r => [
          fmtDataCompleta(r.inicio),
          fmtHora(r.inicio),
          r.seio === "esquerdo" ? "Esquerdo" : "Direito",
          fmtDuracao(r.duracao),
        ]),
      });
    } finally { setGerando(false); }
  }

  const r14 = ultimos14dias(registros);
  const totalHoje = registros.filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString())).length;

  return (
    <div>
      <InfoCard
        emoji="🍼"
        titulo="Como funciona o registro de amamentação"
        descricao="Selecione o seio, toque em 'Iniciar mamada' quando o bebê começar a mamar e em 'Parar' quando terminar. O app registra o horário e a duração automaticamente para você mostrar ao pediatra."
      />

      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        {!ativo ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qual seio?</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {["esquerdo", "direito"].map(s => (
                <button key={s} onClick={() => setSeioAtual(s)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all .15s",
                    borderColor: seioAtual === s ? "#1E3A8A" : "#e2e8f0",
                    background:  seioAtual === s ? "#eff6ff" : "#fff",
                    color:       seioAtual === s ? "#1E3A8A" : "#64748b",
                  }}>
                  {s === "esquerdo" ? "👈 Seio Esquerdo" : "👉 Seio Direito"}
                </button>
              ))}
            </div>
            <button onClick={iniciar}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(30,58,138,.25)" }}>
              ▶ Iniciar mamada
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
              {ativo.seio === "esquerdo" ? "👈 Seio esquerdo" : "👉 Seio direito"} · iniciou às {fmtHora(ativo.inicio)}
            </p>
            <p style={{ fontSize: 48, fontWeight: 900, color: "#1E3A8A", margin: "8px 0", fontVariantNumeric: "tabular-nums" }}>
              {fmtDuracao(elapsed)}
            </p>
            <p style={{ fontSize: 22, color: "#5791e2", margin: "0 0 12px", fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(elapsed / 1000)}s
            </p>
            <button onClick={parar}
              style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(239,68,68,.25)" }}>
              ⏹ Parar
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Hoje",      valor: totalHoje + "x" },
          { label: "14 dias",   valor: r14.length + "x" },
          { label: "Média/dia", valor: (r14.length / 14).toFixed(1) + "x" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1E3A8A" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {r14.length > 0 && (
        <button onClick={exportar} disabled={gerando}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1E3A8A", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, opacity: gerando ? 0.7 : 1 }}>
          {gerando ? "⏳ Gerando PDF..." : "📄 Gerar relatório PDF para o pediatra"}
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {r.seio === "esquerdo" ? "👈 Seio Esquerdo" : "👉 Seio Direito"} · {fmtDuracao(r.duracao)}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{fmtDataCompleta(r.inicio)} às {fmtHora(r.inicio)}</p>
            </div>
            <button onClick={() => remover(i)}
              style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>
              🗑
            </button>
          </div>
        ))}
        {registros.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>Nenhuma mamada registrada ainda</p>
        )}
      </div>
    </div>
  );
}

// ── ABA FRALDAS ─────────────────────────────────────────────
function AbaFraldas() {
  const [registros, setRegistros] = useState([]);
  const [gerando, setGerando]     = useState(false);

  useEffect(() => { setRegistros(loadData(KEYS.fraldas)); }, []);

  function registrar(tipo) {
    const novo = { tipo, hora: new Date().toISOString() };
    const lista = [novo, ...registros].slice(0, 200);
    setRegistros(lista);
    saveData(KEYS.fraldas, lista);
  }

  function remover(i) {
    const lista = registros.filter((_, idx) => idx !== i);
    setRegistros(lista);
    saveData(KEYS.fraldas, lista);
  }

  async function exportar() {
    const r14 = ultimos14dias(registros);
    if (!r14.length) return;
    setGerando(true);
    try {
      const xixi  = r14.filter(r => r.tipo === "xixi"  || r.tipo === "ambos").length;
      const coco  = r14.filter(r => r.tipo === "coco"  || r.tipo === "ambos").length;
      const total = r14.length;

      await gerarPDF({
        titulo:      "Relatório de Fraldas",
        subtitulo:   "Últimos 14 dias",
        nomeArquivo: "relatorio-fraldas",
        resumo: [
          { label: "Total de trocas",   valor: total + "x" },
          { label: "Xixi",              valor: xixi + "x" },
          { label: "Cocô",              valor: coco + "x" },
          { label: "Média/dia",         valor: (total / 14).toFixed(1) + "x" },
        ],
        colunas: ["Data", "Horário", "Tipo"],
        linhas: r14.map(r => [
          fmtDataCompleta(r.hora),
          fmtHora(r.hora),
          r.tipo === "xixi" ? "Xixi" : r.tipo === "coco" ? "Cocô" : "Xixi + Cocô",
        ]),
      });
    } finally { setGerando(false); }
  }

  const r14   = ultimos14dias(registros);
  const hoje  = registros.filter(r => fmtData(r.hora) === fmtData(new Date().toISOString()));
  const xixi14 = r14.filter(r => r.tipo === "xixi"  || r.tipo === "ambos").length;
  const coco14 = r14.filter(r => r.tipo === "coco"  || r.tipo === "ambos").length;

  const TIPOS = [
    { key: "xixi",  label: "💧 Xixi",     bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    { key: "coco",  label: "💩 Cocô",     bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
    { key: "ambos", label: "💧💩 Os dois", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  ];

  return (
    <div>
      <InfoCard
        emoji="👶"
        titulo="Como funciona o registro de fraldas"
        descricao="Toque no botão correspondente ao tipo de fralda toda vez que trocar. O app registra o horário automaticamente. Ideal para acompanhar a hidratação e saúde intestinal do bebê com o pediatra."
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {TIPOS.map(t => (
          <button key={t.key} onClick={() => registrar(t.key)}
            style={{ flex: 1, padding: "16px 8px", borderRadius: 14, border: `2px solid ${t.border}`, background: t.bg, color: t.color, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Hoje",       valor: hoje.length + "x" },
          { label: "💧 14 dias", valor: xixi14 + "x" },
          { label: "💩 14 dias", valor: coco14 + "x" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1E3A8A" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {r14.length > 0 && (
        <button onClick={exportar} disabled={gerando}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1E3A8A", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, opacity: gerando ? 0.7 : 1 }}>
          {gerando ? "⏳ Gerando PDF..." : "📄 Gerar relatório PDF para o pediatra"}
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => {
          const t = TIPOS.find(t => t.key === r.tipo) || TIPOS[0];
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{fmtDataCompleta(r.hora)} às {fmtHora(r.hora)}</p>
              </div>
              <button onClick={() => remover(i)}
                style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>
                🗑
              </button>
            </div>
          );
        })}
        {registros.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>Nenhuma troca registrada ainda</p>
        )}
      </div>
    </div>
  );
}

// ── ABA SONO ────────────────────────────────────────────────
function AbaSono() {
  const [registros, setRegistros]     = useState([]);
  const [draftInicio, setDraftInicio] = useState("");
  const [draftFim, setDraftFim]       = useState("");
  const [erro, setErro]               = useState("");
  const [gerando, setGerando]         = useState(false);

  useEffect(() => {
    setRegistros(loadData(KEYS.sono));
    const agora = new Date();
    const umHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);
    setDraftFim(toLocalDatetimeInput(agora));
    setDraftInicio(toLocalDatetimeInput(umHoraAtras));
  }, []);

  function registrar() {
    setErro("");
    if (!draftInicio || !draftFim) { setErro("Preencha início e fim do sono."); return; }
    const inicio = new Date(draftInicio);
    const fim    = new Date(draftFim);
    if (fim <= inicio) { setErro("O horário de fim deve ser depois do início."); return; }
    const duracao = fim.getTime() - inicio.getTime();
    if (duracao > 24 * 60 * 60 * 1000) { setErro("Duração não pode ser maior que 24 horas."); return; }
    const novo = { inicio: inicio.toISOString(), fim: fim.toISOString(), duracao };
    const lista = [novo, ...registros].slice(0, 200);
    setRegistros(lista);
    saveData(KEYS.sono, lista);
    setErro("");
  }

  function remover(i) {
    const lista = registros.filter((_, idx) => idx !== i);
    setRegistros(lista);
    saveData(KEYS.sono, lista);
  }

  async function exportar() {
    const r14 = ultimos14dias(registros);
    if (!r14.length) return;
    setGerando(true);
    try {
      const totalMs    = r14.reduce((s, r) => s + (r.duracao || 0), 0);
      const mediaMs    = r14.length ? totalMs / r14.length : 0;
      const sonoHoje   = registros.filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString()));
      const sonoHojeMs = sonoHoje.reduce((s, r) => s + (r.duracao || 0), 0);

      await gerarPDF({
        titulo:      "Relatório de Sono",
        subtitulo:   "Últimos 14 dias",
        nomeArquivo: "relatorio-sono",
        resumo: [
          { label: "Períodos (14 dias)", valor: r14.length + "x" },
          { label: "Sono hoje",          valor: fmtDuracao(sonoHojeMs) },
          { label: "Média por período",  valor: fmtDuracao(mediaMs) },
          { label: "Total 14 dias",      valor: fmtDuracao(totalMs) },
        ],
        colunas: ["Data", "Dormiu às", "Acordou às", "Duração"],
        linhas: r14.map(r => [
          fmtDataCompleta(r.inicio),
          fmtHora(r.inicio),
          fmtHora(r.fim),
          fmtDuracao(r.duracao),
        ]),
      });
    } finally { setGerando(false); }
  }

  const r14 = ultimos14dias(registros);
  const totalHojeMs = registros
    .filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString()))
    .reduce((s, r) => s + (r.duracao || 0), 0);
  const mediaMs = r14.length ? r14.reduce((s, r) => s + (r.duracao || 0), 0) / r14.length : 0;

  const duracaoPreview = draftInicio && draftFim && new Date(draftFim) > new Date(draftInicio)
    ? new Date(draftFim).getTime() - new Date(draftInicio).getTime()
    : null;

  return (
    <div>
      <InfoCard
        emoji="😴"
        titulo="Como funciona o registro de sono"
        descricao="Informe o horário que o bebê dormiu e acordou — pode registrar depois que acordar. O app calcula a duração automaticamente. Essencial para entender o padrão de sono e apresentar ao pediatra."
      />

      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Registrar período de sono
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
              🌙 Bebê dormiu às
            </label>
            <input type="datetime-local" value={draftInicio} onChange={e => setDraftInicio(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none", color: "#0f172a" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
              ☀️ Bebê acordou às
            </label>
            <input type="datetime-local" value={draftFim} onChange={e => setDraftFim(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none", color: "#0f172a" }} />
          </div>

          {duracaoPreview && (
            <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#7c3aed", fontWeight: 800 }}>
                😴 Duração: {fmtDuracao(duracaoPreview)}
              </p>
            </div>
          )}

          {erro && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>⚠️ {erro}</p>}

          <button onClick={registrar}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,.2)" }}>
            💾 Salvar período de sono
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Sono hoje",  valor: fmtDuracao(totalHojeMs) },
          { label: "14 dias",    valor: r14.length + "x" },
          { label: "Média/sono", valor: fmtDuracao(mediaMs) },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: s.label !== "14 dias" ? 14 : 20, fontWeight: 900, color: "#7c3aed" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {r14.length > 0 && (
        <button onClick={exportar} disabled={gerando}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #ede9fe", background: "#f5f3ff", color: "#7c3aed", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, opacity: gerando ? 0.7 : 1 }}>
          {gerando ? "⏳ Gerando PDF..." : "📄 Gerar relatório PDF para o pediatra"}
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>😴 {fmtDuracao(r.duracao)}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                {fmtDataCompleta(r.inicio)} · {fmtHora(r.inicio)} → {fmtHora(r.fim)}
              </p>
            </div>
            <button onClick={() => remover(i)}
              style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>
              🗑
            </button>
          </div>
        ))}
        {registros.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>Nenhum sono registrado ainda</p>
        )}
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ────────────────────────────────────────
const ABAS = [
  { key: "amamenta", label: "🍼 Amamentação" },
  { key: "fraldas",  label: "👶 Fraldas"      },
  { key: "sono",     label: "😴 Sono"          },
];

export default function BebePage() {
  const router = useRouter();
  const [aba, setAba] = useState("amamenta");

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}>
            ← Voltar
          </button>
          <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>👶 Acompanhamento do Bebê</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Registros para levar ao pediatra</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#fff", padding: 6, borderRadius: 14, border: "1px solid #e2e8f0" }}>
          {ABAS.map(a => (
            <button key={a.key} onClick={() => setAba(a.key)}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all .15s",
                background: aba === a.key ? "#1E3A8A" : "transparent",
                color:      aba === a.key ? "#fff"    : "#64748b",
                boxShadow:  aba === a.key ? "0 2px 8px rgba(30,58,138,.2)" : "none",
              }}>
              {a.label}
            </button>
          ))}
        </div>

        {aba === "amamenta" && <AbaAmamentacao />}
        {aba === "fraldas"  && <AbaFraldas />}
        {aba === "sono"     && <AbaSono />}
      </div>
    </div>
  );
}