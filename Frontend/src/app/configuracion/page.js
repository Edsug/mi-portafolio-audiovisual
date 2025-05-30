'use client';

import React, { useState, useEffect } from 'react';

export default function ConfiguracionPage() {
  // Estados principales
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('upload-section');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Estados para formularios
  const [loginForm, setLoginForm] = useState({
    usuario: '',
    contrasena: ''
  });
  
  const [albumForm, setAlbumForm] = useState({
    sesion: '',
    descripcion: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', onConfirm: null });

  // Estados para usuarios
  const [newUser, setNewUser] = useState({
    usuario: '',
    contrasena: '',
    role: 'editor'
  });

  const [passwordChange, setPasswordChange] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';

  // Funciones de utilidad
  const showNotification = (msg, type = 'success') => {
    setMessage({ type, text: msg });
    setTimeout(() => setMessage(null), 4000);
  };

  const getAuthHeaders = () => {
    if (!currentUser) return {};
    return {
      'user-role': currentUser.role,
      'user-id': currentUser.id.toString()
    };
  };

  const isAdmin = () => currentUser && currentUser.role === 'admin';
  const canManageUsers = () => isAdmin();

  // Función de login
  const handleLogin = async () => {
    if (!loginForm.usuario || !loginForm.contrasena) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (data.acceso) {
        setCurrentUser(data);
        showNotification(`¡Bienvenido, ${data.usuario}!`);
        setLoginForm({ usuario: '', contrasena: '' });
        loadAlbums();
        loadUsers();
      } else {
        showNotification('Usuario o contraseña incorrectos', 'error');
      }
    } catch (error) {
      showNotification('Error conectando con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Función para crear álbum
  const handleCreateAlbum = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Selecciona al menos un archivo', 'error');
      return;
    }
    if (!albumForm.sesion) {
      showNotification('El nombre del álbum es requerido', 'error');
      return;
    }

    setLoading(true);
    try {
      // Crear sesión
      const sessionRes = await fetch(`${API_URL}/api/sesiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(albumForm)
      });

      if (!sessionRes.ok) throw new Error('Error creando sesión');
      
      const sesion = await sessionRes.json();

      // Subir archivos
      let uploadedCount = 0;
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('sesion_id', sesion.id);

        const uploadRes = await fetch(`${API_URL}/api/files/subir`, {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) uploadedCount++;
      }

      showNotification(`Álbum "${albumForm.sesion}" creado con ${uploadedCount} archivo(s)`);
      setAlbumForm({ sesion: '', descripcion: '' });
      setSelectedFiles([]);
      setActiveTab('albums-section');
      loadAlbums();
    } catch (error) {
      showNotification('Error creando álbum: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar álbumes
  const loadAlbums = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sesiones`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
      }
    } catch (error) {
      console.error('Error cargando álbumes:', error);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    if (!canManageUsers()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // Crear usuario
  const handleCreateUser = async () => {
    if (!newUser.usuario || !newUser.contrasena) {
      showNotification('Complete todos los campos', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/usuarios/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        showNotification(`Usuario ${newUser.usuario} creado exitosamente`);
        setNewUser({ usuario: '', contrasena: '', role: 'editor' });
        loadUsers();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error creando usuario', 'error');
      }
    } catch (error) {
      showNotification('Error creando usuario', 'error');
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!passwordChange.newPassword || !passwordChange.confirmPassword) {
      showNotification('Complete los campos de nueva contraseña', 'error');
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      const body = { nueva: passwordChange.newPassword };
      if (passwordChange.oldPassword) body.actual = passwordChange.oldPassword;

      const response = await fetch(`${API_URL}/api/usuarios/${currentUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showNotification('Contraseña actualizada exitosamente');
        setPasswordChange({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error actualizando contraseña', 'error');
      }
    } catch (error) {
      showNotification('Error actualizando contraseña', 'error');
    }
  };

  // Función para confirmar acciones
  const confirmAction = (title, message, onConfirm) => {
    setModalData({ title, message, onConfirm });
    setShowModal(true);
  };

  // Eliminar usuario
  const deleteUser = (userId, username) => {
    confirmAction(
      'Eliminar usuario',
      `¿Eliminar usuario ${username}?`,
      async () => {
        try {
          const response = await fetch(`${API_URL}/api/usuarios/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });

          if (response.ok) {
            showNotification('Usuario eliminado');
            loadUsers();
          } else {
            const error = await response.json();
            showNotification(error.error || 'Error eliminando usuario', 'error');
          }
        } catch (error) {
          showNotification('Error eliminando usuario', 'error');
        }
      }
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-xl max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white text-3xl">
              🔒
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Acceso Administrativo
            </h2>
            <p className="text-gray-500">Ingresa tus credenciales para continuar</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">
                  👤
                </span>
                <input
                  type="text"
                  value={loginForm.usuario}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
                  placeholder="Nombre de usuario"
                  className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">
                  🔑
                </span>
                <input
                  type="password"
                  value={loginForm.contrasena}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
                  placeholder="Contraseña"
                  className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-3 shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  🚪 Iniciar Sesión
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-800">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-white text-lg">
                ⚙️
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-xs text-gray-500">
                  Gestión de contenido audiovisual
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white flex items-center gap-1 ${
                isAdmin() ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}>
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {isAdmin() ? 'Administrador' : 'Editor'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                <span className="font-medium">{currentUser.usuario}</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  isAdmin() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin() ? '👑 Admin' : '👤 Editor'}
                </span>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-gray-600 hover:text-blue-600 hover:bg-white/50 px-4 py-2 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                🚪 <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Notificación */}
        {message && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 transition-all transform translate-y-0 text-white flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Navegación por pestañas */}
        <nav className="bg-white/95 backdrop-blur-sm rounded-2xl mb-8 border border-white/20 shadow-lg overflow-hidden">
          <ul className="flex flex-wrap text-sm font-medium text-center">
            <li className="flex-1">
              <button
                onClick={() => setActiveTab('upload-section')}
                className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
                  activeTab === 'upload-section'
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-semibold">Subir Álbum</div>
                    <div className="text-xs opacity-75">Crear nuevo contenido</div>
                  </div>
                </div>
              </button>
            </li>
            <li className="flex-1">
              <button
                onClick={() => setActiveTab('albums-section')}
                className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
                  activeTab === 'albums-section'
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">🖼️</span>
                  <div>
                    <div className="font-semibold">Gestionar Álbumes</div>
                    <div className="text-xs opacity-75">Editar y organizar</div>
                  </div>
                </div>
              </button>
            </li>
            {canManageUsers() && (
              <li className="flex-1">
                <button
                  onClick={() => setActiveTab('users-section')}
                  className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
                    activeTab === 'users-section'
                      ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg">👥</span>
                    <div>
                      <div className="font-semibold">Usuarios</div>
                      <div className="text-xs opacity-75">Administrar accesos</div>
                    </div>
                  </div>
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Sección Subir Álbum */}
        {activeTab === 'upload-section' && (
          <section className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-lg text-white text-xl">
                ➕
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Crear nuevo álbum</h2>
                <p className="text-gray-500">Sube tus mejores momentos audiovisuales</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nombre del álbum *
                    </label>
                    <input
                      type="text"
                      value={albumForm.sesion}
                      onChange={(e) => setAlbumForm(prev => ({ ...prev, sesion: e.target.value }))}
                      placeholder="Ej: Vacaciones de verano 2025"
                      required
                      className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Descripción
                    </label>
                    <textarea
                      value={albumForm.descripcion}
                      onChange={(e) => setAlbumForm(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Describe este álbum y los momentos especiales que contiene..."
                      rows="4"
                      className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white/50 backdrop-blur-sm"
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Archivos *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-white/30 hover:border-blue-400 transition-all duration-300 min-h-[250px] flex flex-col justify-center backdrop-blur-sm">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                      id="fileInput"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg text-white text-2xl">
                        ☁️
                      </div>
                      <span className="text-lg font-semibold text-gray-700 mb-2">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </span>
                      <span className="text-sm text-gray-500">
                        JPG, PNG, GIF, MP4 - Máximo 50MB por archivo
                      </span>
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-6 space-y-3 max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex-shrink-0 text-lg">
                              {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type.startsWith('image/') ? 'Imagen' : 'Video'}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                ✓ Listo
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleCreateAlbum}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Creando álbum...
                    </>
                  ) : (
                    <>
                      💾 Crear Álbum
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sección Gestionar Álbumes */}
        {activeTab === 'albums-section' && (
          <section className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg text-white text-xl">
                🖼️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestionar Álbumes</h2>
                <p className="text-gray-500">Organiza y edita tus álbumes existentes</p>
              </div>
            </div>

            <div className="text-center p-16 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                📁
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">
                Funcionalidad en desarrollo
              </h3>
              <p className="text-gray-500">
                Pronto podrás gestionar tus álbumes desde aquí
              </p>
            </div>
          </section>
        )}

        {/* Sección Usuarios */}
        {activeTab === 'users-section' && canManageUsers() && (
          <section className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg text-white text-xl">
                🛡️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Administración de usuarios</h2>
                <p className="text-gray-500">Gestiona accesos y permisos del sistema</p>
              </div>
            </div>

            {/* Cambio de contraseña personal */}
            <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-3">
                <span className="text-xl">🔑</span>
                Cambiar mi contraseña
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={passwordChange.oldPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="Tu contraseña actual"
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordChange.newPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Nueva contraseña"
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar nueva
                  </label>
                  <input
                    type="password"
                    value={passwordChange.confirmPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repetir nueva contraseña"
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105"
              >
                🔑 Cambiar mi contraseña
              </button>
            </div>

            {/* Lista de usuarios */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-3">
                <span className="text-xl">👥</span>
                Lista de usuarios
              </h3>
              <div className="overflow-x-auto bg-white/50 rounded-2xl backdrop-blur-sm border border-white/20">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white/30">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-800">{user.usuario}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            <span>{user.role === 'admin' ? '👑' : '👤'}</span>
                            {user.role === 'admin' ? 'Administrador' : 'Editor'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {user.id !== 1 && user.usuario !== 'admin' && user.id !== currentUser.id ? (
                            <button
                              onClick={() => deleteUser(user.id, user.usuario)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors flex items-center gap-1"
                            >
                              <span>🗑️</span>
                              <span className="text-sm">Eliminar</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 flex items-center text-sm gap-2">
                              <span>🛡️</span>
                              {user.id === 1 || user.usuario === 'admin' ? 'Protegido' : 'Tu cuenta'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Añadir usuario */}
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-3">
                  <span className="text-xl">👤➕</span>
                  Añadir nuevo usuario
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      value={newUser.usuario}
                      onChange={(e) => setNewUser(prev => ({ ...prev, usuario: e.target.value }))}
                      placeholder="Nuevo usuario"
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white/70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={newUser.contrasena}
                      onChange={(e) => setNewUser(prev => ({ ...prev, contrasena: e.target.value }))}
                      placeholder="Contraseña"
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white/70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rol
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white/70"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105"
                >
                  👤➕ Añadir usuario
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4 text-red-600 text-xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-800">{modalData.title}</h3>
            </div>
            <p className="mb-8 text-gray-600 leading-relaxed">{modalData.message}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  modalData.onConfirm && modalData.onConfirm();
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}