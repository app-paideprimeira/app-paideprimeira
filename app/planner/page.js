"use client";

// app/planner/page.js
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import UserMenu from "../components/UserMenu";

const MARCOS_GESTANTE = [
  { semana: 6,  key: "consulta_6",    titulo: "🩺 Primeira consulta pré-natal" },
  { semana: 8,  key: "ultrassom_8",   titulo: "🔊 Ultrassom 1º trimestre" },
  { semana: 10, key: "dna_fetal",     titulo: "🧬 Teste DNA fetal (opcional)" },
  { semana: 12, key: "translucencia", titulo: "🔊 Translucência nucal" },
  { semana: 16, key: "consulta_16",   titulo: "🩺 Consulta pré-natal" },
  { semana: 20, key: "morfologico",   titulo: "🔊 Ultrassom morfológico" },
  { semana: 24, key: "consulta_24",   titulo: "🩺 Consulta pré-natal" },
  { semana: 24, key: "glicose",       titulo: "🩸 Teste tolerância à glicose" },
  { semana: 28, key: "consulta_28",   titulo: "🩺 Consulta pré-natal" },
  { semana: 32, key: "ultrassom_32",  titulo: "🔊 Ultrassom 3º trimestre" },
  { semana: 34, key: "strep_b",       titulo: "🧫 Teste Streptococcus B" },
  { semana: 36, key: "consulta_36",   titulo: "🩺 Consulta pré-natal" },
  { semana: 36, key: "hospital_tour", titulo: "🏥 Visita à maternidade" },
  { semana: 38, key: "consulta_38",   titulo: "🩺 Consulta pré-natal" },
  { semana: 40, key: "dpp",           titulo: "👶 Data prevista do parto" },
];

const MARCOS_BEBE = [
  { semana: 1,  key: "alta_hospital",      titulo: "🏥 Alta hospitalar" },
  { semana: 1,  key: "teste_coracaozinho", titulo: "❤️ Teste do coraçãozinho" },
  { semana: 1,  key: "teste_olhinho",      titulo: "👁️ Teste do olhinho" },
  { semana: 1,  key: "vacina_bcg",         titulo: "💉 Vacina BCG" },
  { semana: 1,  key: "vacina_hepb_1",      titulo: "💉 Vacina Hepatite B (1ª dose)" },
  { semana: 2,  key: "teste_pezinho",      titulo: "🦶 Teste do pezinho" },
  { semana: 2,  key: "teste_orelhinha",    titulo: "👂 Teste da orelhinha" },
  { semana: 2,  key: "consulta_bebe_1",    titulo: "🩺 Consulta pediatra (1ª semana)" },
  { semana: 4,  key: "consulta_1m",        titulo: "🩺 Consulta pediatra 1 mês" },
  { semana: 8,  key: "vacina_2m",          titulo: "💉 Vacinas 2 meses (Penta, VIP, Pneumo 10, Rotavírus)" },
  { semana: 8,  key: "consulta_2m",        titulo: "🩺 Consulta pediatra 2 meses" },
  { semana: 12, key: "vacina_3m",          titulo: "💉 Vacinas 3 meses (Penta, VIP, Rotavírus)" },
  { semana: 16, key: "vacina_4m",          titulo: "💉 Vacinas 4 meses (Penta, VIP, Pneumo 10)" },
  { semana: 16, key: "consulta_4m",        titulo: "🩺 Consulta pediatra 4 meses" },
  { semana: 22, key: "consulta_5m",        titulo: "🩺 Consulta pediatra 5 meses" },
  { semana: 26, key: "vacina_6m",          titulo: "💉 Vacinas 6 meses (Penta, VIP, Influenza, Hep B 3ª dose)" },
  { semana: 26, key: "consulta_6m",        titulo: "🩺 Consulta pediatra 6 meses" },
  { semana: 26, key: "introducao",         titulo: "🥣 Introdução alimentar" },
  { semana: 39, key: "vacina_9m",          titulo: "💉 Vacinas 9 meses (Febre Amarela, Meningocócica C)" },
  { semana: 39, key: "consulta_9m",        titulo: "🩺 Consulta pediatra 9 meses" },
  { semana: 52, key: "vacina_12m",         titulo: "💉 Vacinas 12 meses (Tríplice viral, DTP, Hepatite A, Pneumo 10 reforço)" },
  { semana: 52, key: "consulta_12m",       titulo: "🩺 Consulta pediatra 12 meses" },
  { semana: 52, key: "aniversario_1",      titulo: "🎂 1º Aniversário!" },
];

