import React, { useState, useEffect } from 'react';
import { Lock, User, Edit2, Save, X, Camera } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';

const NetflixLogin = ({ onLogin }) => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editError, setEditError] = useState('');

  // Perfis de usuários com imagens reais
  const defaultProfiles = [
    {
      id: 1,
      name: 'Antonio Rabelo',
      username: 'Antonio Rabelo',
      avatar: '/images/admins/rabelo.png',
      defaultAvatar: '👤',
      color: 'bg-blue-600',
      isOwner: true,
      password: 'rabloce'  // Senha correta
    },
    {
      id: 2,
      name: 'Antonio Darvin',
      username: 'Antonio Darvin',
      avatar: '/images/admins/darvin.jpg',
      defaultAvatar: '👤',
      color: 'bg-green-600',
      isOwner: true,
      password: 'darvince'  // Senha correta
    },
    {
      id: 3,
      name: 'Maria Lucia',
      username: 'Maria Lucia',
      avatar: null,
      defaultAvatar: '👩',
      color: 'bg-purple-600',
      isOwner: true,
      password: 'luciace'  // Senha correta
    }
  ];

  useEffect(() => {
    // Carrega perfis salvos do localStorage ou usa padrão
    const savedProfiles = localStorage.getItem('profiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    } else {
      setProfiles(defaultProfiles);
    }
  }, []);

  const handleProfileClick = (profile) => {
    if (isEditingProfile) return;
    setSelectedProfile(profile);
    setPassword('');
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Por favor, digite a senha');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Fazer login via API
      const response = await apiService.login({
        username: selectedProfile.username,
        password: password
      });

      if (response.data.token) {
        // Salvar token e informações do usuário
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          username: selectedProfile.username,
          name: selectedProfile.name,
          isAdmin: selectedProfile.isOwner
        }));
        
        // Chamar callback de login bem-sucedido
        onLogin(response.data);
      }
    } catch (err) {
      // Verificar senha localmente (fallback)
      const currentProfile = profiles.find(p => p.id === selectedProfile.id);
      if (password === currentProfile.password) {
        localStorage.setItem('user', JSON.stringify({
          username: selectedProfile.username,
          name: selectedProfile.name,
          isAdmin: selectedProfile.isOwner
        }));
        onLogin({ 
          user: selectedProfile.name,
          username: selectedProfile.username,
          isAdmin: selectedProfile.isOwner 
        });
      } else {
        setError('Senha incorreta');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToProfiles = () => {
    setSelectedProfile(null);
    setPassword('');
    setError('');
  };

  const startEditProfile = (profile) => {
    setIsEditingProfile(true);
    setEditingProfileId(profile.id);
    setEditedName(profile.name);
    setEditedPassword('');
    setConfirmPassword('');
    setEditError('');
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setEditingProfileId(null);
    setEditedName('');
    setEditedPassword('');
    setConfirmPassword('');
    setEditError('');
  };

  const saveProfile = () => {
    // Validações
    if (!editedName.trim()) {
      setEditError('O nome é obrigatório');
      return;
    }

    if (editedPassword && editedPassword !== confirmPassword) {
      setEditError('As senhas não coincidem');
      return;
    }

    if (editedPassword && editedPassword.length < 6) {
      setEditError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Atualizar perfil
    const updatedProfiles = profiles.map(profile => {
      if (profile.id === editingProfileId) {
        return {
          ...profile,
          name: editedName,
          password: editedPassword || profile.password
        };
      }
      return profile;
    });

    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));

    // Limpar e fechar edição
    cancelEdit();
  };

  const ProfileAvatar = ({ profile, size = 'large' }) => {
    const sizeClasses = {
      small: 'w-24 h-24 text-4xl',
      large: 'w-40 h-40 text-6xl'
    };

    if (profile.avatar) {
      return (
        <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-xl group-hover:shadow-2xl transition-all`}>
          <img 
            src={profile.avatar} 
            alt={profile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            className={`w-full h-full ${profile.color} flex items-center justify-center text-white`}
            style={{ display: 'none' }}
          >
            {profile.defaultAvatar}
          </div>
        </div>
      );
    }

    return (
      <div className={`${sizeClasses[size]} ${profile.color} rounded-lg flex items-center justify-center text-white shadow-xl group-hover:shadow-2xl transition-all`}>
        {profile.defaultAvatar}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo e Título */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.jpg" 
              alt="Joalheria Antonio Rabelo" 
              className="h-20 w-auto"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">
            Joalheria Antonio Rabelo
          </h1>
          <p className="text-gray-400 text-lg">Sistema de Gestão Empresarial</p>
        </div>

        {/* Seleção de Perfil */}
        {!selectedProfile ? (
          <div className="text-center">
            <h2 className="text-2xl text-white mb-8">Quem está acessando?</h2>
            
            <div className="flex flex-wrap justify-center gap-6">
              {profiles.map((profile) => (
                <div key={profile.id} className="relative">
                  {/* Modo de edição */}
                  {isEditingProfile && editingProfileId === profile.id ? (
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 w-64">
                      <div className="mb-4">
                        <ProfileAvatar profile={profile} size="small" />
                      </div>
                      
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Nome do perfil"
                        className="w-full mb-2 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <input
                        type="password"
                        value={editedPassword}
                        onChange={(e) => setEditedPassword(e.target.value)}
                        placeholder="Nova senha (opcional)"
                        className="w-full mb-2 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar nova senha"
                        className="w-full mb-3 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {editError && (
                        <p className="text-red-400 text-sm mb-2">{editError}</p>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={saveProfile}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center justify-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Modo normal */
                    <button
                      onClick={() => handleProfileClick(profile)}
                      className={`group cursor-pointer transition-all duration-200 hover:scale-105 ${isEditingProfile ? 'opacity-50' : ''}`}
                      disabled={isEditingProfile}
                    >
                      <div className="relative">
                        {/* Avatar */}
                        <ProfileAvatar profile={profile} />
                        
                        {/* Ícone de bloqueio */}
                        <div className="absolute -bottom-3 -right-3 bg-gray-700 rounded-full p-2 shadow-lg">
                          <Lock className="w-5 h-5 text-gray-300" />
                        </div>
                        
                        {/* Badge de Dono */}
                        {profile.isOwner && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                            DONO
                          </div>
                        )}
                      </div>
                      
                      {/* Nome do perfil */}
                      <p className="mt-4 text-gray-300 text-lg group-hover:text-white transition-colors">
                        {profile.name}
                      </p>
                    </button>
                  )}
                  
                  {/* Botão de editar (sempre visível quando não está editando) */}
                  {!isEditingProfile && (
                    <button
                      onClick={() => startEditProfile(profile)}
                      className="absolute -top-2 -left-2 bg-gray-700 hover:bg-gray-600 rounded-full p-2 shadow-lg transition-colors"
                      title="Editar perfil"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar novo perfil (desabilitado) */}
            <button
              disabled
              className="mt-12 inline-flex items-center gap-2 text-gray-500 cursor-not-allowed"
            >
              <div className="w-12 h-12 border-2 border-gray-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">+</span>
              </div>
              <span>Adicionar Perfil</span>
            </button>
          </div>
        ) : (
          /* Tela de Senha */
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBackToProfiles}
              className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              ← Voltar aos perfis
            </button>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
              {/* Avatar e nome */}
              <div className="flex flex-col items-center mb-6">
                <ProfileAvatar profile={selectedProfile} size="small" />
                <h2 className="text-2xl font-semibold text-white mt-4">
                  {selectedProfile.name}
                </h2>
                {selectedProfile.isOwner && (
                  <span className="mt-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full">
                    ADMINISTRADOR
                  </span>
                )}
              </div>

              {/* Formulário de senha */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    autoFocus
                  />
                </div>

                {/* Mensagem de erro */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Botão de login */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Entrar
                    </>
                  )}
                </button>

                {/* Dica de senha */}
                <p className="text-center text-gray-500 text-sm mt-4">
                  Senha para {selectedProfile.username}: <span className="text-gray-400 font-mono">{selectedProfile.username === 'rabelo' ? 'rabeloce' : selectedProfile.username === 'darvin' ? 'darvince' : 'luciace'}</span>
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2025 Joalheria Antonio Rabelo - Sistema de Gestão</p>
          <p className="mt-1">Desenvolvido para uso exclusivo interno</p>
        </div>
      </div>
    </div>
  );
};

export default NetflixLogin;