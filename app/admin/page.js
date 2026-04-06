"use client";

// app/admin/page.js
import { useEffect, useState, useCallback } from "react";

const STAGES = [
  { key: "gestante", label: "Gestante", max: 42, emoji: "🤰" },
  { key: "bebe",     label: "Bebê",     max: 52, emoji: "👶" },
];

const BLOCK_TYPES = [
  { value: "checklist",      label: "✅ Checklist"        },
  { value: "texto",          label: "📝 Texto"            },
  { value: "lembrete_fixo",  label: "📌 Lembrete"         },
  { value: "video",          label: "🎥 Vídeo"            },
  { value: "filme",          label: "🎬 Dica de Filme"    },
  { value: "podcast",        label: "🎧 Podcast"          },
  { value: "audio",          label: "🔊 Áudio"            },
  { value: "leitura",        label: "📖 Dica de Livro"          },
  { value: "produto",        label: "🛒 Produto"          },
  { value: "lista_produtos", label: "🛍️ Lista de Produtos" },
  { value: "imagem",         label: "🖼️ Imagem"           },
  { value: "download",       label: "📥 Download"         },
];

const EMPTY_BLOCK = {
  type: "texto", title: "", description: "", url: "", cta: "", payload: {}, sort_order: 0,
};

async function adminQuery(action, payload) {
  const res = await fetch("/api/admin/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 20px; border-radius:10px; font-size:14px; font-weight:600;
    background:${type === "ok" ? "#166534" : "#991b1b"};
    color:#fff; box-shadow:0 4px 20px rgba(0,0,0,.3);
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export default function AdminPage() {
  const [stage, setStage]   = useState("gestante");
  const [semana, setSemana] = useState(1);
  const [header, setHeader] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [notifDraft, setNotifDraft]     = useState({ title: "", body: "", url: "" });
  const [notifId, setNotifId]           = useState(null);
  const [sendingTest, setSendingTest]   = useState(false);

  const maxWeek = STAGES.find(s => s.key === stage)?.max ?? 42;

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setHeader(null);
    setBlocks([]);
    setEditingBlock(null);
    setNotifId(null);
    setNotifDraft({ title: "", body: "", url: "" });

    const data = await adminQuery("loadWeek", { stage, week: semana });

    if (data.header) {
      setHeader(data.header);
      setBlocks(data.blocks ?? []);
    }

    if (data.notif) {
      setNotifId(data.notif.id);
      setNotifDraft({ title: data.notif.title, body: data.notif.body, url: data.notif.url || "/" });
    }

    setLoading(false);
  }, [stage, semana]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  async function ensureHeader() {
    if (header) return header;
    const data = await adminQuery("saveHeader", {
      headerId: null, stage, week: semana,
      title: `Semana ${semana} — ${stage === "gestante" ? "Gestante" : "Bebê"}`,
      intro: "",
    });
    if (data.header) { setHeader(data.header); return data.header; }
    return null;
  }

  async function saveNotif() {
    if (!notifDraft.title.trim() || !notifDraft.body.trim())
      return toast("Título e mensagem obrigatórios", "err");
    setSaving(true);
    const url = notifDraft.url || `/semanas/${stage}/${semana}`;
    const data = await adminQuery("saveNotif", {
      notifId, stage, week: semana,
      title: notifDraft.title, body: notifDraft.body, url,
    });
    if (data.notifId) { setNotifId(data.notifId); toast("Notificação salva ✓"); }
    else toast(data.error || "Erro ao salvar", "err");
    setSaving(false);
  }

  async function sendTestNotif() {
    if (!notifDraft.title.trim() || !notifDraft.body.trim())
      return toast("Preencha título e mensagem antes de testar", "err");
    setSendingTest(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifDraft.title, body: notifDraft.body, url: notifDraft.url || "/" }),
      });
      const data = await res.json();
      if (data.ok) toast(`✓ Enviado para ${data.sent} dispositivo(s)`);
      else toast(data.error || "Erro ao enviar", "err");
    } catch { toast("Erro ao enviar", "err"); }
    finally { setSendingTest(false); }
  }

  async function saveBlock(block) {
    if (!block.title.trim()) return toast("Título do bloco obrigatório", "err");
    setSaving(true);
    const h = await ensureHeader();
    if (!h) { toast("Erro ao criar semana", "err"); setSaving(false); return; }
    const payload = buildPayload(block);
    const data = await adminQuery("saveBlock", {
      block: { ...block, payload },
      weekId: h.id,
      blocksCount: blocks.length,
    });
    if (data.ok) toast(block.id ? "Bloco salvo ✓" : "Bloco adicionado ✓");
    else toast(data.error || "Erro ao salvar bloco", "err");
    setSaving(false);
    setEditingBlock(null);
    loadWeek();
  }

  async function deleteBlock(blockId) {
    if (!confirm("Remover este bloco?")) return;
    await adminQuery("deleteBlock", { blockId });
    toast("Bloco removido");
    loadWeek();
  }

  async function moveBlock(index, dir) {
    const newBlocks = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    await adminQuery("reorderBlocks", { blocks: newBlocks });
    setBlocks(newBlocks);
  }

  function buildPayload(block) {
    const isPreview = block._isPreview === true;
    const isLoop    = block._isLoop === true;

    if (block.type === "checklist") {
      const items = (block._checklistRaw || "").split("\n").map(s => s.trim()).filter(Boolean);
      return { items, is_preview: isPreview };
    }
    if (block.type === "lista_produtos") {
      const produtos = (block._produtosRaw || "").split("\n").map(line => {
        const parts = line.split("|").map(s => s.trim());
        return { nome: parts[0] || "", descricao: parts[1] || "", link: parts[2] || "" };
      }).filter(p => p.nome);
      return { produtos, is_preview: isPreview };
    }
    if (block.type === "filme") {
      return { onde: block._filmeOnde || "", trailer: block._filmeTrailer || "", body: block._body || "", is_preview: isPreview };
    }
    if (block.type === "download") {
      return { body: block._body || "", is_preview: isPreview };
    }
    if (block.type === "audio") {
      return { body: block._body || "", is_preview: isPreview, loop: isLoop };
    }
    if (["texto", "leitura", "produto", "podcast", "imagem"].includes(block.type))
      return { body: block._body || "", is_preview: isPreview };
    if (block.type === "lembrete_fixo") return { note: block._body || "", is_preview: isPreview };
    return { is_preview: isPreview };
  }

  function prepareForEdit(block) {
    return {
      ...block,
      _body:          block.payload?.body || block.payload?.note || "",
      _checklistRaw:  (block.payload?.items || []).join("\n"),
      _produtosRaw:   (block.payload?.produtos || []).map(p => [p.nome, p.descricao, p.link].join(" | ")).join("\n"),
      _filmeOnde:     block.payload?.onde    || "",
      _filmeTrailer:  block.payload?.trailer || "",
      _isPreview:     block.payload?.is_preview === true,
      _isLoop:        block.payload?.loop === true,
    };
  }

  const stageInfo = STAGES.find(s => s.key === stage);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0" }}>

      <div style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>🛠️ Admin — Pai de Primeira</span>
        <a href="/api/admin/relatorio" target="_blank" rel="noopener noreferrer"
          style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, background: "#166534", color: "#bbf7d0", fontWeight: 700, fontSize: 13, textDecoration: "none", border: "1px solid #166534", cursor: "pointer" }}>
          📊 Exportar relatório Excel
        </a>
        <span style={{ fontSize: 12, color: "#64748b", background: "#0f172a", padding: "4px 10px", borderRadius: 6 }}>localhost only</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* SELETOR */}
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", border: "1px solid #334155" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Jornada</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STAGES.map(s => (
                <button key={s.key} onClick={() => { setStage(s.key); setSemana(1); }}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: stage === s.key ? "#3b82f6" : "#334155", color: stage === s.key ? "#fff" : "#94a3b8" }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Semana (1–{maxWeek})</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setSemana(s => Math.max(1, s - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "#334155", color: "#e2e8f0", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>‹</button>
              <input type="number" min={1} max={maxWeek} value={semana}
                onChange={e => setSemana(Math.min(maxWeek, Math.max(1, Number(e.target.value))))}
                style={{ width: 64, textAlign: "center", padding: "8px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#f8fafc", fontSize: 16, fontWeight: 700 }} />
              <button onClick={() => setSemana(s => Math.min(maxWeek, s + 1))} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "#334155", color: "#e2e8f0", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>›</button>
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {loading && <span style={{ fontSize: 13, color: "#64748b" }}>Carregando...</span>}
            {!loading && <span style={{ fontSize: 12, background: blocks.length > 0 ? "#166534" : "#1e3a5f", color: blocks.length > 0 ? "#bbf7d0" : "#93c5fd", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
              {blocks.length > 0 ? `✓ ${blocks.length} bloco${blocks.length !== 1 ? "s" : ""}` : "Semana vazia"}
            </span>}
          </div>
        </div>

        {/* NOTIFICAÇÃO */}
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            🔔 Notificação Push — Semana {semana}
          </div>
          <p style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>
            Enviada automaticamente às 20:30 no dia que o usuário entrar nessa semana.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Título da notificação</label>
              <input value={notifDraft.title} onChange={e => setNotifDraft(d => ({ ...d, title: e.target.value }))}
                placeholder={`Ex: 🤰 Semana ${semana} chegou!`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mensagem</label>
              <textarea value={notifDraft.body} onChange={e => setNotifDraft(d => ({ ...d, body: e.target.value }))}
                placeholder="Ex: Seu bebê está do tamanho de um damasco. Veja o que muda essa semana."
                rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>URL ao clicar (opcional)</label>
              <input value={notifDraft.url} onChange={e => setNotifDraft(d => ({ ...d, url: e.target.value }))}
                placeholder={`/semanas/${stage}/${semana}`} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveNotif} disabled={saving} style={{ ...btnPrimary }}>
                {saving ? "Salvando..." : notifId ? "💾 Salvar notificação" : "✨ Criar notificação"}
              </button>
              <button onClick={sendTestNotif} disabled={sendingTest || !notifDraft.title}
                style={{ ...btnPrimary, background: "#7c3aed", opacity: (!notifDraft.title || sendingTest) ? 0.5 : 1 }}>
                {sendingTest ? "Enviando..." : "🧪 Testar agora"}
              </button>
            </div>
            {notifId && (
              <p style={{ fontSize: 11, color: "#166534", background: "#052e16", padding: "6px 12px", borderRadius: 6 }}>
                ✓ Notificação cadastrada — será enviada automaticamente na semana {semana}
              </p>
            )}
          </div>
        </div>

        {/* BLOCOS */}
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>🧩 Blocos de Conteúdo — Semana {semana} {stageInfo?.emoji}</span>
            <button onClick={() => setEditingBlock({ ...EMPTY_BLOCK, _body: "", _checklistRaw: "", _produtosRaw: "", _filmeOnde: "", _filmeTrailer: "", _isPreview: false, _isLoop: false })} style={btnPrimary}>+ Novo bloco</button>
          </div>
          {blocks.length === 0 && (
            <p style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
              Nenhum bloco ainda. Clique em "Novo bloco" para começar.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {blocks.map((block, i) => (
              <div key={block.id} style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", border: `1px solid ${block.payload?.is_preview ? "#854d0e" : "#334155"}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveBlock(i, -1)} disabled={i === 0} style={arrowBtn}>▲</button>
                  <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} style={arrowBtn}>▼</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, background: "#1e3a5f", color: "#93c5fd", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                      {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                    </span>
                    {block.payload?.is_preview && (
                      <span style={{ fontSize: 10, background: "#78350f", color: "#fcd34d", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                        👁 Preview gratuito
                      </span>
                    )}
                    {block.type === "audio" && block.payload?.loop && (
                      <span style={{ fontSize: 10, background: "#1e3a5f", color: "#7dd3fc", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                        🔁 Loop ativo
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.title}</span>
                  </div>
                  {block.description && <p style={{ fontSize: 12, color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.description}</p>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditingBlock(prepareForEdit(block))} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#334155", color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Editar</button>
                  <button onClick={() => deleteBlock(block.id)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#450a0a", color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {editingBlock !== null && (
        <BlockModal block={editingBlock} onSave={saveBlock} onClose={() => setEditingBlock(null)} saving={saving} />
      )}
    </div>
  );
}

function BlockModal({ block: initial, onSave, onClose, saving }) {
  const [block, setBlock] = useState(initial);
  const set = (k, v) => setBlock(b => ({ ...b, [k]: v }));

  const needsLink      = ["video", "podcast", "audio", "leitura", "produto", "imagem", "download"].includes(block.type);
  const needsBody      = ["texto", "leitura", "produto", "lembrete_fixo", "podcast", "audio", "imagem", "download"].includes(block.type);
  const needsChecklist = block.type === "checklist";
  const needsListaProd = block.type === "lista_produtos";
  const needsFilme     = block.type === "filme";
  const needsDownload  = block.type === "download";
  const isAudio        = block.type === "audio";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#1e293b", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#f8fafc" }}>{block.id ? "✏️ Editar bloco" : "✨ Novo bloco"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Tipo de bloco</label>
            <select value={block.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Título *</label>
            <input value={block.title} onChange={e => set("title", e.target.value)} placeholder="Título do bloco" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descrição (subtítulo curto)</label>
            <input value={block.description || ""} onChange={e => set("description", e.target.value)} placeholder="Uma linha descritiva opcional" style={inputStyle} />
          </div>

          {/* PREVIEW GRATUITO */}
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              id="isPreview"
              checked={block._isPreview === true}
              onChange={e => set("_isPreview", e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#f59e0b" }}
            />
            <div>
              <label htmlFor="isPreview" style={{ fontSize: 13, fontWeight: 700, color: "#fcd34d", cursor: "pointer" }}>
                👁 Mostrar como preview gratuito
              </label>
              <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                Usuários free verão este bloco completo como degustação
              </p>
            </div>
          </div>

          {/* LOOP — apenas para áudio */}
          {isAudio && (
            <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", border: "1px solid #1e3a5f", display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                id="isLoop"
                checked={block._isLoop === true}
                onChange={e => set("_isLoop", e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#3b82f6" }}
              />
              <div>
                <label htmlFor="isLoop" style={{ fontSize: 13, fontWeight: 700, color: "#7dd3fc", cursor: "pointer" }}>
                  🔁 Reproduzir em loop
                </label>
                <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                  Ideal para ruído branco, sons ambiente e músicas de relaxamento
                </p>
              </div>
            </div>
          )}

          {/* Campos específicos de DOWNLOAD */}
          {needsDownload && (
            <>
              <div>
                <label style={labelStyle}>URL do arquivo (Supabase Storage)</label>
                <input value={block.url || ""} onChange={e => set("url", e.target.value)}
                  placeholder="https://...supabase.co/storage/v1/object/public/..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Label do botão (opcional)</label>
                <input value={block.cta || ""} onChange={e => set("cta", e.target.value)}
                  placeholder="Ex: Baixar plano de parto..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descrição completa (opcional)</label>
                <textarea value={block._body || ""} onChange={e => set("_body", e.target.value)}
                  placeholder="Descreva o conteúdo do arquivo..."
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </>
          )}

          {/* Campos específicos de FILME */}
          {needsFilme && (
            <>
              <div>
                <label style={labelStyle}>Onde assistir</label>
                <input value={block._filmeOnde || ""} onChange={e => set("_filmeOnde", e.target.value)}
                  placeholder="Ex: Netflix, Prime Video, Disney+" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Link do trailer (YouTube)</label>
                <input value={block._filmeTrailer || ""} onChange={e => set("_filmeTrailer", e.target.value)}
                  placeholder="https://youtu.be/..." style={inputStyle} />
              </div>
              {block._filmeTrailer && (() => {
                const ytMatch = block._filmeTrailer.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
                const ytId = ytMatch?.[1];
                return ytId ? (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #334155", aspectRatio: "16/9" }}>
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`}
                      title="Trailer preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : null;
              })()}
              <div>
                <label style={labelStyle}>Por que assistir (opcional)</label>
                <textarea value={block._body || ""} onChange={e => set("_body", e.target.value)}
                  placeholder="Explique por que esse filme é relevante para pais..."
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </>
          )}

          {/* Campos padrão para outros tipos */}
          {needsLink && !needsDownload && (
            <div>
              <label style={labelStyle}>{block.type === "imagem" ? "URL da imagem" : "URL"}</label>
              <input value={block.url || ""} onChange={e => set("url", e.target.value)}
                placeholder={block.type === "imagem" ? "https://exemplo.com/imagem.jpg" : "https://..."} style={inputStyle} />
            </div>
          )}
          {block.type === "imagem" && block.url && (
            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #334155" }}>
              <img src={block.url} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />
            </div>
          )}
          {needsLink && !needsDownload && block.type !== "imagem" && (
            <div>
              <label style={labelStyle}>Label do botão (CTA)</label>
              <input value={block.cta || ""} onChange={e => set("cta", e.target.value)}
                placeholder={block.type === "video" ? "Assistir no YouTube" : block.type === "produto" ? "Ver produto" : "Ver recomendação"}
                style={inputStyle} />
            </div>
          )}
          {needsBody && !needsDownload && !needsFilme && (
            <div>
              <label style={labelStyle}>{block.type === "lembrete_fixo" ? "Nota do lembrete" : block.type === "imagem" ? "Legenda (opcional)" : "Texto completo"}</label>
              <textarea value={block._body || ""} onChange={e => set("_body", e.target.value)}
                placeholder={block.type === "imagem" ? "Texto de legenda abaixo da imagem..." : "Texto que aparece no card..."}
                rows={block.type === "imagem" ? 2 : 5} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          )}
          {needsChecklist && (
            <div>
              <label style={labelStyle}>Itens do checklist (um por linha)</label>
              <textarea value={block._checklistRaw || ""} onChange={e => set("_checklistRaw", e.target.value)}
                placeholder={"Pesquisar sobre pré-natal\nPerguntar como ela está\nAvisar família próxima"}
                rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} />
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                {(block._checklistRaw || "").split("\n").filter(s => s.trim()).length} itens
              </p>
            </div>
          )}
          {needsListaProd && (
            <div>
              <label style={labelStyle}>Produtos (um por linha)</label>
              <p style={{ fontSize: 11, color: "#475569", marginBottom: 8, marginTop: -8 }}>
                Formato: <span style={{ color: "#93c5fd", fontFamily: "monospace" }}>Nome | Descrição | https://link.com</span>
              </p>
              <textarea value={block._produtosRaw || ""} onChange={e => set("_produtosRaw", e.target.value)}
                placeholder={"Mochila para bebê | Excelente para passeios | https://amazon.com.br/..."}
                rows={8} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                {(block._produtosRaw || "").split("\n").filter(s => s.trim()).length} produto(s)
              </p>
            </div>
          )}
          {block.id && (
            <div>
              <label style={labelStyle}>Posição (ordem)</label>
              <input type="number" value={block.sort_order} onChange={e => set("sort_order", Number(e.target.value))} style={{ ...inputStyle, width: 80 }} />
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #334155", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSave(block)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando..." : block.id ? "💾 Salvar alterações" : "✨ Adicionar bloco"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", outline: "none" };
const btnPrimary = { padding: "9px 20px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const arrowBtn   = { width: 24, height: 22, borderRadius: 4, border: "none", background: "#334155", color: "#94a3b8", fontSize: 11, cursor: "pointer", padding: 0, lineHeight: 1 };