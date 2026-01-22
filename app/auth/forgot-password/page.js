"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErro(error.message);
        return;
      }

      setMessage(
        "📧 Enviamos um email com as instruções para redefinir sua senha."
      );
      setEmail("");
    } catch (error) {
      setErro("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-16">
    
          {/* LOGO NO FUNDO AZUL */}
          <div className="mb-16 p-2">
            <Image
              src="/logo/logo-app.svg"
              alt="Pai de Primeira"
              width={400}
              height={200}
              className="w-72 mx-auto drop-shadow-md"
              priority
            />
          </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 border border-[#10B981]">
        
        <h1 className="text-3xl font-bold text-center text-[#111827] mb-2">
          Recuperar senha 🔐
        </h1>

        <p className="text-center text-[#6B7280] mb-8">
          Fica tranquilo. Vamos te ajudar a acessar sua conta novamente.
        </p>

        {erro && (
          <p className="text-red-600 text-sm text-center mb-4">{erro}</p>
        )}

        {message && (
          <p className="text-green-600 text-sm text-center mb-4">{message}</p>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-[#6B7280]">
            Lembrou da senha?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-[#1E3A8A] hover:text-[#172554]"
            >
              Fazer login
            </Link>
          </p>

          <p className="text-sm text-[#6B7280]">
            Ainda não tem conta?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-[#1E3A8A] hover:text-[#172554]"
            >
              Criar minha conta
            </Link>
          </p>
        </div>

        <p className="text-xs text-[#6B7280] text-center mt-8">
          Seus dados estão protegidos. Sempre.
        </p>
      </div>
    </div>
  );
}
