"use client";

// app/produtos/page.js
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import UserMenu from "../components/UserMenu";

export default function ProdutosPage() {
  const router   = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading]   = useState(true);
  const [gestante, setGestante] = useState([]);
  const [bebe, setBebe]         = useState([]);
  const [aba, setAba]           = useState("gestante");
  const [busca, setBusca]       = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      await carregarProdutos();
      setLoading(false);
    }
    init();
  }, []);

  async function carregarProdutos() {
    // Busca TODOS os blocos de produto diretamente
    const { data: blocks } = await supabase
      .from("premium_week_blocks")
      .select("week_id, type, title, description, url, cta, payload")
      .in("type", ["produto", "lista_produtos"])
      .limit(1000);

    if (!blocks?.length) return;
    console.log("Blocos encontrados:", blocks.length, blocks.map(b => b.type));

    // Busca TODOS os headers
    const { data: headers } = await supabase
      .from("premium_week_materials")
      .select("id, stage, week")
      .limit(1000);

    if (!headers?.length) return;

    const headerMap = {};
    headers.forEach(h => { headerMap[h.id] = h; });

    const todos = [];
    blocks.forEach(b => {
      const header = headerMap[b.week_id];
      if (!header) return;

      if (b.type === "produto") {
        if (!b.url) return;
        todos.push({
          stage:     header.stage,
          semana:    header.week,
          nome:      b.title,
          descricao: b.description || b.payload?.body || "",
          link:      b.url,
          cta:       b.cta || "Ver produto",
        });
      }

      if (b.type === "lista_produtos") {
        (b.payload?.produtos || []).forEach(p => {
          if (!p.link) return;
          todos.push({
            stage:     header.stage,
            semana:    header.week,
            nome:      p.nome,
            descricao: p.descricao || "",
            link:      p.link,
            cta:       "Ver produto",
          });
        });
      }
    });

    setGestante(todos.filter(p => p.stage === "gestante"));
    setBebe(todos.filter(p => p.stage === "bebe"));
  }

  const lista   = aba === "gestante" ? gestante : bebe;
  const filtrada = busca.trim()
    ? lista.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao.toLowerCase().includes(busca.toLowerCase())
      )
    : lista;

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

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            ← Voltar
          </button>
          <img src="/logo/Logo_email.png" alt="Pai de Primeira" style={{ height: 32, width: "auto", display: "block" }} />
        </div>
        <UserMenu />
      </header>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)", padding: "32px 20px 28px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,.7)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Produtos recomendados
          </p>
          <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
            🛒 Tudo que você precisa na jornada
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,.75)", lineHeight: 1.6 }}>
            Selecionamos os melhores produtos para cada fase — da gestação ao primeiro aniversário.
          </p>

          {/* Busca */}
          <div style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, border: "none", fontSize: 14, boxSizing: "border-box", outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,.15)" }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* ABAS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#fff", padding: 6, borderRadius: 14, border: "1px solid #e2e8f0", maxWidth: 360 }}>
          {[
            { key: "gestante", label: "🤰 Gestação", count: gestante.length },
            { key: "bebe",     label: "👶 Bebê",     count: bebe.length    },
          ].map(a => (
            <button key={a.key} onClick={() => { setAba(a.key); setBusca(""); }}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .15s",
                background: aba === a.key ? "#1E3A8A" : "transparent",
                color:      aba === a.key ? "#fff"    : "#64748b",
                boxShadow:  aba === a.key ? "0 2px 8px rgba(30,58,138,.2)" : "none",
              }}>
              {a.label}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.75 }}>({a.count})</span>
            </button>
          ))}
        </div>

        {/* GRID DE PRODUTOS */}
        {filtrada.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔍</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              {busca ? "Nenhum produto encontrado para essa busca" : "Nenhum produto cadastrado nessa jornada ainda"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtrada.map((p, i) => (
              <ProdutoCard key={i} produto={p} />
            ))}
          </div>
        )}

        {/* Rodapé CTA */}
        {filtrada.length > 0 && (
          <div style={{ marginTop: 40, background: "linear-gradient(135deg, #1E3A8A, #2563EB)", borderRadius: 20, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 20 }}>👶</p>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#fff" }}>
              Acompanhe semana a semana
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
              No app você encontra esses produtos no contexto certo de cada semana da sua jornada.
            </p>
            <button onClick={() => router.push("/")}
              style={{ padding: "12px 28px", borderRadius: 12, border: "2px solid rgba(255,255,255,.4)", background: "rgba(255,255,255,.15)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Ir para o app →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProdutoCard({ produto }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: hovered ? "0 8px 24px rgba(30,58,138,.12)" : "0 1px 4px rgba(0,0,0,.05)",
        transition: "all .2s",
        transform: hovered ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card body */}
      <div style={{ padding: "20px 20px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🛒
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
              {produto.nome}
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 20, display: "inline-block", marginTop: 4 }}>
              {produto.stage === "gestante" ? "🤰 Gestação" : "👶 Bebê"} · Semana {produto.semana}
            </span>
          </div>
        </div>
        {produto.descricao && (
          <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {produto.descricao}
          </p>
        )}
      </div>

      {/* Botão */}
      <div style={{ padding: "0 20px 20px" }}>
        <a
          href={produto.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "11px 16px", borderRadius: 10, border: "none",
            background: hovered ? "#1E3A8A" : "#EFF6FF",
            color: hovered ? "#fff" : "#1E3A8A",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            textDecoration: "none", transition: "all .2s",
            boxSizing: "border-box",
          }}>
          {produto.cta} <span style={{ fontSize: 12 }}>→</span>
        </a>
      </div>
    </div>
  );
}