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
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    }
    
    loadUser();

    // Fechar menu ao clicar fora
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  // Iniciais para avatar
  const getInitials = () => {
    if (userProfile?.nome) {
      return userProfile.nome
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'US';
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão do Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full px-4 py-2 shadow-md transition-all duration-200 border border-gray-200"
      >
        {/* Avatar com iniciais */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {getInitials()}
        </div>
        
        {/* Nome do usuário (visível em telas maiores) */}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {userProfile?.nome || user?.email?.split('@')[0]}
        </span>
        
        {/* Ícone de seta */}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* Cabeçalho com informações do usuário */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Itens do Menu */}
          <div className="py-2">
            <MenuItem 
              icon="👤"
              label="Editar Perfil"
              onClick={() => handleNavigation("/profile")}
            />
            
            <MenuItem 
              icon="📝"
              label="Meu Diário"
              onClick={() => handleNavigation("/diario")}
            />
            
            <MenuItem 
              icon="👥"
              label="Comunidade"
              onClick={() => handleNavigation("/comunidade")}
            />
            
            <MenuItem 
              icon="🏠"
              label="Dashboard"
              onClick={() => handleNavigation("/dashboard")}
            />
            
            <MenuItem 
              icon="ℹ️"
              label="Semanas"
              onClick={() => handleNavigation("/semanas")}
            />
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100"></div>

          {/* Logout */}
          <div className="py-2">
            <MenuItem 
              icon="🚪"
              label="Sair"
              onClick={handleLogout}
              isLogout={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de item do menu
function MenuItem({ icon, label, onClick, isLogout = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-150 ${
        isLogout 
          ? 'text-red-600 hover:bg-red-50' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className={`text-sm font-medium ${isLogout ? 'text-red-600' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}