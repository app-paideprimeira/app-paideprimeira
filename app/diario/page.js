'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase/client';

const supabase = supabaseBrowser();

const Diario = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para nova entrada
  const [novaEntrada, setNovaEntrada] = useState({
    titulo: '',
    conteudo: '',
    data: new Date().toISOString().split('T')[0] // Data atual
  });

  // Carregar entradas do diário
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Verificar usuário
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Carregar entradas do diário
        const { data, error } = await supabase
          .from('diario')
          .select('*')
          .eq('user_id', user.id)
          .order('data', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEntradas(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar diário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar nova entrada
  const salvarEntrada = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    if (!novaEntrada.titulo.trim() || !novaEntrada.conteudo.trim()) {
      alert('Por favor, preencha título e conteúdo');
      return;
    }

    try {
      setLoading(true);

      if (editandoId) {
        // Editar entrada existente
        const { error } = await supabase
          .from('diario')
          .update({
            titulo: novaEntrada.titulo,
            conteudo: novaEntrada.conteudo,
            data: novaEntrada.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editandoId)
          .eq('user_id', user.id);

        if (error) throw error;
        alert('Entrada atualizada com sucesso!');
      } else {
        // Criar nova entrada
        const { error } = await supabase
          .from('diario')
          .insert({
            user_id: user.id,
            titulo: novaEntrada.titulo,
            conteudo: novaEntrada.conteudo,
            data: novaEntrada.data
          });

        if (error) throw error;
        alert('Entrada salva com sucesso!');
      }

      // Recarregar dados e resetar formulário
      await carregarDados();
      setMostrarFormulario(false);
      setEditandoId(null);
      setNovaEntrada({
        titulo: '',
        conteudo: '',
        data: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Editar entrada
  const editarEntrada = (entrada) => {
    setNovaEntrada({
      titulo: entrada.titulo,
      conteudo: entrada.conteudo,
      data: entrada.data
    });
    setEditandoId(entrada.id);
    setMostrarFormulario(true);
  };

  // Excluir entrada
  const excluirEntrada = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('diario')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Entrada excluída com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // Cancelar edição/criação
  const cancelar = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNovaEntrada({
      titulo: '',
      conteudo: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  // Formatar data para exibição
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seu diário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <span className="text-xl">←</span>
            <span className="ml-2">Voltar</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Meu Diário</h1>
          <div className="w-20"></div>
        </div>

        {/* Botão Nova Entrada */}
        {!mostrarFormulario && (
          <div className="mb-6">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center"
            >
              <span className="text-xl mr-2">+</span>
              Nova Entrada
            </button>
          </div>
        )}

        {/* Formulário de Nova Entrada */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editandoId ? 'Editar Entrada' : 'Nova Entrada no Diário'}
            </h2>
            
            <form onSubmit={salvarEntrada} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={novaEntrada.data}
                  onChange={(e) => setNovaEntrada({...novaEntrada, data: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={novaEntrada.titulo}
                  onChange={(e) => setNovaEntrada({...novaEntrada, titulo: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dê um título para esta entrada..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={novaEntrada.conteudo}
                  onChange={(e) => setNovaEntrada({...novaEntrada, conteudo: e.target.value})}
                  rows={8}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Escreva seus pensamentos, alegrias, frustrações, reflexões..."
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors font-semibold"
                >
                  {loading ? 'Salvando...' : (editandoId ? 'Atualizar' : 'Salvar Entrada')}
                </button>
                
                <button
                  type="button"
                  onClick={cancelar}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Entradas */}
        <div className="space-y-6">
          {entradas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">📔</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Seu diário está vazio
              </h3>
              <p className="text-gray-500 mb-4">
                Comece escrevendo sua primeira entrada para registrar seus pensamentos e sentimentos.
              </p>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Escrever Primeira Entrada
              </button>
            </div>
          ) : (
            entradas.map((entrada) => (
              <div key={entrada.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {entrada.titulo}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatarData(entrada.data)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editarEntrada(entrada)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => excluirEntrada(entrada.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {entrada.conteudo}
                  </p>
                </div>
                
                {entrada.updated_at && (
                  <p className="text-xs text-gray-400 mt-4">
                    Última edição: {new Date(entrada.updated_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Diario;