function calcularDataMarco(eventDate, baseWeek, semanaMarco, stage) {
  const base = new Date(eventDate + "T12:00:00");
  if (stage === "gestante") {
    base.setDate(base.getDate() + semanaMarco * 7);
  } else {
    base.setDate(base.getDate() + (semanaMarco - (baseWeek || 1)) * 7);
  }
  if (base.getDay() === 0) base.setDate(base.getDate() + 1);
  return base.toISOString().split("T")[0];
}

const MONTHS   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS_DESKTOP = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WEEKDAYS_MOBILE  = ["D","S","T","Q","Q","S","S"];

const TYPE_COLORS = {
  nota:  { bg: "#3b82f6", light: "#dbeafe", text: "#1d4ed8" },
  marco: { bg: "#f59e0b", light: "#fef3c7", text: "#b45309" },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function PlannerPage() {
  const router   = useRouter();
  const supabase = supabaseBrowser();
  const isMobile = useIsMobile();

  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [events, setEvents]             = useState({});
  const [today]                         = useState(() => new Date());
  const [viewYear, setViewYear]         = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth]       = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draftTitle, setDraftTitle]     = useState("");
  const [draftNote, setDraftNote]       = useState("");
  const [draftTime, setDraftTime]       = useState("");
  const [draftDate, setDraftDate]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [sheetOpen, setSheetOpen]       = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data: p } = await supabase
        .from("profiles")
        .select("stage, current_week, event_date, base_week")
        .eq("id", user.id)
        .single();

      const prof = { ...p, id: user.id };
      setProfile(prof);
      await loadEvents(user.id);
      setLoading(false);

      if (p?.event_date && p?.stage) initMarcos(prof);
    }
    init();
  }, []);

  const loadEvents = useCallback(async (userId) => {
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("time", { ascending: true, nullsFirst: true });

    const map = {};
    (data || []).forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    setEvents(map);
  }, [supabase]);

  async function initMarcos(prof) {
    const marcos = prof.stage === "gestante" ? MARCOS_GESTANTE : MARCOS_BEBE;
    const toUpsert = marcos.map(m => ({
      user_id:   prof.id,
      date:      calcularDataMarco(prof.event_date, prof.base_week, m.semana, prof.stage),
      title:     m.titulo,
      type:      "marco",
      marco_key: m.key,
    }));
    if (toUpsert.length > 0) {
      await supabase
        .from("calendar_events")
        .upsert(toUpsert, { onConflict: "user_id,marco_key", ignoreDuplicates: true });
      await loadEvents(prof.id);
    }
  }

  function selectDate(dateStr) {
    if (selectedDate === dateStr && !editingEvent) { closePanel(); return; }
    setSelectedDate(dateStr);
    setEditingEvent(null);
    setDraftTitle("");
    setDraftNote("");
    setDraftTime("");
    setDraftDate(dateStr);
    if (isMobile) {
      setSheetOpen(true);
    } else {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }

  function closePanel() {
    setSelectedDate(null);
    setEditingEvent(null);
    setDraftTitle("");
    setDraftNote("");
    setDraftTime("");
    setDraftDate("");
    setSheetOpen(false);
  }

  function startEdit(ev, e) {
    e.stopPropagation();
    setSelectedDate(ev.date);
    setEditingEvent(ev);
    setDraftTitle(ev.title);
    setDraftNote(ev.note || "");
    setDraftTime(ev.time ? ev.time.slice(0, 5) : "");
    setDraftDate(ev.date);
    if (isMobile) setSheetOpen(true);
    else setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function saveEvent() {
    if (!draftTitle.trim() || !profile) return;
    const targetDate = draftDate || selectedDate;
    if (!targetDate) return;
    setSaving(true);

    if (editingEvent) {
      await supabase.from("calendar_events").update({
        title:      draftTitle,
        note:       draftNote || null,
        time:       draftTime || null,
        date:       targetDate,
        updated_at: new Date().toISOString(),
      }).eq("id", editingEvent.id);

      if (targetDate !== editingEvent.date) {
        setSelectedDate(targetDate);
        const [y, m] = targetDate.split("-").map(Number);
        setViewYear(y); setViewMonth(m - 1);
      }
      setEditingEvent(null);
    } else {
      await supabase.from("calendar_events").insert({
        user_id: profile.id,
        date:    targetDate,
        title:   draftTitle,
        note:    draftNote || null,
        time:    draftTime || null,
        type:    "nota",
      });
    }

    setDraftTitle(""); setDraftNote(""); setDraftTime("");
    setDraftDate(targetDate);
    await loadEvents(profile.id);
    setSaving(false);
    if (!isMobile) setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function deleteEvent(evId, e) {
    e.stopPropagation();
    if (!confirm("Remover este evento?")) return;
    await supabase.from("calendar_events").delete().eq("id", evId);
    setEditingEvent(null);
    setDraftTitle("");
    await loadEvents(profile.id);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay       = new Date(viewYear, viewMonth, 1).getDay();
  const todayStr       = today.toISOString().split("T")[0];
  const selectedEvents = selectedDate ? (events[selectedDate] || []) : [];
  const WEEKDAYS       = isMobile ? WEEKDAYS_MOBILE : WEEKDAYS_DESKTOP;
  const CELL_HEIGHT    = isMobile ? 52 : 88;

  // ── Painel de eventos (reutilizado no desktop e no bottom sheet) ──
  const PainelConteudo = () => (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
          {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <button onClick={closePanel} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</button>
      </div>

      {selectedEvents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {selectedEvents.map(ev => {
            const c = TYPE_COLORS[ev.type] || TYPE_COLORS.nota;
            const isEditingThis = editingEvent?.id === ev.id;
            return (
              <div key={ev.id} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${c.light}` }}>
                {isEditingThis ? (
                  <div style={{ padding: 10, background: c.light, display: "flex", flexDirection: "column", gap: 7 }}>
                    <input ref={inputRef} value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                      placeholder="Título" onKeyDown={e => e.key === "Enter" && saveEvent()}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, fontWeight: 600, boxSizing: "border-box", outline: "none" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Data</label>
                      <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Horário (opcional)</label>
                      <input type="time" value={draftTime} onChange={e => setDraftTime(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)}
                      placeholder="Nota (opcional)" rows={2}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEvent} disabled={saving}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        {saving ? "..." : "💾 Salvar"}
                      </button>
                      <button onClick={() => { setEditingEvent(null); setDraftTitle(""); setDraftNote(""); setDraftTime(""); setDraftDate(selectedDate); }}
                        style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" }}>✕</button>
                      <button onClick={e => deleteEvent(ev.id, e)}
                        style={{ padding: "9px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>🗑</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={e => startEdit(ev, e)}
                    style={{ padding: "9px 12px", background: c.light, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        {ev.time && <span style={{ fontSize: 10, fontWeight: 700, color: c.text }}>{ev.time.slice(0,5)}</span>}
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{ev.title}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 20, background: c.bg, color: "#fff", fontWeight: 600 }}>
                          {ev.type === "marco" ? "Marco" : "Nota"}
                        </span>
                      </div>
                      {ev.note && <p style={{ fontSize: 11, color: "#475569", margin: "3px 0 0", lineHeight: 1.4 }}>{ev.note}</p>}
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>✏️</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!editingEvent && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
            + Nova nota
          </p>
          <input ref={inputRef} value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && saveEvent()}
            placeholder="O que acontece nesse dia?"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none", color: "#1e293b" }} />
          <input type="time" value={draftTime} onChange={e => setDraftTime(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)}
            placeholder="Detalhes (opcional)" rows={2}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          <button onClick={saveEvent} disabled={saving || !draftTitle.trim()}
            style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none", background: draftTitle.trim() ? "#3b82f6" : "#e2e8f0", color: draftTitle.trim() ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 14, cursor: draftTitle.trim() ? "pointer" : "default", transition: "all .15s" }}>
            {saving ? "Salvando..." : "Adicionar nota"}
          </button>
        </div>
      )}
    </>
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #3b82f6", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "10px 12px" : "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12 }}>
          <button onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, padding: isMobile ? "6px 4px" : "6px 10px", borderRadius: 8, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            {isMobile ? "←" : "← Voltar"}
          </button>
          <img src="/logo/logo_email.png" alt="Pai de Primeira" style={{ height: isMobile ? 26 : 36, width: "auto", display: "block" }} />
        </div>
        {isMobile ? <UserMenu avatarOnly /> : <UserMenu />}
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "14px 10px" : "24px 16px", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}>

        {/* CABEÇALHO */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h1 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>📅 Meu Planner</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 15, color: "#475569" }}>‹</button>
            <span style={{ fontSize: isMobile ? 12 : 15, fontWeight: 800, color: "#0f172a", minWidth: isMobile ? 100 : 155, textAlign: "center" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 15, color: "#475569" }}>›</button>
            <button
              onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); selectDate(todayStr); }}
              style={{ padding: isMobile ? "5px 8px" : "7px 14px", borderRadius: 8, border: "1px solid #dbeafe", background: "#eff6ff", cursor: "pointer", fontSize: isMobile ? 11 : 13, fontWeight: 700, color: "#3b82f6" }}>
              Hoje
            </button>
          </div>
        </div>

        {/* CALENDÁRIO + PAINEL */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* CALENDÁRIO */}
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>

            {/* Header dias da semana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f1f5f9" }}>
              {WEEKDAYS.map((d, i) => (
                <div key={i} style={{ padding: isMobile ? "7px 0" : "10px 0", textAlign: "center", fontSize: isMobile ? 10 : 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} style={{ height: CELL_HEIGHT, borderRight: "1px solid #f8fafc", borderBottom: "1px solid #f8fafc", background: "#fafafa" }} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day       = i + 1;
                const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday   = dateStr === todayStr;
                const isSel     = dateStr === selectedDate;
                const dayEvts   = events[dateStr] || [];
                const col       = (firstDay + i) % 7;
                const isWeekend = col === 0 || col === 6;

                return (
                  <div key={day} onClick={() => selectDate(dateStr)}
                    style={{
                      height: CELL_HEIGHT,
                      overflow: "hidden",
                      borderRight: "1px solid #f1f5f9",
                      borderBottom: "1px solid #f1f5f9",
                      padding: isMobile ? "4px 3px" : "6px 5px",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      background: isSel ? "#eff6ff" : isToday ? "#f0fdf4" : isWeekend ? "#fafafa" : "#fff",
                      transition: "background .1s",
                    }}
                  >
                    <div style={{
                      width: isMobile ? 20 : 24,
                      height: isMobile ? 20 : 24,
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isMobile ? 11 : 12,
                      fontWeight: isToday ? 800 : 500,
                      marginBottom: isMobile ? 2 : 3,
                      flexShrink: 0,
                      background: isToday ? "#3b82f6" : "transparent",
                      color: isToday ? "#fff" : isSel ? "#2563eb" : isWeekend ? "#94a3b8" : "#334155",
                    }}>
                      {day}
                    </div>

                    {/* Mobile: dots coloridos | Desktop: texto do evento */}
                    {isMobile ? (
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", paddingLeft: 1 }}>
                        {dayEvts.slice(0, 3).map(ev => {
                          const c = TYPE_COLORS[ev.type] || TYPE_COLORS.nota;
                          return <div key={ev.id} style={{ width: 6, height: 6, borderRadius: "50%", background: c.bg }} />;
                        })}
                        {dayEvts.length > 3 && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1" }} />}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                        {dayEvts.slice(0, 2).map(ev => {
                          const c = TYPE_COLORS[ev.type] || TYPE_COLORS.nota;
                          return (
                            <div key={ev.id} onClick={e => startEdit(ev, e)} title={ev.title}
                              style={{ fontSize: 9, fontWeight: 600, padding: "1px 4px", borderRadius: 3, background: c.light, color: c.text, whiteSpace: "normal", lineHeight: 1.2, overflow: "hidden", maxHeight: 28 }}>
                              {ev.time ? ev.time.slice(0,5) + " " : ""}{ev.title}
                            </div>
                          );
                        })}
                        {dayEvts.length > 2 && <div style={{ fontSize: 9, color: "#94a3b8", paddingLeft: 3 }}>+{dayEvts.length - 2}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAINEL LATERAL — desktop only */}
          {!isMobile && (
            selectedDate ? (
              <div style={{ width: 300, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <PainelConteudo />
              </div>
            ) : (
              <div style={{ width: 300, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1px dashed #e2e8f0", padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 200 }}>
                <span style={{ fontSize: 32 }}>👆</span>
                <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", margin: 0 }}>Clique em um dia para ver ou adicionar notas</p>
              </div>
            )
          )}
        </div>

        {/* LEGENDA */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color.bg }} />
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {type === "nota" ? "Nota pessoal" : "Marco da jornada"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SHEET — mobile only */}
      {isMobile && (
        <>
          {sheetOpen && (
            <div onClick={closePanel}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 40 }} />
          )}
          <div style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,.15)",
            padding: "0 16px 36px",
            maxHeight: "82vh",
            overflowY: "auto",
            transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform .3s cubic-bezier(.4,0,.2,1)",
          }}>
            <div style={{ position: "sticky", top: 0, background: "#fff", paddingTop: 12, paddingBottom: 4, zIndex: 1 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 12px" }} />
            </div>
            {selectedDate && <PainelConteudo />}
          </div>
        </>
      )}
    </div>
  );
}