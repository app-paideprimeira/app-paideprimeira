"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não encontrado.");

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
    <div
  className="
    min-h-screen
    bg-[#1E3A8A]
    flex flex-col
    items-center
    justify-start
    px-4
    pt-16
    pb-6
    [padding-bottom:calc(env(safe-area-inset-bottom)+1.5rem)]
  "
>

      {/* LOGO NO FUNDO AZUL */}
      <div className="mb-8">
        <Image
          src="/logo/logo-app.svg"
          alt="Pai de Primeira"
          width={400}
          height={200}
          className="w-72 mx-auto drop-shadow-md"
          priority
        />
      </div>

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 border border-[#E5E7EB]">
        
        {/* TÍTULO */}
        <h1 className="text-3xl font-bold text-center text-[#111827] mb-2">
          Bem-vindo de volta
        </h1>

        <p className="text-center text-[#6B7280] mb-8">
          É bom te ver por aqui. Vamos continuar essa jornada juntos.
        </p>

        {/* ERRO */}
        {erro && (
          <p className="text-sm text-center mb-4 text-red-600">
            {erro}
          </p>
        )}

        {/* FORM */}
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A8A] hover:bg-[#172554]"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {/* LINKS */}
        <div className="mt-6 text-center space-y-3">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-[#1E3A8A] hover:underline"
          >
            Esqueci minha senha
          </Link>

          <p className="text-sm text-[#6B7280]">
            Ainda não faz parte?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-[#10B981] hover:underline"
            >
              Criar minha conta
            </Link>
          </p>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-center mt-8 text-[#6B7280]">
          Seus dados ficam seguros. Sem exposição. Sem julgamento.
        </p>
      </div>
    </div>
  );
}
