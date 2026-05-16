"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setErro("");

    if (!aceitouTermos) {
      setErro("Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }

    setLoading(true);

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

      // E-MAIL JÁ CADASTRADO (Supabase não retorna erro)
      // Mostramos a mesma mensagem de sucesso para não revelar se o email existe
      if (data.user && data.user.identities.length === 0) {
        setSucesso(true);
        setNome("");
        setEmail("");
        setSenha("");
        setAceitouTermos(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          nome,
          onboarding_complete: false,
          termos_aceitos_em: new Date().toISOString(),
        });

        setSucesso(true);
        setNome("");
        setEmail("");
        setSenha("");
        setAceitouTermos(false);
      }
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setErro("Não foi possível criar sua conta agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-16">

      {/* LOGO */}
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Seja bem-vindo ao Pai de Primeira 💙
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Não é sobre ser perfeito.<br />
          É sobre estar presente.
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
            <Button onClick={() => router.push("/auth/login")} className="w-full mt-4">
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

            <p className="text-xs text-gray-500">Use pelo menos 6 caracteres</p>

            {/* ── CHECKBOX DE ACEITE ── */}
            <div
              onClick={() => setAceitouTermos(v => !v)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                background: aceitouTermos ? "#eff6ff" : "#f8fafc",
                border: `1.5px solid ${aceitouTermos ? "#1E3A8A" : "#e2e8f0"}`,
                transition: "all .15s",
              }}>
              <div style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: 6,
                border: `2px solid ${aceitouTermos ? "#1E3A8A" : "#cbd5e1"}`,
                background: aceitouTermos ? "#1E3A8A" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1, transition: "all .15s",
              }}>
                {aceitouTermos && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, margin: 0 }}>
                Li e concordo com os{" "}
                <Link href="/termos" target="_blank"
                  onClick={e => e.stopPropagation()}
                  style={{ color: "#1E3A8A", fontWeight: 700, textDecoration: "underline" }}>
                  Termos de Uso
                </Link>
                {" "}e a{" "}
                <Link href="/privacidade" target="_blank"
                  onClick={e => e.stopPropagation()}
                  style={{ color: "#1E3A8A", fontWeight: 700, textDecoration: "underline" }}>
                  Política de Privacidade
                </Link>
                {" "}do Pai de Primeira.
              </p>
            </div>

            <Button type="submit" disabled={loading || !aceitouTermos}
              className="w-full"
              style={{ opacity: !aceitouTermos ? 0.6 : 1 }}>
              {loading ? "Criando sua conta..." : "Criar minha conta"}
            </Button>
          </form>
        )}

        {!sucesso && (
          <p className="text-sm text-gray-600 text-center mt-6">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-800">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}