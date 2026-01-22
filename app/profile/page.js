'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../lib/supabase/client'
import Image from 'next/image'

const supabase = supabaseBrowser()

const Profile = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [openSection, setOpenSection] = useState(null)

  const [profileMeta, setProfileMeta] = useState({
    stage: 'gestante',
    event_date: '',
    base_week: null,
    base_week_date: null,
  })

  const [userData, setUserData] = useState({
    nome: '',
    data_nascimento: '',
    nome_esposa: '',
    data_nascimento_esposa: '',
    tem_outros_filhos: false,
    foto_url: null,
  })

  const [filhos, setFilhos] = useState([])
  const [novoFilho, setNovoFilho] = useState({ nome: '', data_nascimento: '' })
  const [imageKey, setImageKey] = useState(0)

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section)
  }

  // ==================== UPLOAD DE FOTO ====================

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file || !user) return

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await supabase
        .from('profiles')
        .update({ foto_url: data.publicUrl })
        .eq('id', user.id)

      setUserData(prev => ({
        ...prev,
        foto_url: `${data.publicUrl}?t=${Date.now()}`
      }))

      setImageKey(prev => prev + 1)

    } catch {
      alert('Erro ao enviar foto')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    if (!userData.foto_url || !user) return

    try {
      setUploading(true)
      await supabase.from('profiles').update({ foto_url: null }).eq('id', user.id)
      setUserData(prev => ({ ...prev, foto_url: null }))
      setImageKey(prev => prev + 1)
    } finally {
      setUploading(false)
    }
  }

  // ==================== LOAD ====================

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserData({
        nome: profile.nome || '',
        data_nascimento: profile.data_nascimento || '',
        nome_esposa: profile.nome_esposa || '',
        data_nascimento_esposa: profile.data_nascimento_esposa || '',
        tem_outros_filhos: profile.tem_outros_filhos || false,
        foto_url: profile.foto_url || null,
      })

      setProfileMeta({
        stage: profile.stage,
        event_date: profile.event_date || '',
        base_week: profile.base_week,
        base_week_date: profile.base_week_date,
      })
    }

    const { data: filhosData } = await supabase
      .from('filhos')
      .select('*')
      .eq('user_id', user.id)

    if (filhosData) setFilhos(filhosData)
    setLoading(false)
  }

  // ==================== SAVE ====================

const handleSave = async (e) => {
  e.preventDefault()

  console.log('🟢 handleSave disparou')
  console.log('profileMeta:', profileMeta)
  console.log('user:', user)

  if (!user?.id) {
    alert('Usuário não encontrado')
    return
  }

  let baseWeek = profileMeta.base_week
  let baseWeekDate = profileMeta.base_week_date

  if (profileMeta.event_date) {
    const hoje = new Date()
    const evento = new Date(profileMeta.event_date)

    if (profileMeta.stage === 'bebe') {
      baseWeek = Math.min(52, Math.floor((hoje - evento) / 604800000) + 1)
    } else {
      const dum = new Date(evento)
      dum.setDate(dum.getDate() - 280)
      baseWeek = Math.min(42, Math.floor((hoje - dum) / 604800000) + 1)
    }

    baseWeekDate = hoje.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      stage: profileMeta.stage,
      event_date: profileMeta.event_date,
      base_week: baseWeek,
      base_week_date: baseWeekDate,
      current_week: baseWeek,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()

  console.log('🧠 UPDATE RESULT:', data, error)

  if (error) {
    alert(error.message)
    return
  }

  if (!data || data.length === 0) {
    alert('Nada foi atualizado (RLS ou ID incorreto)')
    return
  }

  alert('Perfil atualizado com sucesso!')
  router.push('/dashboard')
}


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando…</div>
  }

  // ==================== RENDER ====================

  const Section = ({ id, title, children }) => (
    <div className="bg-white rounded-xl shadow-sm">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex justify-between items-center p-6 font-semibold text-lg"
      >
        {title}
        <span>{openSection === id ? '−' : '+'}</span>
      </button>

      {openSection === id && (
        <div className="px-6 pb-6">{children}</div>
      )}
    </div>
  )


  // ==================== FILHOS ====================

const adicionarFilho = async () => {
  if (!novoFilho.nome || !novoFilho.data_nascimento || !user) {
    alert('Preencha nome e data de nascimento do filho')
    return
  }

  const { data, error } = await supabase
    .from('filhos')
    .insert({
      user_id: user.id,
      nome: novoFilho.nome,
      data_nascimento: novoFilho.data_nascimento,
    })
    .select()
    .single()

  if (error) {
    alert('Erro ao adicionar filho')
    return
  }

  setFilhos(prev => [...prev, data])
  setNovoFilho({ nome: '', data_nascimento: '' })
}

const removerFilho = async (id) => {
  const { error } = await supabase
    .from('filhos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao remover filho')
    return
  }

  setFilhos(prev => prev.filter(filho => filho.id !== id))
}

  return (
    <div className="min-h-screen bg-[#1E3A8A] py-8">
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
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-400"
          >
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Editar Perfil</h1>
          <div />
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          <Section id="bebê" title="Atualize as Informações">
            <input
              type="date"
              value={profileMeta.event_date}
              onChange={(e) => setProfileMeta({ ...profileMeta, event_date: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
          </Section>

          <Section id="foto" title="Foto de Perfil">
            {/* Upload de Foto */}
          <div className="bg-white rounded-xl shadow-sm p-6">
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
          </Section>

          <Section id="dados" title="Seus Dados">
            {/* Dados Pessoais */}
          <div className="bg-white rounded-xl shadow-sm p-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-">
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
          </Section>

          <Section id="companheira" title="Dados da Gestante">
          {/* Dados da Gestante */}
          <div className="bg-white rounded-xl shadow-sm p-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Gestante
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
          </Section>

          <Section id="filhos" title="Outros Filhos">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={userData.tem_outros_filhos}
                onChange={(e) => {
                  setUserData({ ...userData, tem_outros_filhos: e.target.checked })
                  setOpenSection('filhos')
                }}
              />
              <span>Tem outros filhos?</span>
            </div>

            {userData.tem_outros_filhos && (
              <div className="space-y-4">
          {/* Outros Filhos */}
          <div className="bg-white rounded-xl shadow-sm p-2">

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
              </div>
            )}
          </Section>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold text-lg"
          >
            Salvar Alterações
          </button>

        </form>
      </div>
    </div>
  )
}

export default Profile
