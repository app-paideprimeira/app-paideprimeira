"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Verificar se há uma sessão válida de recuperação de senha
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsValidSession(true);
      } else {
        setErro("Link inválido ou expirado. Solicite um novo link de recuperação.");
      }
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setMessage("");

    // Validações
    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Atualizando senha...");

      // 🔐 Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        console.error("❌ Erro ao atualizar senha:", error);
        setErro(error.message);
        setLoading(false);
        return;
      }

      console.log("✅ Senha atualizada com sucesso!");
      setMessage("✅ Senha atualizada com sucesso! Redirecionando para login...");

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

    } catch (error) {
      console.error("❌ Erro inesperado:", error);
      setErro("Erro ao atualizar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isValidSession && !erro) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Nova Senha</h1>

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

      {isValidSession && (
        <>
          <p className="text-gray-600 mb-6 text-center">
            Digite sua nova senha abaixo.
          </p>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="Nova senha (mínimo 6 caracteres)"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={6}
            />

            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm">
          <a href="/auth/forgot-password" className="text-blue-600 underline hover:text-blue-800">
            Solicitar novo link
          </a>{" "}
          ou{" "}
          <a href="/auth/login" className="text-blue-600 underline hover:text-blue-800">
            Voltar para login
          </a>
        </p>
      </div>
    </div>
  );
}