"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Image from "next/image";

export default function UpdatePasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");

    if (!accessToken) {
      setError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError("Erro ao atualizar a senha. Tente novamente.");
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        
        <h1 className="text-3xl font-bold text-center text-[#111827] mb-2">
          Criar nova senha 🔒
        </h1>

        <p className="text-center text-[#6B7280] mb-8">
          Escolha uma nova senha segura para continuar sua jornada.
        </p>

        {error && (
          <p className="text-red-600 text-sm text-center mb-4">
            {error}
          </p>
        )}

        {success ? (
          <p className="text-green-600 text-sm text-center">
            Senha atualizada com sucesso!  
            <br />
            Redirecionando para o login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Atualizar senha"}
            </Button>
          </form>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          Sua segurança é prioridade. 💙
        </p>
      </div>
    </div>
  );
}
