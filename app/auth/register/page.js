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
  const [registroSucesso, setRegistroSucesso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setRegistroSucesso(false);

    try {
      console.log("📝 Iniciando cadastro...");

      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log("✅ Resposta do signUp:", data);
      console.log("❌ Erro do signUp:", error);

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      // 2. Se usuário foi criado, criar perfil com nome e onboarding_complete = false
      if (data.user) {
        console.log("👤 Usuário criado, criando perfil...");
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            nome: nome.trim(),
            onboarding_complete: false
          });

        console.log("❌ Erro ao criar perfil:", profileError);
        
        if (!profileError) {
          console.log("✅ Perfil criado com sucesso!");
        }

        // 3. Mostrar mensagem de sucesso com aviso de confirmação
        setRegistroSucesso(true);
        setEmailEnviado(email);
        
        // Limpar formulário
        setNome("");
        setEmail("");
        setSenha("");
      }

    } catch (error) {
      console.error("Erro no cadastro:", error);
      setErro("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Criar Conta
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Junte-se à nossa comunidade de pais
          </p>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm text-center">{erro}</p>
            </div>
          )}

          {/* Mensagem de Sucesso com Aviso de Confirmação */}
          {registroSucesso && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-green-800 font-semibold text-lg mb-2">
                    🎉 Cadastro realizado com sucesso!
                  </h3>
                  <div className="text-green-700 text-sm space-y-2">
                    <p>
                      <strong>📧 E-mail de confirmação enviado para:</strong><br />
                      {emailEnviado}
                    </p>
                    <p>
                      <strong>⚠️ Importante:</strong> Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
                    </p>
                    <div className="bg-green-100 border border-green-200 rounded p-3 mt-2">
                      <p className="text-green-800 text-xs font-medium">
                        💡 <strong>Dica:</strong> Se não encontrar o e-mail, verifique sua pasta de spam ou lixo eletrônico.
                      </p>
                    </div>
                    <p className="text-green-800 font-medium mt-3">
                      ⏳ Após confirmar o e-mail, você poderá fazer login e acessar todos os recursos do app!
                    </p>
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => router.push("/auth/login")}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Fazer Login
                    </button>
                    <button
                      onClick={() => setRegistroSucesso(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Fazer outro cadastro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulário de Registro (só mostra se não tiver sucesso) */}
          {!registroSucesso && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Atenção:</strong> Após o cadastro, enviaremos um e-mail de confirmação. 
                      Você precisará clicar no link recebido para ativar sua conta.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando conta...
                  </span>
                ) : (
                  "Criar minha conta"
                )}
              </Button>
            </form>
          )}

          {!registroSucesso && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}