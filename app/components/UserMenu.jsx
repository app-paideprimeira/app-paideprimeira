"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", user.id)
          .single();

        setUserProfile(profile);
      }
    }

    loadUser();

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getInitials = () => {
    if (userProfile?.nome) {
      return userProfile.nome
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "PA";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/90 hover:bg-white rounded-full px-4 py-2 shadow-md border border-gray-200 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials()}
        </div>

        <span className="hidden sm:block text-sm font-semibold tracking-tight text-gray-800">
          {userProfile?.nome || user?.email?.split("@")[0]}
        </span>

        <ChevronIcon open={isOpen} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              {userProfile?.nome || "Pai de Primeira"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          {/* Links */}
          <div className="py-2">
            <MenuItem
              icon={<LocationIcon />}
              label="Onde estamos agora"
              onClick={() => handleNavigation("/dashboard")}
            />

            <MenuItem
              icon={<UserIcon />}
              label="Minhas informações"
              onClick={() => handleNavigation("/profile")}
            />

            <MenuItem
              icon={<BookIcon />}
              label="Meu diário de pai"
              onClick={() => handleNavigation("/diario")}
            />

            <MenuItem
              icon={<UsersIcon />}
              label="Outros pais"
              onClick={() => handleNavigation("/comunidade")}
            />
          </div>

          <div className="border-t border-gray-100" />

          <div className="py-2">
            <MenuItem
              icon={<LogoutIcon />}
              label="Sair do app"
              onClick={handleLogout}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- ITEM ---------- */

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition
        ${danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
        }`}
    >
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-semibold tracking-tight">
        {label}
      </span>
    </button>
  );
}

/* ---------- ICONES ---------- */

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const LocationIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.686 6-10a6 6 0 10-12 0c0 4.314 6 10 6 10z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 17.804" />
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 6v15m0-15c-3 0-6 1.5-6 1.5V21c0-1.5 3-3 6-3m0-12c3 0 6 1.5 6 1.5V21c0-1.5-3-3-6-3" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
  </svg>
);
