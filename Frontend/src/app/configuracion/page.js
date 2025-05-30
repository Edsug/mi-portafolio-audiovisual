'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function ConfiguracionPage() {
  // Estados principales
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('upload-section');
  const [sessions, setSessions] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isEditingAlbum, setIsEditingAlbum] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados del formulario de login
  const [loginForm, setLoginForm] = useState({
    usuario: '',
    contrasena: ''
  });

  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [targetUser, setTargetUser] = useState(null);

  // Estados para formularios
  const [uploadForm, setUploadForm] = useState({
    nombre: '',
    descripcion: '',
    archivos: []
  });

  const [newUserForm, setNewUserForm] = useState({
    usuario: '',
    contrasena: '',
    role: 'editor'
  });

  // Referencias
  const fileInputRef = useRef(null);
  const addMoreFilesRef = useRef(null);

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';

  // Utilidades
  const showNotification = (message, type = 'success') => {
    // Implementar notificación toast aquí
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const isAdmin = () => currentUser?.role === 'admin';
  const isEditor = () => currentUser?.role === 'editor';
  const canEditAlbums = () => isAdmin();
  const canDeleteAlbums = () => isAdmin();
  const canManageUsers = () => isAdmin();

  const getAuthHeaders = () => {
    if (!currentUser) return {};
    return {
      'user-role': currentUser.role,
      'user-id': currentUser.id.toString()
    };
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isImageFile = (tipo) => tipo && tipo.startsWith('image/');
  const isVideoFile = (tipo) => tipo && tipo.startsWith('video/');

  const getFileUrl = (ruta) => {
    if (!ruta) return '';
    let cleanPath = ruta.replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = 'uploads/' + cleanPath.replace(/^.*uploads\//, '');
    }
    return `${API_URL}/${cleanPath}`;
  };

  // Funciones de API
  const handleLogin = async () => {
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
        setIsLoggedIn(true);
        showNotification(`¡Bienvenido, ${data.usuario}!`);
        loadSessions();
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

  const handleCreateAlbum = async () => {
    if (!uploadForm.nombre.trim()) {
      showNotification('El nombre del álbum es requerido', 'error');
      return;
    }
    if (uploadForm.archivos.length === 0) {
      showNotification('Selecciona al menos un archivo', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear sesión
      const sessionResponse = await fetch(`${API_URL}/api/sesiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          nombre: uploadForm.nombre, 
          descripcion: uploadForm.descripcion 
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Error creando sesión');
      }

      const session = await sessionResponse.json();

      // 2. Subir archivos
      let uploadedCount = 0;
      for (const file of uploadForm.archivos) {
        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('sesion_id', session.id);

        const uploadResponse = await fetch(`${API_URL}/api/files/subir`, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          uploadedCount++;
        }
      }

      showNotification(`Álbum "${uploadForm.nombre}" creado con ${uploadedCount} archivo(s)`);
      setUploadForm({ nombre: '', descripcion: '', archivos: [] });
      loadSessions();
      setActiveTab('albums-section');
    } catch (error) {
      showNotification('Error creando álbum: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.usuario.trim() || !newUserForm.contrasena) {
      showNotification('Complete todos los campos', 'error');
      return;
    }

    if (newUserForm.contrasena.length < 4) {
      showNotification('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/usuarios/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newUserForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error del servidor');
      }

      showNotification(`Usuario ${newUserForm.usuario} creado exitosamente`);
      setNewUserForm({ usuario: '', contrasena: '', role: 'editor' });
      loadUsers();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sesiones`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    }
  };

  const loadUsers = async () => {
    if (!canManageUsers() && !isEditor()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const selectAlbum = async (albumId) => {
    try {
      const response = await fetch(`${API_URL}/api/sesiones/${albumId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const album = await response.json();
        setSelectedAlbum(album);
      }
    } catch (error) {
      console.error('Error cargando álbum:', error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadForm(prev => ({ ...prev, archivos: files }));
  };

  // Componente de Login
  const LoginSection = () => (
    <div className="glass p-10 rounded-2xl shadow-xl max-w-md mx-auto mt-20 border border-white/20">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <i className="fas fa-lock text-white text-3xl"></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Acceso Administrativo
        </h2>
        <p className="text-gray-500">Ingresa tus credenciales para continuar</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Usuario
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <i className="fas fa-user"></i>
            </span>
            <input
              type="text"
              value={loginForm.usuario}
              onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
              placeholder="Nombre de usuario"
              className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <i className="fas fa-key"></i>
            </span>
            <input
              type="password"
              value={loginForm.contrasena}
              onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
              placeholder="Contraseña"
              className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full gradient-blue text-white p-4 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-3 shadow-md transform hover:scale-105"
        >
          <i className="fas fa-sign-in-alt"></i>
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </div>
    </div>
  );

  // Componente de Navegación
  const Navigation = () => (
    <nav className="glass rounded-2xl mb-8 border border-white/20 shadow-lg overflow-hidden">
      <ul className="flex flex-wrap text-sm font-medium text-center">
        <li className="nav-tab flex-1">
          <button
            onClick={() => setActiveTab('upload-section')}
            className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
              activeTab === 'upload-section'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
            }`}
          >
            <i className="fas fa-upload mr-3 text-lg"></i>
            <div>
              <div className="font-semibold">Subir Álbum</div>
              <div className="text-xs opacity-75">Crear nuevo contenido</div>
            </div>
          </button>
        </li>
        <li className="nav-tab flex-1">
          <button
            onClick={() => setActiveTab('albums-section')}
            className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
              activeTab === 'albums-section'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
            }`}
          >
            <i className="fas fa-images mr-3 text-lg"></i>
            <div>
              <div className="font-semibold">Gestionar Álbumes</div>
              <div className="text-xs opacity-75">Editar y organizar</div>
            </div>
          </button>
        </li>
        {canManageUsers() && (
          <li className="nav-tab flex-1">
            <button
              onClick={() => setActiveTab('users-section')}
              className={`inline-block w-full p-6 border-b-2 transition-all backdrop-blur-sm ${
                activeTab === 'users-section'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
            >
              <i className="fas fa-users-cog mr-3 text-lg"></i>
              <div>
                <div className="font-semibold">Usuarios</div>
                <div className="text-xs opacity-75">Administrar accesos</div>
              </div>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );

  // Componente de Subida de Álbumes
  const UploadSection = () => (
    <section className="config-tab glass p-8 rounded-2xl shadow-lg border border-white/20">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 gradient-green rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <i className="fas fa-plus text-white text-xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Crear nuevo álbum
          </h2>
          <p className="text-gray-500">
            Sube tus mejores momentos audiovisuales
          </p>
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
                value={uploadForm.nombre}
                onChange={(e) => setUploadForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Vacaciones de verano 2025"
                className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Descripción
              </label>
              <textarea
                value={uploadForm.descripcion}
                onChange={(e) => setUploadForm(prev => ({ ...prev, descripcion: e.target.value }))}
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
                ref={fileInputRef}
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 gradient-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <i className="fas fa-cloud-upload-alt text-white text-2xl"></i>
                </div>
                <span className="text-lg font-semibold text-gray-700 mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </span>
                <span className="text-sm text-gray-500">
                  JPG, PNG, GIF, MP4 - Máximo 50MB por archivo
                </span>
              </div>
              
              {uploadForm.archivos.length > 0 && (
                <div className="mt-6 space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                  {uploadForm.archivos.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex-shrink-0">
                        <i className={`fas ${file.type.startsWith('image/') ? 'fa-image text-blue-600' : 'fa-video text-purple-600'} text-lg`}></i>
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
            className="gradient-green text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105"
          >
            <i className="fas fa-save text-lg"></i>
            {loading ? 'Creando...' : 'Crear Álbum'}
          </button>
        </div>
      </div>
    </section>
  );

  // Componente de Gestión de Álbumes
  const AlbumsSection = () => (
    <section className="config-tab">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <div className="glass p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-sort text-white"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Álbumes</h2>
                <p className="text-xs text-gray-500">Selecciona para editar</p>
              </div>
            </div>

            <ul className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {sessions.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-images text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No hay álbumes</h3>
                  <p className="text-sm text-gray-500">Crea tu primer álbum en la pestaña "Subir Álbum"</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <li
                    key={session.id}
                    onClick={() => selectAlbum(session.id)}
                    className={`album-item p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer ${
                      selectedAlbum?.id === session.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 mb-1 truncate">
                          {session.nombre}
                        </h4>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {session.descripcion || 'Sin descripción'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center">
                            <i className="fas fa-calendar mr-1"></i>
                            {formatDate(session.fecha_creacion)}
                          </span>
                          <span className="flex items-center">
                            <i className="fas fa-images mr-1"></i>
                            {session.archivo_count || 0} archivo(s)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="flex items-center text-red-500 font-medium">
                          <i className="fas fa-heart mr-1"></i>{session.likes || 0}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="glass p-8 rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
            {!selectedAlbum ? (
              <div className="text-center p-16 text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-images text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Selecciona un álbum
                </h3>
                <p className="text-gray-500">
                  Elige un álbum de la lista para ver y editar sus detalles
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedAlbum.nombre}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {selectedAlbum.descripcion || 'Sin descripción'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <i className="fas fa-calendar-alt mr-1"></i>
                        {formatDate(selectedAlbum.fecha_creacion)}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <i className="fas fa-images mr-1"></i>
                        {selectedAlbum.archivos?.length || 0} archivo(s)
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <i className="fas fa-heart mr-1"></i>
                        {selectedAlbum.likes || 0} like(s)
                      </span>
                    </div>
                  </div>
                  
                  {canEditAlbums() && (
                    <div className="flex items-center gap-2 ml-4">
                      <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Editar álbum">
                        <i className="fas fa-edit text-lg"></i>
                      </button>
                      {canDeleteAlbums() && (
                        <button className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="Eliminar álbum">
                          <i className="fas fa-trash text-lg"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      <i className="fas fa-images mr-2 text-blue-600"></i>
                      Archivos del álbum
                    </h4>
                    <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105">
                      <i className="fas fa-plus text-sm"></i>
                      Añadir archivos
                      <input type="file" multiple accept="image/*,video/*" className="hidden" />
                    </label>
                  </div>
                  
                  {selectedAlbum.archivos && selectedAlbum.archivos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {selectedAlbum.archivos.map((archivo) => (
                        <div key={archivo.id} className="file-item group relative">
                          {isImageFile(archivo.tipo_archivo) ? (
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={getFileUrl(archivo.ruta)}
                                alt={archivo.nombre_archivo}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : isVideoFile(archivo.tipo_archivo) ? (
                            <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-colors">
                              <i className="fas fa-play-circle text-5xl text-white opacity-90"></i>
                            </div>
                          ) : (
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-file text-2xl text-gray-400"></i>
                            </div>
                          )}
                          
                          {/* Overlay de acciones */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                            <div className="flex gap-2">
                              <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors transform hover:scale-110" title="Ver archivo">
                                <i className={`fas ${isVideoFile(archivo.tipo_archivo) ? 'fa-play' : 'fa-eye'}`}></i>
                              </button>
                              {canDeleteAlbums() && (
                                <button className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors transform hover:scale-110" title="Eliminar archivo">
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 truncate font-medium">
                              {archivo.nombre_archivo}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-images text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No hay archivos
                      </h3>
                      <p className="text-sm text-gray-500">
                        Añade archivos usando el botón de arriba
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Componente de Gestión de Usuarios
  const UsersSection = () => (
    <section className="config-tab glass p-8 rounded-2xl shadow-lg border border-white/20">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 gradient-purple rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <i className="fas fa-user-shield text-white text-xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Administración de usuarios
          </h2>
          <p className="text-gray-500">
            Gestiona accesos y permisos del sistema
          </p>
        </div>
      </div>

      {/* Cambio de contraseña personal */}
      <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
          <i className="fas fa-key mr-3 text-blue-600"></i>
          Cambiar mi contraseña
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña actual
            </label>
            <input
              type="password"
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
              placeholder="Repetir nueva contraseña"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70"
            />
          </div>
        </div>
        <button className="mt-6 gradient-purple text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105">
          <i className="fas fa-key"></i>
          Cambiar mi contraseña
        </button>
      </div>

      {/* Lista de usuarios */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
          <i className="fas fa-users mr-3 text-purple-600"></i>
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
                  <td className="py-4 px-4 font-medium text-gray-800">
                    {user.usuario}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      <i className={`fas ${user.role === 'admin' ? 'fa-crown' : 'fa-user'} mr-1`}></i>
                      {user.role === 'admin' ? 'Administrador' : 'Editor'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {canManageUsers() && user.id !== currentUser?.id && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                            <i className="fas fa-key text-xs"></i>
                            <span className="text-sm">Cambiar contraseña</span>
                          </button>
                          {user.id !== 1 && user.usuario !== 'admin' && (
                            <button className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                              <i className="fas fa-trash text-xs"></i>
                              <span className="text-sm">Eliminar</span>
                            </button>
                          )}
                        </>
                      )}
                      {(user.id === 1 || user.usuario === 'admin') && (
                        <span className="text-gray-400 flex items-center text-sm">
                          <i className="fas fa-shield-alt mr-2"></i>Protegido
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Añadir usuario */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
            <i className="fas fa-user-plus mr-3 text-green-600"></i>
            Añadir nuevo usuario
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={newUserForm.usuario}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, usuario: e.target.value }))}
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
                value={newUserForm.contrasena}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, contrasena: e.target.value }))}
                placeholder="Contraseña"
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white/70"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white/70"
              >
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddUser}
            className="mt-6 gradient-green text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3 shadow-md font-semibold transform hover:scale-105"
          >
            <i className="fas fa-user-plus"></i>
            Añadir usuario
          </button>
        </div>
      </div>
    </section>
  );

  useEffect(() => {
    if (isLoggedIn) {
      loadSessions();
      loadUsers();
    }
  }, [isLoggedIn]);

  return (
    <>
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <style jsx>{`
          .transition-all {
            transition: all 0.3s ease;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .aspect-square {
            aspect-ratio: 1;
          }
          .glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .gradient-blue {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .gradient-purple {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .gradient-green {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
        `}</style>
      </Head>

      <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-800 min-h-screen">
        <header className="glass sticky top-0 z-50 border-b border-white/20 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-cog text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Panel de Administración
                  </h1>
                  <p className="text-xs text-gray-500">
                    Gestión de contenido audiovisual
                  </p>
                </div>
                {isLoggedIn && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${
                    isAdmin() ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}>
                    <i className="fas fa-circle text-xs mr-1"></i>
                    {isAdmin() ? 'Administrador' : 'Editor'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {isLoggedIn && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentUser?.usuario}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isAdmin() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAdmin() ? 'Admin' : 'Editor'}
                    </span>
                  </div>
                )}
                <a
                  href="/"
                  className="text-gray-600 hover:text-blue-600 hover:bg-white/50 px-4 py-2 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm"
                >
                  <i className="fas fa-arrow-left text-sm"></i>
                  <span className="hidden sm:inline">Volver al Portafolio</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-6 space-y-8 max-w-7xl">
          {!isLoggedIn ? (
            <LoginSection />
          ) : (
            <>
              <Navigation />
              
              {activeTab === 'upload-section' && <UploadSection />}
              {activeTab === 'albums-section' && <AlbumsSection />}
              {activeTab === 'users-section' && canManageUsers() && <UsersSection />}
            </>
          )}
        </main>
      </div>
    </>
  );
}