"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";

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
      setError("Link inválido ou expirado.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
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
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Criar nova senha</h1>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {success ? (
        <div className="text-green-600 text-sm">
          Senha atualizada com sucesso! Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Atualizar senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
