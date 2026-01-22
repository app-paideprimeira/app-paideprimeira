'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase/client';
import Image from 'next/image';

const supabase = supabaseBrowser();

export default function Diario() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [entradaSelecionada, setEntradaSelecionada] = useState(null);

  const [novaEntrada, setNovaEntrada] = useState({
    titulo: '',
    conteudo: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      const { data, error } = await supabase
        .from('diario')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntradas(data || []);
    } catch (error) {
      console.error('Erro ao carregar diário:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarEntrada = async (e) => {
    e.preventDefault();

    if (!novaEntrada.titulo.trim() || !novaEntrada.conteudo.trim()) {
      alert('Preencha título e conteúdo');
      return;
    }

    try {
      setLoading(true);

      const hoje = new Date().toISOString().split('T')[0];

      if (editandoId) {
        const { error } = await supabase
          .from('diario')
          .update({
            titulo: novaEntrada.titulo,
            conteudo: novaEntrada.conteudo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editandoId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('diario').insert({
          user_id: user.id,
          titulo: novaEntrada.titulo,
          conteudo: novaEntrada.conteudo,
          data: hoje, // ✅ data automática
        });

        if (error) throw error;
      }

      await carregarDados();
      cancelar();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar entrada');
    } finally {
      setLoading(false);
    }
  };

  const editarEntrada = (entrada) => {
    setNovaEntrada({
      titulo: entrada.titulo,
      conteudo: entrada.conteudo,
    });
    setEditandoId(entrada.id);
    setMostrarFormulario(true);
  };

  const excluirEntrada = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      const { error } = await supabase
        .from('diario')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const cancelar = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNovaEntrada({
      titulo: '',
      conteudo: '',
    });
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-10">
        
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
      <div className="max-w-4xl mx-auto">

            {/* HEADER */}
      <div className="mb-4">
        {/* TÍTULO */}
        <h1 className="text-center text-3xl font-bold text-[#F9FAFB] mb-8">
          Meu Diário
        </h1>

  {/* BOTÕES */}
  <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
    <button
      onClick={() => router.back()}
      className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-400"
    >
      Voltar
    </button>

    {!mostrarFormulario && (
      <button
        onClick={() => setMostrarFormulario(true)}
        className="bg-green-500 text-white px-6 py-1 rounded-xl font-semibold hover:bg-blue-400"
      >
        + Nova Reflexão
      </button>
    )}
  </div>
</div>

        {mostrarFormulario && (
          <div className="bg-[#1E3A8A] rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-[#F9FAFB] font-semibold mb-4 ">
              {editandoId ? 'Editar Entrada' : 'Nova Entrada'}
            </h2>

            <form onSubmit={salvarEntrada} className="space-y-4">
              <input
                type="text"
                placeholder="Título"
                value={novaEntrada.titulo}
                onChange={(e) =>
                  setNovaEntrada({ ...novaEntrada, titulo: e.target.value })
                }
                className="w-full p-3 border rounded-lg"
              />

              <textarea
                rows={7}
                placeholder="Escreva livremente..."
                value={novaEntrada.conteudo}
                onChange={(e) =>
                  setNovaEntrada({ ...novaEntrada, conteudo: e.target.value })
                }
                className="w-full p-3 border rounded-lg resize-none"
              />

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={cancelar}
                  className="bg-gray-200 px-6 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {entradas.map((entrada) => (
            <div
              key={entrada.id}
              onClick={() => setEntradaSelecionada(entrada)}
              className="bg-white p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold text-gray-800">
                {entrada.titulo}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                {formatarData(entrada.data)}
              </p>

              <p className="text-gray-600 text-sm line-clamp-3">
                {entrada.conteudo}
              </p>

              <p className="text-blue-600 text-sm mt-2 font-medium">
                Ler mais →
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editarEntrada(entrada);
                  }}
                  className="text-blue-600"
                >
                  ✏️
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    excluirEntrada(entrada.id);
                  }}
                  className="text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de leitura */}
      {entradaSelecionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {entradaSelecionada.titulo}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatarData(entradaSelecionada.data)}
                </p>
              </div>

              <button
                onClick={() => setEntradaSelecionada(null)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {entradaSelecionada.conteudo}
            </p>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setEntradaSelecionada(null);
                  editarEntrada(entradaSelecionada);
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                Editar
              </button>

              <button
                onClick={() => setEntradaSelecionada(null)}
                className="bg-gray-200 px-5 py-2 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
