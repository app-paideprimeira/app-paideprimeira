"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import { signOutClean } from "../../lib/session/useSession";

export default function UserMenu({ avatarOnly = false }) {
  const router = useRouter();
  const [isOpen, setIsOpen]           = useState(false);
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const menuRef                       = useRef(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("nome, is_premium, stage").eq("id", user.id).single();
        setUserProfile(profile);
      }
    }
    loadUser();
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (path) => { setIsOpen(false); router.push(path); };
  const handleLogout = async () => { await signOutClean(); router.push("/auth/login"); };

  const getInitials = () => {
    if (userProfile?.nome) return userProfile.nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return user?.email?.slice(0, 2).toUpperCase() || "PA";
  };

  const firstName = userProfile?.nome?.split(" ")[0] || user?.email?.split("@")[0] || "Pai";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>

      {/* Botão do avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: avatarOnly ? "transparent" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          border: avatarOnly ? "none" : "1px solid rgba(255,255,255,0.6)",
          borderRadius: 50, padding: avatarOnly ? "0" : "6px 14px 6px 6px",
          cursor: "pointer", boxShadow: avatarOnly ? "none" : "0 2px 12px rgba(0,0,0,0.10)",
          transition: "all .2s",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 12, letterSpacing: "0.5px",
          flexShrink: 0,
        }}>
          {getInitials()}
        </div>
        {!avatarOnly && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {firstName}
          </span>
        )}
        {!avatarOnly && (
          <svg style={{ width: 14, height: 14, color: "#94a3b8", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 260, background: "#fff",
          borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
          border: "1px solid #f1f5f9",
          overflow: "hidden", zIndex: 50,
          animation: "menuIn .18s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <style>{`
            @keyframes menuIn {
              from { opacity: 0; transform: translateY(-8px) scale(.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header do usuário */}
          <div style={{
            padding: "16px 18px",
            background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
            borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0,
              boxShadow: "0 2px 8px rgba(59,130,246,.3)",
            }}>
              {getInitials()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userProfile?.nome || "Pai de Primeira"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                  {user?.email}
                </p>
                {userProfile?.is_premium && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: "linear-gradient(90deg, #f59e0b, #f97316)", color: "#fff", padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "8px 0" }}>
            <MenuSection>
              <MenuItem icon="📅" label="Meu calendário" onClick={() => handleNavigation("/planner")} />
              {userProfile?.stage === "gestante" && (
                <MenuItem icon="💓" label="Contador de contrações" onClick={() => handleNavigation("/contracoes")} />
              )}
              {userProfile?.stage === "bebe" && (
                <MenuItem icon="👶" label="Acompanhamento bebê" onClick={() => handleNavigation("/bebe")} />
              )}
              <MenuItem icon="🛒" label="Produtos recomendados" onClick={() => handleNavigation("/produtos")} />
            </MenuSection>

            <Divider />

            <MenuSection>
              <MenuItem icon="👤" label="Minhas informações" onClick={() => handleNavigation("/profile")} />
              <MenuItem icon="📖" label="Meu diário de pai"  onClick={() => handleNavigation("/diario")} />
            </MenuSection>

            <Divider />

            <MenuSection>
              <MenuItem icon="✉️" label="Fale conosco" onClick={() => window.location.href = "mailto:contato@apppaideprimeira.com"} />
              <MenuItem icon="🚪" label="Sair do app" onClick={handleLogout} danger />
            </MenuSection>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({ children }) {
  return <div style={{ padding: "4px 8px" }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />;
}

function MenuItem({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", borderRadius: 10, border: "none",
        background: hovered ? (danger ? "#fff1f2" : "#f8fafc") : "transparent",
        cursor: "pointer", textAlign: "left", transition: "background .15s",
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 9,
        background: hovered ? (danger ? "#fee2e2" : "#f1f5f9") : "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0, transition: "background .15s",
        border: "1px solid #f1f5f9",
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: danger ? "#ef4444" : "#334155", letterSpacing: "-0.1px" }}>
        {label}
      </span>
    </button>
  );
}