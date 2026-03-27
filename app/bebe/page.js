"use client";

// app/bebe/page.js
import { useState, useEffect, useCallback } from "react";
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
  const [ativo, setAtivo]         = useState(null); // { inicio, seio }
  const [seioAtual, setSeioAtual] = useState("esquerdo");
  const [elapsed, setElapsed]     = useState(0);

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

  function exportar() {
    const r14 = ultimos14dias(registros);
    const total = r14.reduce((s, r) => s + (r.duracao || 0), 0);
    const mediaMin = r14.length ? Math.round(total / r14.length / 60000) : 0;
    const esq = r14.filter(r => r.seio === "esquerdo").length;
    const dir = r14.filter(r => r.seio === "direito").length;

    let txt = `🍼 RELATÓRIO DE AMAMENTAÇÃO — últimos 14 dias\n`;
    txt += `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n\n`;
    txt += `Total de mamadas: ${r14.length}\n`;
    txt += `Duração média: ${mediaMin} min\n`;
    txt += `Seio esquerdo: ${esq}x | Seio direito: ${dir}x\n\n`;
    txt += `📋 Registro detalhado:\n`;
    r14.slice(0, 30).forEach(r => {
      txt += `• ${fmtData(r.inicio)} ${fmtHora(r.inicio)} — ${r.seio === "esquerdo" ? "👈 Esq" : "👉 Dir"} — ${fmtDuracao(r.duracao)}\n`;
    });

    if (navigator.share) {
      navigator.share({ title: "Relatório de Amamentação", text: txt });
    } else {
      navigator.clipboard.writeText(txt);
      alert("Relatório copiado! Cole no WhatsApp ou e-mail.");
    }
  }

  const r14 = ultimos14dias(registros);
  const totalHoje = registros.filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString())).length;

  return (
    <div>
      <InfoCard
        emoji="🍼"
        titulo="Como funciona o registro de amamentação"
        descricao="Selecione o seio, toque em 'Iniciar mamada' quando o bebê começar a mamar e em 'Parar' quando terminar. O app registra o horário e a duração automaticamente para você mostrar ao pediatra ou sua consultora em amamentação."
      />

      {/* Controle */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        {!ativo ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qual seio?</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {["esquerdo", "direito"].map(s => (
                <button key={s} onClick={() => setSeioAtual(s)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all .15s",
                    borderColor: seioAtual === s ? "#1E3A8A" : "#e2e8f0",
                    background: seioAtual === s ? "#eff6ff" : "#fff",
                    color: seioAtual === s ? "#1E3A8A" : "#64748b",
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
            <p style={{ fontSize: 25, color: "#699ce2", margin: "0 0 12px", fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(elapsed / 1000)}s
            </p>
            <button onClick={parar}
              style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(239,68,68,.25)" }}>
              ⏹ Parar
            </button>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Hoje", valor: totalHoje + "x" },
          { label: "14 dias", valor: r14.length + "x" },
          { label: "Média/dia", valor: (r14.length / 14).toFixed(1) + "x" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1E3A8A" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exportar */}
      {r14.length > 0 && (
        <button onClick={exportar}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1E3A8A", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
          📤 Exportar relatório para o pediatra
        </button>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {r.seio === "esquerdo" ? "👈 Seio Esquerdo" : "👉 Seio Direito"} · {fmtDuracao(r.duracao)}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{fmtData(r.inicio)} às {fmtHora(r.inicio)}</p>
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

  function exportar() {
    const r14 = ultimos14dias(registros);
    const xixi   = r14.filter(r => r.tipo === "xixi").length;
    const coco   = r14.filter(r => r.tipo === "coco").length;
    const ambos  = r14.filter(r => r.tipo === "ambos").length;
    const total  = r14.length;

    let txt = `🍼 RELATÓRIO DE FRALDAS — últimos 14 dias\n`;
    txt += `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n\n`;
    txt += `Total de trocas: ${total}\n`;
    txt += `💧 Xixi: ${xixi + ambos}x\n`;
    txt += `💩 Cocô: ${coco + ambos}x\n`;
    txt += `Média de trocas/dia: ${(total / 14).toFixed(1)}\n\n`;
    txt += `📋 Registro detalhado:\n`;
    r14.slice(0, 30).forEach(r => {
      const icon = r.tipo === "xixi" ? "💧" : r.tipo === "coco" ? "💩" : "💧💩";
      txt += `• ${fmtData(r.hora)} ${fmtHora(r.hora)} — ${icon} ${r.tipo}\n`;
    });

    if (navigator.share) {
      navigator.share({ title: "Relatório de Fraldas", text: txt });
    } else {
      const encoded = encodeURIComponent(txt);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  }

  const r14 = ultimos14dias(registros);
  const hoje = registros.filter(r => fmtData(r.hora) === fmtData(new Date().toISOString()));
  const xixi14  = r14.filter(r => r.tipo === "xixi"  || r.tipo === "ambos").length;
  const coco14  = r14.filter(r => r.tipo === "coco"  || r.tipo === "ambos").length;

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
        descricao="Toque no botão correspondente ao tipo de fralda toda vez que trocar. O app registra o horário automaticamente. Ideal para acompanhar a hidratação e saúde intestinal do bebê junto ao pediatra, consultora em amamentação e/ou Equipe de acompanhamento."
      />

      {/* Botões de registro */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {TIPOS.map(t => (
          <button key={t.key} onClick={() => registrar(t.key)}
            style={{ flex: 1, padding: "16px 8px", borderRadius: 14, border: `2px solid ${t.border}`, background: t.bg, color: t.color, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Hoje",      valor: hoje.length + "x" },
          { label: "💧 14 dias", valor: xixi14 + "x" },
          { label: "💩 14 dias", valor: coco14 + "x" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1E3A8A" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exportar */}
      {r14.length > 0 && (
        <button onClick={exportar}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1E3A8A", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
          📤 Exportar relatório para o pediatra
        </button>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => {
          const t = TIPOS.find(t => t.key === r.tipo) || TIPOS[0];
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{fmtData(r.hora)} às {fmtHora(r.hora)}</p>
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
  const [registros, setRegistros] = useState([]);
  const [ativo, setAtivo]         = useState(null);
  const [elapsed, setElapsed]     = useState(0);

  useEffect(() => {
    setRegistros(loadData(KEYS.sono));
    const a = localStorage.getItem("bebe_sono_ativo");
    if (a) setAtivo(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const iv = setInterval(() => setElapsed(Date.now() - new Date(ativo.inicio).getTime()), 1000);
    return () => clearInterval(iv);
  }, [ativo]);

  function iniciar() {
    const a = { inicio: new Date().toISOString() };
    setAtivo(a);
    localStorage.setItem("bebe_sono_ativo", JSON.stringify(a));
    setElapsed(0);
  }

  function parar() {
    if (!ativo) return;
    const fim = new Date().toISOString();
    const duracao = Date.now() - new Date(ativo.inicio).getTime();
    const novo = { ...ativo, fim, duracao };
    const lista = [novo, ...registros].slice(0, 200);
    setRegistros(lista);
    saveData(KEYS.sono, lista);
    localStorage.removeItem("bebe_sono_ativo");
    setAtivo(null);
    setElapsed(0);
  }

  function remover(i) {
    const lista = registros.filter((_, idx) => idx !== i);
    setRegistros(lista);
    saveData(KEYS.sono, lista);
  }

  function exportar() {
    const r14 = ultimos14dias(registros);
    const totalMs = r14.reduce((s, r) => s + (r.duracao || 0), 0);
    const mediaMs = r14.length ? totalMs / r14.length : 0;
    const sonoHoje = registros.filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString()));
    const sonoHojeMs = sonoHoje.reduce((s, r) => s + (r.duracao || 0), 0);

    let txt = `😴 RELATÓRIO DE SONO — últimos 14 dias\n`;
    txt += `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n\n`;
    txt += `Total de períodos de sono: ${r14.length}\n`;
    txt += `Sono total hoje: ${fmtDuracao(sonoHojeMs)}\n`;
    txt += `Duração média por período: ${fmtDuracao(mediaMs)}\n`;
    txt += `Sono total em 14 dias: ${fmtDuracao(totalMs)}\n\n`;
    txt += `📋 Registro detalhado:\n`;
    r14.slice(0, 30).forEach(r => {
      txt += `• ${fmtData(r.inicio)} ${fmtHora(r.inicio)} → ${fmtHora(r.fim)} — ${fmtDuracao(r.duracao)}\n`;
    });

    if (navigator.share) {
      navigator.share({ title: "Relatório de Sono", text: txt });
    } else {
      const encoded = encodeURIComponent(txt);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  }

  const r14 = ultimos14dias(registros);
  const totalHojeMs = registros
    .filter(r => fmtData(r.inicio) === fmtData(new Date().toISOString()))
    .reduce((s, r) => s + (r.duracao || 0), 0);
  const mediaMs = r14.length ? r14.reduce((s, r) => s + (r.duracao || 0), 0) / r14.length : 0;

  return (
    <div>
      <InfoCard
        emoji="😴"
        titulo="Como funciona o registro de sono"
        descricao="Toque em 'Bebê dormiu' quando ele fechar os olhos e em 'Bebê acordou' quando despertar. O app calcula a duração automaticamente. Essencial para o pediatra avaliar o padrão de sono."
      />

      {/* Controle */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        {!ativo ? (
          <button onClick={iniciar}
            style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,.25)" }}>
            🌙 Bebê dormiu
          </button>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
              Dormindo desde {fmtHora(ativo.inicio)}
            </p>
            <p style={{ fontSize: 48, fontWeight: 900, color: "#7c3aed", margin: "8px 0", fontVariantNumeric: "tabular-nums" }}>
              {fmtDuracao(elapsed)}
            </p>
            <button onClick={parar}
              style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: "#f59e0b", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(245,158,11,.25)" }}>
              ☀️ Bebê acordou
            </button>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Sono hoje",   valor: fmtDuracao(totalHojeMs) },
          { label: "14 dias",     valor: r14.length + "x" },
          { label: "Média/sono",  valor: fmtDuracao(mediaMs) },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: s.label === "Sono hoje" || s.label === "Média/sono" ? 16 : 20, fontWeight: 900, color: "#7c3aed" }}>{s.valor}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exportar */}
      {r14.length > 0 && (
        <button onClick={exportar}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #ede9fe", background: "#f5f3ff", color: "#7c3aed", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
          📤 Exportar relatório para o pediatra
        </button>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.slice(0, 20).map((r, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                😴 {fmtDuracao(r.duracao)}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                {fmtData(r.inicio)} · {fmtHora(r.inicio)} → {fmtHora(r.fim)}
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

        {/* Abas */}
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

        {/* Conteúdo da aba */}
        {aba === "amamenta" && <AbaAmamentacao />}
        {aba === "fraldas"  && <AbaFraldas />}
        {aba === "sono"     && <AbaSono />}

      </div>
    </div>
  );
}