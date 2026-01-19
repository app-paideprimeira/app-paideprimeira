"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // 🚨 E-MAIL JÁ CADASTRADO (Supabase não retorna erro)
      if (data.user && data.user.identities.length === 0) {
        setErro(
          "Esse e-mail já está cadastrado. Faça login ou recupere sua senha 🙂"
        );
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          nome,
          onboarding_complete: false,
        });

        setSucesso(true);
        setNome("");
        setEmail("");
        setSenha("");
      }
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setErro("Não foi possível criar sua conta agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Seja bem-vindo ao Pai de Primeira 💙
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Não é sobre ser perfeito. É sobre estar presente.
        </p>

        {erro && (
          <p className="text-red-600 text-sm text-center mb-4">{erro}</p>
        )}

        {sucesso ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-3">
            <h2 className="text-lg font-semibold text-green-800">
              Cadastro realizado 🎉
            </h2>
            <p className="text-sm text-green-700">
              Enviamos um e-mail de confirmação para:
            </p>
            <p className="font-medium text-green-800">{email}</p>
            <p className="text-xs text-green-700">
              Confirme seu e-mail para acessar o app.
            </p>

            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full mt-4"
            >
              Fazer login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Crie uma senha segura"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <p className="text-xs text-gray-500">
              Use pelo menos 6 caracteres
            </p>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Criando sua conta..." : "Criar minha conta"}
            </Button>
          </form>
        )}

        {!sucesso && (
          <p className="text-sm text-gray-600 text-center mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
