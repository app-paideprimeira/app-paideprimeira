'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase/client';

const supabase = supabaseBrowser();

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    data_nascimento: '',
    nome_esposa: '',
    data_nascimento_esposa: '',
    tem_outros_filhos: false,
    foto_url: null,
  });
  const [filhos, setFilhos] = useState([]);
  const [novoFilho, setNovoFilho] = useState({ nome: '', data_nascimento: '' });
  const [imageKey, setImageKey] = useState(0);

  // ==================== UPLOAD DE FOTO ====================

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Fazer upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Atualizar estado local
      const timestamp = Date.now();
      setUserData(prev => ({
        ...prev,
        foto_url: `${publicUrl}?t=${timestamp}`
      }));
      
      setImageKey(prev => prev + 1);

      alert('Foto atualizada com sucesso!');

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao fazer upload da foto: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!userData.foto_url) return;

    try {
      setUploading(true);
      
      const baseUrl = userData.foto_url.split('?')[0];
      const urlParts = baseUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `profile-photos/${fileName}`;

      // Deletar do storage
      await supabase.storage
        .from('avatars')
        .remove([filePath]);

      // Remover URL do perfil
      await supabase
        .from('profiles')
        .update({ foto_url: null })
        .eq('id', user.id);

      // Atualizar estado
      setUserData(prev => ({ ...prev, foto_url: null }));
      setImageKey(prev => prev + 1);
      
      alert('Foto removida com sucesso!');
      
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // ==================== FUNCIONALIDADE DE FILHOS ====================

  const adicionarFilho = async () => {
    if (!novoFilho.nome.trim() || !user) {
      alert('Por favor, digite o nome do filho');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('filhos')
        .insert({
          user_id: user.id,
          nome: novoFilho.nome,
          data_nascimento: novoFilho.data_nascimento,
        })
        .select()
        .single();

      if (error) {
        console.log('Tabela filhos não configurada:', error);
        alert('Funcionalidade de filhos ainda não configurada');
        return;
      }

      setFilhos([...filhos, data]);
      setNovoFilho({ nome: '', data_nascimento: '' });
      alert('Filho adicionado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao adicionar filho:', error);
      alert('Erro ao adicionar filho: ' + error.message);
    }
  };

  const removerFilho = async (id) => {
    try {
      const { error } = await supabase
        .from('filhos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFilhos(filhos.filter(filho => filho.id !== id));
      alert('Filho removido com sucesso!');
      
    } catch (error) {
      console.error('Erro ao remover filho:', error);
      alert('Erro ao remover filho: ' + error.message);
    }
  };

  // ==================== CARREGAR DADOS ====================

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Carregar perfil
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          const fotoUrl = profile.foto_url 
            ? `${profile.foto_url}?load=${Date.now()}`
            : null;

          setUserData({
            nome: profile.nome || '',
            data_nascimento: profile.data_nascimento || '',
            nome_esposa: profile.nome_esposa || '',
            data_nascimento_esposa: profile.data_nascimento_esposa || '',
            tem_outros_filhos: profile.tem_outros_filhos || false,
            foto_url: fotoUrl,
          });
        }

        // Carregar filhos
        try {
          const { data: filhosData, error: filhosError } = await supabase
            .from('filhos')
            .select('*')
            .eq('user_id', user.id);

          if (!filhosError && filhosData) {
            setFilhos(filhosData);
          }
        } catch (e) {
          console.log('Tabela filhos não existe ainda');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);

      const profileData = {
        id: user.id,
        nome: userData.nome,
        data_nascimento: userData.data_nascimento,
        nome_esposa: userData.nome_esposa,
        data_nascimento_esposa: userData.data_nascimento_esposa,
        tem_outros_filhos: userData.tem_outros_filhos,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        throw profileError;
      }

      alert('Perfil atualizado com sucesso!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <span className="text-xl">←</span>
            <span className="ml-2">Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Editar Perfil</h1>
          <div className="w-20"></div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Upload de Foto */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Foto de Perfil</h2>
            <div className="flex items-center space-x-6">
              
              {/* Preview da Imagem */}
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {userData.foto_url ? (
                    <img 
                      key={imageKey}
                      src={userData.foto_url}
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const baseUrl = userData.foto_url.split('?')[0];
                        e.target.src = `${baseUrl}?retry=${Date.now()}`;
                      }}
                    />
                  ) : (
                    <span className="text-gray-500 text-2xl">👤</span>
                  )}
                </div>
                
                <input
                  type="file"
                  id="foto-perfil"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label 
                  htmlFor="foto-perfil"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-center disabled:bg-blue-300"
                >
                  {uploading ? 'Enviando...' : 'Alterar Foto'}
                </label>
                <p className="text-sm text-gray-500">PNG, JPG até 5MB</p>
                
                {userData.foto_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-red-500 text-sm hover:text-red-700"
                    disabled={uploading}
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Seus Dados</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userData.nome}
                  onChange={(e) => setUserData({...userData, nome: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua Data de Nascimento
                </label>
                <input
                  type="date"
                  value={userData.data_nascimento}
                  onChange={(e) => setUserData({...userData, data_nascimento: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Dados da Companheira */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Dados da Companheira</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Companheira
                </label>
                <input
                  type="text"
                  value={userData.nome_esposa}
                  onChange={(e) => setUserData({...userData, nome_esposa: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome da esposa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento da Esposa
                </label>
                <input
                  type="date"
                  value={userData.data_nascimento_esposa}
                  onChange={(e) => setUserData({...userData, data_nascimento_esposa: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Outros Filhos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Outros Filhos</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tem outros filhos?</span>
                <input
                  type="checkbox"
                  checked={userData.tem_outros_filhos}
                  onChange={(e) => setUserData({...userData, tem_outros_filhos: e.target.checked})}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                />
              </div>
            </div>

            {userData.tem_outros_filhos && (
              <div className="space-y-4">
                {/* Formulário para novo filho */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Adicionar Filho</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={novoFilho.nome}
                      onChange={(e) => setNovoFilho({...novoFilho, nome: e.target.value})}
                      placeholder="Nome do filho"
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={novoFilho.data_nascimento}
                      onChange={(e) => setNovoFilho({...novoFilho, data_nascimento: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={adicionarFilho}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    + Adicionar Filho
                  </button>
                </div>

                {/* Lista de filhos */}
                {filhos.map((filho) => (
                  <div key={filho.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <p className="font-medium">{filho.nome}</p>
                      <p className="text-sm text-gray-600">
                        Nascimento: {filho.data_nascimento ? new Date(filho.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerFilho(filho.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 disabled:bg-blue-300 transition-colors font-semibold text-lg"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;