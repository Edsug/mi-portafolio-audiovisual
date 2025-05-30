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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estados del formulario
  const [loginForm, setLoginForm] = useState({ usuario: '', contrasena: '' });
  const [uploadForm, setUploadForm] = useState({ nombre: '', descripcion: '', archivos: [] });
  const [newUserForm, setNewUserForm] = useState({ usuario: '', contrasena: '', role: 'editor' });

  // Referencias
  const fileInputRef = useRef(null);

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';

  // Utilidades
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const isAdmin = () => currentUser?.role === 'admin';
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
      day: '2-digit', month: 'short', year: 'numeric'
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
    if (!loginForm.usuario.trim() || !loginForm.contrasena) {
      showNotification('Complete todos los campos', 'error');
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
      const sessionResponse = await fetch(`${API_URL}/api/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ nombre: uploadForm.nombre, descripcion: uploadForm.descripcion })
      });

      if (!sessionResponse.ok) throw new Error('Error creando sesión');

      const session = await sessionResponse.json();

      let uploadedCount = 0;
      for (const file of uploadForm.archivos) {
        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('sesion_id', session.id);

        const uploadResponse = await fetch(`${API_URL}/api/files/subir`, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) uploadedCount++;
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

    try {
      const response = await fetch(`${API_URL}/api/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
      const response = await fetch(`${API_URL}/api/sesiones`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    }
  };

  const loadUsers = async () => {
    if (!canManageUsers()) return;
    try {
      const response = await fetch(`${API_URL}/api/usuarios`, { headers: getAuthHeaders() });
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
      const response = await fetch(`${API_URL}/api/sesiones/${albumId}`, { headers: getAuthHeaders() });
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

  useEffect(() => {
    if (isLoggedIn) {
      loadSessions();
      loadUsers();
    }
  }, [isLoggedIn]);

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="page-container">
        {/* Notificación */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <i className="fas fa-cog"></i>
              </div>
              <div className="header-text">
                <h1>Panel de Administración</h1>
                <p>Gestión de contenido audiovisual</p>
              </div>
              {isLoggedIn && (
                <span className={`status-badge ${isAdmin() ? 'admin' : 'editor'}`}>
                  <i className="fas fa-circle"></i>
                  {isAdmin() ? 'Administrador' : 'Editor'}
                </span>
              )}
            </div>
            <div className="header-right">
              {isLoggedIn && (
                <div className="user-info">
                  <span className="username">{currentUser?.usuario}</span>
                  <span className={`role-badge ${isAdmin() ? 'admin' : 'editor'}`}>
                    {isAdmin() ? 'Admin' : 'Editor'}
                  </span>
                </div>
              )}
              <a href="/" className="back-link">
                <i className="fas fa-arrow-left"></i>
                <span>Volver al Portafolio</span>
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {!isLoggedIn ? (
            // Login Section
            <div className="login-container">
              <div className="login-card">
                <div className="login-header">
                  <div className="login-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <h2>Acceso Administrativo</h2>
                  <p>Ingresa tus credenciales para continuar</p>
                </div>

                <div className="login-form">
                  <div className="form-group">
                    <label>Usuario</label>
                    <div className="input-group">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        value={loginForm.usuario}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
                        placeholder="Nombre de usuario"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <div className="input-group">
                      <i className="fas fa-key"></i>
                      <input
                        type="password"
                        value={loginForm.contrasena}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
                        placeholder="Contraseña"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="btn btn-primary btn-large"
                  >
                    <i className="fas fa-sign-in-alt"></i>
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation */}
              <nav className="navigation">
                <button
                  onClick={() => setActiveTab('upload-section')}
                  className={`nav-tab ${activeTab === 'upload-section' ? 'active' : ''}`}
                >
                  <i className="fas fa-upload"></i>
                  <div>
                    <div className="nav-title">Subir Álbum</div>
                    <div className="nav-subtitle">Crear nuevo contenido</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('albums-section')}
                  className={`nav-tab ${activeTab === 'albums-section' ? 'active' : ''}`}
                >
                  <i className="fas fa-images"></i>
                  <div>
                    <div className="nav-title">Gestionar Álbumes</div>
                    <div className="nav-subtitle">Editar y organizar</div>
                  </div>
                </button>
                {canManageUsers() && (
                  <button
                    onClick={() => setActiveTab('users-section')}
                    className={`nav-tab ${activeTab === 'users-section' ? 'active' : ''}`}
                  >
                    <i className="fas fa-users-cog"></i>
                    <div>
                      <div className="nav-title">Usuarios</div>
                      <div className="nav-subtitle">Administrar accesos</div>
                    </div>
                  </button>
                )}
              </nav>

              {/* Upload Section */}
              {activeTab === 'upload-section' && (
                <section className="section-card">
                  <div className="section-header">
                    <div className="section-icon green">
                      <i className="fas fa-plus"></i>
                    </div>
                    <div>
                      <h2>Crear nuevo álbum</h2>
                      <p>Sube tus mejores momentos audiovisuales</p>
                    </div>
                  </div>

                  <div className="upload-form">
                    <div className="form-grid">
                      <div className="form-left">
                        <div className="form-group">
                          <label>Nombre del álbum *</label>
                          <input
                            type="text"
                            value={uploadForm.nombre}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, nombre: e.target.value }))}
                            placeholder="Ej: Vacaciones de verano 2025"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Descripción</label>
                          <textarea
                            value={uploadForm.descripcion}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, descripcion: e.target.value }))}
                            placeholder="Describe este álbum..."
                            rows="4"
                            className="form-textarea"
                          ></textarea>
                        </div>
                      </div>

                      <div className="form-right">
                        <label>Archivos *</label>
                        <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
                          <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                          <div className="upload-icon">
                            <i className="fas fa-cloud-upload-alt"></i>
                          </div>
                          <span className="upload-text">Arrastra archivos aquí o haz clic para seleccionar</span>
                          <span className="upload-subtitle">JPG, PNG, GIF, MP4 - Máximo 50MB por archivo</span>
                          
                          {uploadForm.archivos.length > 0 && (
                            <div className="file-list">
                              {uploadForm.archivos.map((file, index) => (
                                <div key={index} className="file-item">
                                  <i className={`fas ${file.type.startsWith('image/') ? 'fa-image' : 'fa-video'}`}></i>
                                  <div className="file-info">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                  </div>
                                  <span className="file-status">✓ Listo</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        onClick={handleCreateAlbum}
                        disabled={loading}
                        className="btn btn-success btn-large"
                      >
                        <i className="fas fa-save"></i>
                        {loading ? 'Creando...' : 'Crear Álbum'}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Albums Section */}
              {activeTab === 'albums-section' && (
                <div className="albums-layout">
                  <div className="albums-sidebar">
                    <div className="section-card">
                      <div className="section-header-small">
                        <div className="section-icon blue">
                          <i className="fas fa-sort"></i>
                        </div>
                        <div>
                          <h3>Álbumes</h3>
                          <p>Selecciona para editar</p>
                        </div>
                      </div>

                      <div className="albums-list">
                        {sessions.length === 0 ? (
                          <div className="empty-state">
                            <i className="fas fa-images"></i>
                            <h4>No hay álbumes</h4>
                            <p>Crea tu primer álbum</p>
                          </div>
                        ) : (
                          sessions.map((session) => (
                            <div
                              key={session.id}
                              onClick={() => selectAlbum(session.id)}
                              className={`album-item ${selectedAlbum?.id === session.id ? 'selected' : ''}`}
                            >
                              <h4>{session.nombre}</h4>
                              <p>{session.descripcion || 'Sin descripción'}</p>
                              <div className="album-meta">
                                <span><i className="fas fa-calendar"></i> {formatDate(session.fecha_creacion)}</span>
                                <span><i className="fas fa-images"></i> {session.archivo_count || 0} archivo(s)</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="albums-content">
                    <div className="section-card">
                      {!selectedAlbum ? (
                        <div className="empty-state large">
                          <i className="fas fa-images"></i>
                          <h3>Selecciona un álbum</h3>
                          <p>Elige un álbum de la lista para ver y editar sus detalles</p>
                        </div>
                      ) : (
                        <div>
                          <div className="album-header">
                            <div>
                              <h3>{selectedAlbum.nombre}</h3>
                              <p>{selectedAlbum.descripcion || 'Sin descripción'}</p>
                              <div className="album-badges">
                                <span className="badge blue">
                                  <i className="fas fa-calendar-alt"></i> {formatDate(selectedAlbum.fecha_creacion)}
                                </span>
                                <span className="badge purple">
                                  <i className="fas fa-images"></i> {selectedAlbum.archivos?.length || 0} archivo(s)
                                </span>
                                <span className="badge red">
                                  <i className="fas fa-heart"></i> {selectedAlbum.likes || 0} like(s)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="album-files">
                            <h4><i className="fas fa-images"></i> Archivos del álbum</h4>
                            
                            {selectedAlbum.archivos && selectedAlbum.archivos.length > 0 ? (
                              <div className="files-grid">
                                {selectedAlbum.archivos.map((archivo) => (
                                  <div key={archivo.id} className="file-card">
                                    {isImageFile(archivo.tipo_archivo) ? (
                                      <div className="file-preview image">
                                        <img src={getFileUrl(archivo.ruta)} alt={archivo.nombre_archivo} />
                                      </div>
                                    ) : isVideoFile(archivo.tipo_archivo) ? (
                                      <div className="file-preview video">
                                        <i className="fas fa-play-circle"></i>
                                      </div>
                                    ) : (
                                      <div className="file-preview file">
                                        <i className="fas fa-file"></i>
                                      </div>
                                    )}
                                    <p className="file-name">{archivo.nombre_archivo}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-state">
                                <i className="fas fa-images"></i>
                                <h4>No hay archivos</h4>
                                <p>Añade archivos a este álbum</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Section */}
              {activeTab === 'users-section' && canManageUsers() && (
                <section className="section-card">
                  <div className="section-header">
                    <div className="section-icon purple">
                      <i className="fas fa-user-shield"></i>
                    </div>
                    <div>
                      <h2>Administración de usuarios</h2>
                      <p>Gestiona accesos y permisos del sistema</p>
                    </div>
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Rol</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.usuario}</td>
                            <td>
                              <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'editor'}`}>
                                <i className={`fas ${user.role === 'admin' ? 'fa-crown' : 'fa-user'}`}></i>
                                {user.role === 'admin' ? 'Administrador' : 'Editor'}
                              </span>
                            </td>
                            <td>
                              {user.id === 1 || user.usuario === 'admin' ? (
                                <span className="protected">
                                  <i className="fas fa-shield-alt"></i> Protegido
                                </span>
                              ) : (
                                <div className="action-buttons">
                                  <button className="btn btn-sm btn-primary">
                                    <i className="fas fa-key"></i> Cambiar contraseña
                                  </button>
                                  <button className="btn btn-sm btn-danger">
                                    <i className="fas fa-trash"></i> Eliminar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="add-user-section">
                    <h4><i className="fas fa-user-plus"></i> Añadir nuevo usuario</h4>
                    <div className="add-user-form">
                      <input
                        type="text"
                        value={newUserForm.usuario}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, usuario: e.target.value }))}
                        placeholder="Nombre de usuario"
                        className="form-input"
                      />
                      <input
                        type="password"
                        value={newUserForm.contrasena}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, contrasena: e.target.value }))}
                        placeholder="Contraseña"
                        className="form-input"
                      />
                      <select
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                        className="form-select"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <button onClick={handleAddUser} className="btn btn-success">
                        <i className="fas fa-user-plus"></i> Añadir usuario
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        <style jsx>{`
          .page-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f3e5f5 100%);
            color: #1f2937;
          }

          .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .notification.success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }

          .notification.error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }

          .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 50;
          }

          .header-content {
            max-width: 1280px;
            margin: 0 auto;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .logo {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
          }

          .header-text h1 {
            font-size: 20px;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }

          .header-text p {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
          }

          .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .status-badge.admin {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }

          .status-badge.editor {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .username {
            font-weight: 500;
            color: #374151;
          }

          .role-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }

          .role-badge.admin {
            background: #f3e8ff;
            color: #7c3aed;
          }

          .role-badge.editor {
            background: #dbeafe;
            color: #2563eb;
          }

          .back-link {
            color: #6b7280;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .back-link:hover {
            color: #3b82f6;
            background: rgba(255, 255, 255, 0.8);
          }

          .main-content {
            max-width: 1280px;
            margin: 0 auto;
            padding: 30px 20px;
          }

          .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
          }

          .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .login-header {
            text-align: center;
            margin-bottom: 30px;
          }

          .login-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 36px;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }

          .login-header h2 {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 10px 0;
          }

          .login-header p {
            color: #6b7280;
            margin: 0;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            font-weight: 600;
            color: #374151;
          }

          .input-group {
            position: relative;
          }

          .input-group i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
          }

          .input-group input {
            width: 100%;
            padding: 15px 15px 15px 45px;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(5px);
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .input-group input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }

          .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }

          .btn-success:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
          }

          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
          }

          .btn-large {
            padding: 15px 30px;
            font-size: 16px;
          }

          .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
          }

          .navigation {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            margin-bottom: 30px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: flex;
          }

          .nav-tab {
            flex: 1;
            padding: 24px;
            border: none;
            background: transparent;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 3px solid transparent;
          }

          .nav-tab i {
            font-size: 20px;
            color: #6b7280;
          }

          .nav-tab.active {
            background: rgba(59, 130, 246, 0.05);
            border-bottom-color: #3b82f6;
          }

          .nav-tab.active i {
            color: #3b82f6;
          }

          .nav-title {
            font-weight: 600;
            color: #374151;
          }

          .nav-subtitle {
            font-size: 12px;
            color: #6b7280;
            opacity: 0.75;
          }

          .section-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .section-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
          }

          .section-header-small {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }

          .section-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .section-icon.blue {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          .section-icon.green {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }

          .section-icon.purple {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }

          .section-header h2 {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
          }

          .section-header p {
            color: #6b7280;
            margin: 0;
          }

          .section-header h3 {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }

          .form-left {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 15px;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(5px);
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .form-input:focus, .form-textarea:focus, .form-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-textarea {
            resize: none;
          }

          .file-upload-area {
            border: 2px dashed #d1d5db;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 250px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(5px);
          }

          .file-upload-area:hover {
            border-color: #3b82f6;
            background: rgba(255, 255, 255, 0.5);
          }

          .upload-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 24px;
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          }

          .upload-text {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            display: block;
            margin-bottom: 8px;
          }

          .upload-subtitle {
            font-size: 14px;
            color: #6b7280;
          }

          .file-list {
            margin-top: 20px;
            max-height: 160px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .file-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border-radius: 10px;
            border: 1px solid #bfdbfe;
          }

          .file-item i {
            font-size: 16px;
            color: #3b82f6;
          }

          .file-info {
            flex: 1;
            text-align: left;
          }

          .file-name {
            font-weight: 500;
            color: #1f2937;
            margin: 0 0 4px 0;
            font-size: 14px;
          }

          .file-size {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
          }

          .file-status {
            background: #dcfce7;
            color: #166534;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
          }

          .form-actions {
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
          }

          .albums-layout {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
          }

          .albums-sidebar .section-card {
            padding: 24px;
          }

          .albums-list {
            max-height: 400px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .album-item {
            padding: 16px;
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .album-item:hover {
            border-color: #3b82f6;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }

          .album-item.selected {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }

          .album-item h4 {
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
            font-size: 16px;
          }

          .album-item p {
            color: #6b7280;
            margin: 0 0 12px 0;
            font-size: 14px;
            line-height: 1.4;
          }

          .album-meta {
            display: flex;
            gap: 15px;
            font-size: 12px;
            color: #9ca3af;
          }

          .album-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
          }

          .empty-state.large {
            padding: 80px 20px;
          }

          .empty-state i {
            font-size: 48px;
            color: #d1d5db;
            margin-bottom: 15px;
          }

          .empty-state h3, .empty-state h4 {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 8px 0;
          }

          .empty-state p {
            color: #6b7280;
            margin: 0;
          }

          .album-header {
            margin-bottom: 30px;
          }

          .album-header h3 {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 8px 0;
          }

          .album-header p {
            color: #6b7280;
            margin: 0 0 15px 0;
          }

          .album-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
          }

          .badge.blue {
            background: #dbeafe;
            color: #1e40af;
          }

          .badge.purple {
            background: #e9d5ff;
            color: #7c3aed;
          }

          .badge.red {
            background: #fecaca;
            color: #dc2626;
          }

          .album-files {
            border-top: 1px solid #e5e7eb;
            padding-top: 25px;
          }

          .album-files h4 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .album-files h4 i {
            color: #3b82f6;
          }

          .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 15px;
          }

          .file-card {
            position: relative;
          }

          .file-preview {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
          }

          .file-preview.image {
            background: #f3f4f6;
          }

          .file-preview.image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .file-preview.video {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            color: white;
          }

          .file-preview.video i {
            font-size: 40px;
            opacity: 0.9;
          }

          .file-preview.file {
            background: #f3f4f6;
            color: #9ca3af;
          }

          .file-preview.file i {
            font-size: 24px;
          }

          .file-card .file-name {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
            text-align: center;
            margin: 0;
            word-break: break-word;
          }

          .users-table-container {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            margin-bottom: 30px;
          }

          .users-table {
            width: 100%;
            border-collapse: collapse;
          }

          .users-table thead {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          }

          .users-table th {
            padding: 16px 20px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .users-table td {
            padding: 16px 20px;
            border-top: 1px solid #e5e7eb;
          }

          .users-table tbody tr {
            transition: background-color 0.2s ease;
          }

          .users-table tbody tr:hover {
            background: rgba(249, 250, 251, 0.5);
          }

          .protected {
            color: #9ca3af;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .action-buttons {
            display: flex;
            gap: 8px;
          }

          .add-user-section {
            padding: 24px;
            background: linear-gradient(135deg, #ecfdf5 0%, #dbeafe 100%);
            border-radius: 16px;
            border: 1px solid #a7f3d0;
          }

          .add-user-section h4 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .add-user-section h4 i {
            color: #059669;
          }

          .add-user-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: 15px;
            align-items: end;
          }

          @media (max-width: 1024px) {
            .form-grid {
              grid-template-columns: 1fr;
            }

            .albums-layout {
              grid-template-columns: 1fr;
            }

            .add-user-form {
              grid-template-columns: 1fr;
            }

            .header-content {
              flex-direction: column;
              gap: 15px;
            }

            .files-grid {
              grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            }
          }

          @media (max-width: 768px) {
            .main-content {
              padding: 20px 15px;
            }

            .navigation {
              flex-direction: column;
            }

            .nav-tab {
              text-align: center;
            }

            .section-card {
              padding: 20px;
            }

            .login-card {
              padding: 30px 20px;
            }

            .back-link span {
              display: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}