"use client";

// app/planner/page.js

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseBrowser } from "../../lib/supabase/client";

const CATEGORIAS = {
  consulta:   { label: "Consulta",    icon: "🏥", color: "#0ea5e9" },
  exame:      { label: "Exame",       icon: "🔬", color: "#8b5cf6" },
  compra:     { label: "Compra",      icon: "🛒", color: "#f59e0b" },
  preparacao: { label: "Preparação",  icon: "📋", color: "#10b981" },
  celebracao: { label: "Celebração",  icon: "🎉", color: "#f43f5e" },
  geral:      { label: "Geral",       icon: "📅", color: "#64748b" },
};

const NOTIFICAR_OPCOES = [
  { value: 0, label: "No dia" },
  { value: 1, label: "1 dia antes" },
  { value: 2, label: "2 dias antes" },
  { value: 3, label: "3 dias antes" },
  { value: 7, label: "1 semana antes" },
];

const EMPTY_EVENT = {
  titulo: "", descricao: "", data: "", hora: "09:00",
  categoria: "geral", notificar: true, notificar_dias_antes: 1,
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split("T")[0];
}

function isPast(dateStr) {
  return dateStr < new Date().toISOString().split("T")[0];
}

function groupByMonth(events) {
  const groups = {};
  events.forEach(e => {
    const [y, m] = e.data.split("-");
    const key = `${y}-${m}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function PlannerPage() {
  const router  = useRouter();
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [events, setEvents]       = useState([]);
  const [marcos, setMarcos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMarcos, setShowMarcos] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState("todos"); // todos | pendentes | concluidos
  const [draft, setDraft]         = useState(EMPTY_EVENT);

  const supabase = supabaseBrowser();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth/login"); return; }
    setUser(user);

    const { data: p } = await supabase
      .from("profiles")
      .select("stage, current_week, nome")
      .eq("id", user.id)
      .single();
    setProfile(p);

    const { data: ev } = await supabase
      .from("planner_events")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: true });
    setEvents(ev ?? []);

    if (p) {
      const { data: mx } = await supabase
        .from("planner_marcos_fixos")
        .select("*")
        .eq("stage", p.stage)
        .order("semana", { ascending: true });
      setMarcos(mx ?? []);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setDraft({ ...EMPTY_EVENT, data: new Date().toISOString().split("T")[0] });
    setEditEvent(null);
    setShowModal(true);
  }

  function openEdit(ev) {
    setDraft({
      titulo:              ev.titulo,
      descricao:           ev.descricao || "",
      data:                ev.data,
      hora:                ev.hora || "09:00",
      categoria:           ev.categoria || "geral",
      notificar:           ev.notificar ?? true,
      notificar_dias_antes: ev.notificar_dias_antes ?? 1,
    });
    setEditEvent(ev);
    setShowModal(true);
  }

  async function saveEvent() {
    if (!draft.titulo.trim() || !draft.data) return;
    setSaving(true);

    if (editEvent) {
      await supabase.from("planner_events").update({
        ...draft,
        updated_at: new Date().toISOString(),
      }).eq("id", editEvent.id);
    } else {
      await supabase.from("planner_events").insert({
        ...draft,
        user_id: user.id,
      });
    }

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function toggleDone(ev) {
    await supabase.from("planner_events")
      .update({ concluido: !ev.concluido, updated_at: new Date().toISOString() })
      .eq("id", ev.id);
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, concluido: !e.concluido } : e));
  }

  async function deleteEvent(id) {
    if (!confirm("Remover este evento?")) return;
    await supabase.from("planner_events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function addMarco(marco) {
    // Calcula data aproximada com base na semana do marco
    const hoje = new Date();
    const semanaAtual = profile?.current_week ?? 1;
    const diffSemanas = marco.semana - semanaAtual;
    const data = new Date(hoje);
    data.setDate(data.getDate() + diffSemanas * 7);
    const dataStr = data.toISOString().split("T")[0];

    await supabase.from("planner_events").insert({
      user_id:    user.id,
      titulo:     marco.titulo,
      descricao:  marco.descricao,
      data:       dataStr,
      categoria:  marco.categoria,
      tipo:       "marco_fixo",
      notificar:  true,
      notificar_dias_antes: 3,
      semana_referencia: marco.semana,
    });

    load();
  }

  // Filtragem
  const filtered = events.filter(e => {
    if (filter === "pendentes")  return !e.concluido;
    if (filter === "concluidos") return e.concluido;
    return true;
  });

  const upcoming = events.filter(e => !e.concluido && !isPast(e.data)).slice(0, 3);
  const grouped  = groupByMonth(filtered);

  // Stats
  const total     = events.length;
  const done      = events.filter(e => e.concluido).length;
  const progress  = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f9ff" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1E3A8A", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1E3A8A, #1d4ed8)", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />

        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              ← Voltar
            </button>
            <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={100} height={30} />
            <button onClick={openNew} style={{ background: "#fff", border: "none", color: "#1E3A8A", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 800 }}>
              + Novo
            </button>
          </div>

          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            📅 Meu Planner
          </h1>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14, margin: "0 0 20px" }}>
            Organize os marcos da sua jornada
          </p>

          {/* Progress */}
          {total > 0 && (
            <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 600 }}>Progresso geral</span>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{done}/{total} concluídos</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,.2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#34d399", borderRadius: 3, transition: "width .5s" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {/* PRÓXIMOS EVENTOS */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Próximos eventos
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map(ev => {
                const cat = CATEGORIAS[ev.categoria] || CATEGORIAS.geral;
                return (
                  <div key={ev.id} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderLeft: `4px solid ${cat.color}` }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{ev.titulo}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {isToday(ev.data) ? "🔴 Hoje" : formatDate(ev.data)}
                        {ev.hora && ` às ${ev.hora}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MARCOS SUGERIDOS */}
        <button
          onClick={() => setShowMarcos(!showMarcos)}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px dashed #93c5fd", background: "#eff6ff", color: "#1d4ed8", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          ✨ {showMarcos ? "Ocultar" : "Ver"} marcos sugeridos da jornada
        </button>

        {showMarcos && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
              Toque em "+" para adicionar ao seu planner com data estimada calculada automaticamente.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {marcos.map(m => {
                const cat = CATEGORIAS[m.categoria] || CATEGORIAS.geral;
                const jaAdicionado = events.some(e => e.semana_referencia === m.semana && e.titulo === m.titulo);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: jaAdicionado ? "#f0fdf4" : "#f8fafc", borderRadius: 10, border: `1px solid ${jaAdicionado ? "#bbf7d0" : "#e2e8f0"}` }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{m.titulo}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Semana {m.semana}</p>
                    </div>
                    {jaAdicionado ? (
                      <span style={{ fontSize: 18 }}>✅</span>
                    ) : (
                      <button onClick={() => addMarco(m)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#1E3A8A", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>+</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["todos", "Todos"], ["pendentes", "Pendentes"], ["concluidos", "Concluídos"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: filter === val ? "#1E3A8A" : "#fff", color: filter === val ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* LISTA DE EVENTOS */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p style={{ fontWeight: 700, color: "#334155", fontSize: 16, margin: "0 0 6px" }}>Nenhum evento ainda</p>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Adicione marcos importantes da sua jornada</p>
          </div>
        ) : (
          Object.entries(grouped).map(([monthKey, monthEvents]) => (
            <div key={monthKey} style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, textTransform: "capitalize" }}>
                {monthLabel(monthKey)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {monthEvents.map(ev => {
                  const cat = CATEGORIAS[ev.categoria] || CATEGORIAS.geral;
                  const past = isPast(ev.data) && !isToday(ev.data);
                  return (
                    <div key={ev.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", opacity: ev.concluido ? 0.65 : 1, borderLeft: `4px solid ${ev.concluido ? "#22c55e" : cat.color}`, transition: "opacity .2s" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                        {/* Checkbox */}
                        <button onClick={() => toggleDone(ev)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${ev.concluido ? "#22c55e" : cat.color}`, background: ev.concluido ? "#22c55e" : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                          {ev.concluido && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 14 }}>{cat.icon}</span>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: ev.concluido ? "#94a3b8" : "#0f172a", textDecoration: ev.concluido ? "line-through" : "none" }}>
                              {ev.titulo}
                            </p>
                          </div>
                          {ev.descricao && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{ev.descricao}</p>}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: isToday(ev.data) ? "#ef4444" : past ? "#94a3b8" : "#64748b", fontWeight: isToday(ev.data) ? 800 : 500 }}>
                              {isToday(ev.data) ? "🔴 Hoje" : formatDate(ev.data)}
                              {ev.hora && ` às ${ev.hora}`}
                            </span>
                            {ev.notificar && !ev.concluido && (
                              <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>
                                🔔 {ev.notificar_dias_antes === 0 ? "no dia" : `${ev.notificar_dias_antes}d antes`}
                              </span>
                            )}
                            {ev.tipo === "marco_fixo" && (
                              <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>
                                📌 marco
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => openEdit(ev)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#f1f5f9", color: "#64748b", fontSize: 13, cursor: "pointer" }}>✏️</button>
                          <button onClick={() => deleteEvent(ev.id)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#fef2f2", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL NOVO/EDITAR EVENTO */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", maxHeight: "90vh", overflowY: "auto", animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                {editEvent ? "✏️ Editar evento" : "✨ Novo evento"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <label style={labelStyle}>Título *</label>
                <input value={draft.titulo} onChange={e => setDraft(d => ({ ...d, titulo: e.target.value }))}
                  placeholder="Ex: Ultrassom morfológico" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea value={draft.descricao} onChange={e => setDraft(d => ({ ...d, descricao: e.target.value }))}
                  placeholder="Detalhes opcionais..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Data *</label>
                  <input type="date" value={draft.data} onChange={e => setDraft(d => ({ ...d, data: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Hora</label>
                  <input type="time" value={draft.hora} onChange={e => setDraft(d => ({ ...d, hora: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Categoria</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(CATEGORIAS).map(([key, cat]) => (
                    <button key={key} onClick={() => setDraft(d => ({ ...d, categoria: key }))}
                      style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid", borderColor: draft.categoria === key ? cat.color : "#e2e8f0", background: draft.categoria === key ? cat.color + "20" : "#f8fafc", color: draft.categoria === key ? cat.color : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🔔 Notificar</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Receber push de lembrete</p>
                </div>
                <button onClick={() => setDraft(d => ({ ...d, notificar: !d.notificar }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: draft.notificar ? "#1E3A8A" : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background .2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: draft.notificar ? 23 : 3, transition: "left .2s" }} />
                </button>
              </div>

              {draft.notificar && (
                <div>
                  <label style={labelStyle}>Quando notificar</label>
                  <select value={draft.notificar_dias_antes} onChange={e => setDraft(d => ({ ...d, notificar_dias_antes: Number(e.target.value) }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    {NOTIFICAR_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}

              <button onClick={saveEvent} disabled={saving || !draft.titulo.trim() || !draft.data}
                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "wait" : "pointer", opacity: (!draft.titulo.trim() || !draft.data) ? 0.5 : 1, boxShadow: "0 4px 16px rgba(30,58,138,.3)" }}>
                {saving ? "Salvando..." : editEvent ? "💾 Salvar alterações" : "✨ Adicionar ao planner"}
              </button>

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  color: "#0f172a", fontSize: 14, boxSizing: "border-box", outline: "none",
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
};