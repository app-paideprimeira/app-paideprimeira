"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      console.log("🔐 Iniciando login...");

      // 1. Fazer login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (loginError) throw loginError;

      console.log("✅ Login bem-sucedido");

      // 2. Pequeno delay para garantir que o auth state foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Buscar usuário
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuário não encontrado");

      console.log("👤 Usuário:", user?.id);

      // 4. Verificar/Criar perfil
      let profile = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      console.log("📊 Perfil encontrado:", profileData);
      console.log("❌ Erro ao buscar perfil:", profileError);

      if (profileError) {
        // Perfil não existe, criar um
        if (profileError.code === 'PGRST116') {
          console.log("🆕 Criando perfil para usuário novo...");
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, onboarding_complete: false });
          
          console.log("❌ Erro ao criar perfil:", insertError);
          
          if (insertError) throw insertError;
          profile = { onboarding_complete: false };
        } else {
          throw profileError;
        }
      } else {
        profile = profileData;
      }

      // 5. Redirecionar baseado no status
      console.log("🎯 Status do onboarding:", profile?.onboarding_complete);
      
      if (profile && !profile.onboarding_complete) {
        console.log("➡️ Redirecionando para onboarding (incompleto)");
        router.push("/onboarding");
      } else {
        console.log("➡️ Onboarding completo, redirecionando para verificação transparente");
        router.push("/dashboard");
      }

    } catch (error) {
      console.error("❌ Erro no login:", error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Entrar</h1>

      {erro && <p className="text-red-600 mb-3 text-center">{erro}</p>}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 space-y-3 text-center">
        {/* ✅ LINK PARA RECUPERAÇÃO DE SENHA */}
        <p className="text-sm">
          <Link href="/auth/forgot-password" className="text-blue-600 underline hover:text-blue-800">
            Esqueci minha senha
          </Link>
        </p>

        <p className="text-sm">
          Não tem conta?{" "}
          <Link href="/auth/register" className="text-blue-600 underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}