"use client";

// app/profile/page.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import Image from "next/image";
import UserMenu from "../components/UserMenu";

export default function Profile() {
  const router  = useRouter();

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [openSection, setOpenSection] = useState("dados");
  const [imageKey, setImageKey] = useState(0);

  const [profileMeta, setProfileMeta] = useState({
    stage: "gestante", event_date: "", base_week: null, base_week_date: null,
  });

  const [userData, setUserData] = useState({
    nome: "", data_nascimento: "", nome_esposa: "",
    data_nascimento_esposa: "", tem_outros_filhos: false, foto_url: null,
  });

  const [filhos, setFilhos]     = useState([]);
  const [novoFilho, setNovoFilho] = useState({ nome: "", data_nascimento: "" });

  const toggleSection = (s) => setOpenSection(openSection === s ? null : s);

  useEffect(() => { loadUserData(); }, []);

  async function loadUserData() {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();

    if (profile) {
      setUserData({
        nome:                    profile.nome || "",
        data_nascimento:         profile.data_nascimento || "",
        nome_esposa:             profile.nome_esposa || "",
        data_nascimento_esposa:  profile.data_nascimento_esposa || "",
        tem_outros_filhos:       profile.tem_outros_filhos || false,
        foto_url:                profile.foto_url || null,
      });
      setProfileMeta({
        stage:          profile.stage,
        event_date:     profile.event_date || "",
        base_week:      profile.base_week,
        base_week_date: profile.base_week_date,
      });
    }

    const { data: filhosData } = await supabase
      .from("filhos").select("*").eq("user_id", user.id);
    if (filhosData) setFilhos(filhosData);
    setLoading(false);
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file || !user) return;
    const supabase = supabaseBrowser();
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const filePath = `profile-photos/${user.id}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ foto_url: data.publicUrl }).eq("id", user.id);
      setUserData(prev => ({ ...prev, foto_url: `${data.publicUrl}?t=${Date.now()}` }));
      setImageKey(prev => prev + 1);
    } catch { alert("Erro ao enviar foto"); }
    finally { setUploading(false); e.target.value = ""; }
  }

  async function handleRemovePhoto() {
    if (!userData.foto_url || !user) return;
    const supabase = supabaseBrowser();
    try {
      setUploading(true);
      await supabase.from("profiles").update({ foto_url: null }).eq("id", user.id);
      setUserData(prev => ({ ...prev, foto_url: null }));
      setImageKey(prev => prev + 1);
    } finally { setUploading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    const supabase = supabaseBrowser();
    const hoje = new Date();
    let baseWeek = profileMeta.base_week;
    let baseWeekDate = profileMeta.base_week_date;

    if (profileMeta.event_date) {
      const evento = new Date(profileMeta.event_date);
      if (profileMeta.stage === "bebe") {
        baseWeek = Math.min(52, Math.floor((hoje - evento) / 604800000) + 1);
      } else {
        const dum = new Date(evento);
        dum.setDate(dum.getDate() - 280);
        baseWeek = Math.min(42, Math.floor((hoje - dum) / 604800000) + 1);
      }
      baseWeekDate = hoje.toISOString().split("T")[0];
    }

    const { error } = await supabase.from("profiles").update({
      nome:                   userData.nome.trim() || null,
      data_nascimento:        userData.data_nascimento || null,
      nome_esposa:            userData.nome_esposa.trim() || null,
      data_nascimento_esposa: userData.data_nascimento_esposa || null,
      tem_outros_filhos:      userData.tem_outros_filhos,
      stage:                  profileMeta.stage,
      event_date:             profileMeta.event_date,
      base_week:              baseWeek,
      base_week_date:         baseWeekDate,
      current_week:           baseWeek,
      updated_at:             new Date().toISOString(),
    }).eq("id", user.id);

    setSaving(false);
    if (error) { alert(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function adicionarFilho() {
    if (!novoFilho.nome || !novoFilho.data_nascimento || !user) {
      alert("Preencha nome e data de nascimento"); return;
    }
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.from("filhos")
      .insert({ user_id: user.id, nome: novoFilho.nome, data_nascimento: novoFilho.data_nascimento })
      .select().single();
    if (error) { alert("Erro ao adicionar filho"); return; }
    setFilhos(prev => [...prev, data]);
    setNovoFilho({ nome: "", data_nascimento: "" });
  }

  async function removerFilho(id) {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("filhos").delete().eq("id", id);
    if (error) { alert("Erro ao remover"); return; }
    setFilhos(prev => prev.filter(f => f.id !== id));
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
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
        <UserMenu />
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: "linear-gradient(135deg, #1E3A8A, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", boxShadow: "0 4px 20px rgba(30,58,138,.25)",
              border: "3px solid #fff",
            }}>
              {userData.foto_url ? (
                <img key={imageKey} src={userData.foto_url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 36, color: "#fff", fontWeight: 800 }}>
                  {userData.nome ? userData.nome[0].toUpperCase() : "👤"}
                </span>
              )}
            </div>
            <input type="file" id="foto" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />
            <label htmlFor="foto" style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: "50%", background: "#1E3A8A",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", border: "2px solid #fff", fontSize: 14,
            }}>
              {uploading ? "⏳" : "📷"}
            </label>
          </div>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>
            {userData.nome || "Meu Perfil"}
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
            {profileMeta.stage === "gestante" ? "🤰 Gestante" : "👶 Pós-parto"}
          </p>
          {userData.foto_url && (
            <button onClick={handleRemovePhoto} style={{ marginTop: 6, background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
              Remover foto
            </button>
          )}
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Seção Dados Pessoais */}
          <Section id="dados" title="👤 Seus Dados" open={openSection === "dados"} onToggle={() => toggleSection("dados")}>
            <Field label="Seu nome">
              <input value={userData.nome} onChange={e => setUserData({ ...userData, nome: e.target.value })}
                placeholder="Como quer ser chamado?" style={inputStyle} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" value={userData.data_nascimento} onChange={e => setUserData({ ...userData, data_nascimento: e.target.value })}
                style={inputStyle} />
            </Field>
          </Section>

          {/* Seção Gestante */}
          <Section id="companheira" title="💑 Dados da Gestante" open={openSection === "companheira"} onToggle={() => toggleSection("companheira")}>
            <Field label="Nome da gestante">
              <input value={userData.nome_esposa} onChange={e => setUserData({ ...userData, nome_esposa: e.target.value })}
                placeholder="Nome da sua companheira" style={inputStyle} />
            </Field>
            <Field label="Data de nascimento dela">
              <input type="date" value={userData.data_nascimento_esposa} onChange={e => setUserData({ ...userData, data_nascimento_esposa: e.target.value })}
                style={inputStyle} />
            </Field>
          </Section>

          {/* Seção Jornada */}
          <Section id="jornada" title="🗓️ Minha Jornada" open={openSection === "jornada"} onToggle={() => toggleSection("jornada")}>
            <Field label="Fase atual">
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { value: "gestante", label: "🤰 Gestante" },
                  { value: "bebe",     label: "👶 Bebê nasceu" },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setProfileMeta({ ...profileMeta, stage: opt.value })}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: profileMeta.stage === opt.value ? "#1E3A8A" : "#f1f5f9",
                      color: profileMeta.stage === opt.value ? "#fff" : "#64748b",
                      fontWeight: 700, fontSize: 13, transition: "all .15s",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={profileMeta.stage === "gestante" ? "Data provável do parto" : "Data de nascimento do bebê"}>
              <input type="date" value={profileMeta.event_date} onChange={e => setProfileMeta({ ...profileMeta, event_date: e.target.value })}
                style={inputStyle} />
            </Field>
          </Section>

          {/* Seção Outros Filhos */}
          <Section id="filhos" title="👨‍👧‍👦 Outros Filhos" open={openSection === "filhos"} onToggle={() => toggleSection("filhos")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                onClick={() => setUserData({ ...userData, tem_outros_filhos: !userData.tem_outros_filhos })}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background .2s",
                  background: userData.tem_outros_filhos ? "#1E3A8A" : "#e2e8f0", position: "relative",
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: userData.tem_outros_filhos ? 23 : 3,
                  transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }} />
              </div>
              <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>Tenho outros filhos</span>
            </div>

            {userData.tem_outros_filhos && (
              <>
                {filhos.map(filho => (
                  <div key={filho.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{filho.nome}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {filho.data_nascimento ? new Date(filho.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => removerFilho(filho.id)}
                      style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>
                      ✕
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input value={novoFilho.nome} onChange={e => setNovoFilho({ ...novoFilho, nome: e.target.value })}
                    placeholder="Nome do filho" style={{ ...inputStyle, flex: 1 }} />
                  <input type="date" value={novoFilho.data_nascimento} onChange={e => setNovoFilho({ ...novoFilho, data_nascimento: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={adicionarFilho}
                    style={{ padding: "0 14px", borderRadius: 10, border: "none", background: "#1E3A8A", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 18 }}>
                    +
                  </button>
                </div>
              </>
            )}
          </Section>

          {/* Botão salvar */}
          <button type="submit" disabled={saving}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #1E3A8A, #3b82f6)",
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(30,58,138,.25)", transition: "all .3s",
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? "Salvando..." : saved ? "✓ Salvo com sucesso!" : "Salvar alterações"}
          </button>

        </form>
      </div>
    </div>
  );
}

function Section({ id, title, open, onToggle, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <button type="button" onClick={onToggle}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{title}</span>
        <span style={{ fontSize: 18, color: "#94a3b8", transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid #f1f5f9" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ paddingTop: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  background: "#f8fafc",
};