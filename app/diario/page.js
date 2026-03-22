"use client";

// app/diario/page.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import Image from "next/image";
import UserMenu from "../components/UserMenu";

export default function Diario() {
  const router = useRouter();

  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [entradas, setEntradas]               = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId]           = useState(null);
  const [entradaSelecionada, setEntradaSelecionada] = useState(null);
  const [novaEntrada, setNovaEntrada]         = useState({ titulo: "", conteudo: "" });

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      setUser(user);

      const { data } = await supabase
        .from("diario").select("*").eq("user_id", user.id)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });

      setEntradas(data || []);
    } catch (err) {
      console.error("Erro ao carregar diário:", err);
    } finally {
      setLoading(false);
    }
  }

  async function salvarEntrada(e) {
    e.preventDefault();
    if (!novaEntrada.titulo.trim() || !novaEntrada.conteudo.trim()) return;
    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const hoje = new Date().toISOString().split("T")[0];

      if (editandoId) {
        await supabase.from("diario").update({
          titulo:     novaEntrada.titulo,
          conteudo:   novaEntrada.conteudo,
          updated_at: new Date().toISOString(),
        }).eq("id", editandoId).eq("user_id", user.id);
      } else {
        await supabase.from("diario").insert({
          user_id:  user.id,
          titulo:   novaEntrada.titulo,
          conteudo: novaEntrada.conteudo,
          data:     hoje,
        });
      }

      await carregarDados();
      cancelar();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function editarEntrada(entrada) {
    setNovaEntrada({ titulo: entrada.titulo, conteudo: entrada.conteudo });
    setEditandoId(entrada.id);
    setMostrarFormulario(true);
    setEntradaSelecionada(null);
  }

  async function excluirEntrada(id) {
    if (!confirm("Remover esta entrada?")) return;
    const supabase = supabaseBrowser();
    await supabase.from("diario").delete().eq("id", id).eq("user_id", user.id);
    setEntradaSelecionada(null);
    await carregarDados();
  }

  function cancelar() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNovaEntrada({ titulo: "", conteudo: "" });
  }

  function formatarData(dataString) {
    return new Date(dataString + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function formatarDataCurta(dataString) {
    return new Date(dataString + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric", month: "short",
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1E3A8A", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
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

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>📖 Meu Diário</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
              {entradas.length > 0 ? `${entradas.length} entrada${entradas.length > 1 ? "s" : ""}` : "Nenhuma entrada ainda"}
            </p>
          </div>
          {!mostrarFormulario && (
            <button onClick={() => setMostrarFormulario(true)}
              style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(30,58,138,.25)" }}>
              + Nova reflexão
            </button>
          )}
        </div>

        {/* Formulário */}
        {mostrarFormulario && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
              {editandoId ? "✏️ Editar entrada" : "✨ Nova reflexão"}
            </h2>
            <form onSubmit={salvarEntrada} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={novaEntrada.titulo}
                onChange={e => setNovaEntrada({ ...novaEntrada, titulo: e.target.value })}
                placeholder="Título da sua reflexão..."
                required
                style={{ ...inputStyle, fontWeight: 700, fontSize: 15 }}
              />
              <textarea
                value={novaEntrada.conteudo}
                onChange={e => setNovaEntrada({ ...novaEntrada, conteudo: e.target.value })}
                placeholder="Escreva livremente... Como você está se sentindo? O que aconteceu hoje?"
                required rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={saving || !novaEntrada.titulo.trim() || !novaEntrada.conteudo.trim()}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Salvando..." : editandoId ? "💾 Salvar" : "✨ Publicar"}
                </button>
                <button type="button" onClick={cancelar}
                  style={{ padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Estado vazio */}
        {!mostrarFormulario && entradas.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Seu diário está vazio</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              Registrar seus sentimentos e momentos nessa jornada vai fazer toda a diferença. Comece agora.
            </p>
            <button onClick={() => setMostrarFormulario(true)}
              style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Escrever primeira reflexão
            </button>
          </div>
        )}

        {/* Lista de entradas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entradas.map((entrada) => (
            <div key={entrada.id}
              onClick={() => setEntradaSelecionada(entrada)}
              style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.05)", border: "1px solid #f1f5f9", transition: "box-shadow .15s", borderLeft: "4px solid #1E3A8A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, flex: 1, marginRight: 12 }}>
                  {entrada.titulo}
                </h3>
                <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, background: "#f8fafc", padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>
                  {formatarDataCurta(entrada.data)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {entrada.conteudo}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Ler mais →</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); editarEntrada(entrada); }}
                    style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                    ✏️
                  </button>
                  <button onClick={e => { e.stopPropagation(); excluirEntrada(entrada.id); }}
                    style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de leitura */}
      {entradaSelecionada && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>{entradaSelecionada.titulo}</h2>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{formatarData(entradaSelecionada.data)}</p>
              </div>
              <button onClick={() => setEntradaSelecionada(null)}
                style={{ background: "#f1f5f9", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                {entradaSelecionada.conteudo}
              </p>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={() => editarEntrada(entradaSelecionada)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1E3A8A, #3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Editar
              </button>
              <button onClick={() => setEntradaSelecionada(null)}
                style={{ padding: "11px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  background: "#f8fafc",
};