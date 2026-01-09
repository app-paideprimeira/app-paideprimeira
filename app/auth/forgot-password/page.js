"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      console.log("📧 Enviando email de recuperação...");

      // 🔐 Solicitar reset de senha via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        console.error("❌ Erro ao enviar email:", error);
        setErro(error.message);
        setLoading(false);
        return;
      }

      console.log("✅ Email de recuperação enviado com sucesso!");
      setMessage("📧 Email de recuperação enviado! Verifique sua caixa de entrada.");
      
      // Limpar o campo de email
      setEmail("");

    } catch (error) {
      console.error("❌ Erro inesperado:", error);
      setErro("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Recuperar Senha</h1>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {erro}
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <p className="text-gray-600 mb-6 text-center">
        Digite seu email abaixo e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar Link de Recuperação"}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-sm">
          Lembrou sua senha?{" "}
          <Link href="/auth/login" className="text-blue-600 underline hover:text-blue-800">
            Fazer login
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