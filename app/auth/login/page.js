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
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (loginError) throw loginError;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não foi possível identificar o usuário.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }

    } catch (error) {
      setErro("E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Bem-vindo de volta 👋
        </h1>
        <p className="text-center text-gray-600 mb-8">
          É bom te ver por aqui. Vamos continuar essa jornada juntos.
        </p>

        {erro && (
          <p className="text-red-600 text-sm text-center mb-4">{erro}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Esqueci minha senha
          </Link>

          <p className="text-sm text-gray-600">
            Ainda não faz parte?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Criar minha conta
            </Link>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Seus dados ficam seguros. Prometido.
        </p>
      </div>
    </div>
  );
}
