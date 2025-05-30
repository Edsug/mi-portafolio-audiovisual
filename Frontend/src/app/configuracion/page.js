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

  // Estilos inline para garantizar que se apliquen
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 25%, #f3e8ff 100%)',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    loginContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    },
    loginCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '2.5rem',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      maxWidth: '28rem',
      width: '100%',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: '0',
      zIndex: '50',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    button: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '1rem'
    },
    input: {
      width: '100%',
      padding: '1rem',
      paddingLeft: '3rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.5)',
      outline: 'none'
    },
    section: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    notification: {
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      color: 'white',
      fontWeight: '500',
      zIndex: '50',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  };

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
    } catch (error) {
      showNotification('Error creando álbum: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    if (!isAdmin()) return;
    
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

  // Eliminar usuario
  const deleteUser = async (userId, username) => {
    if (window.confirm(`¿Eliminar usuario ${username}?`)) {
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
  };

  if (!currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '2rem'
              }}>
                🔒
              </div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                Acceso Administrativo
              </h2>
              <p style={{ color: '#6b7280' }}>Ingresa tus credenciales para continuar</p>
            </div>

            {message && (
              <div style={{
                ...styles.notification,
                position: 'static',
                marginBottom: '1.5rem',
                background: message.type === 'success' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{message.type === 'success' ? '✅' : '⚠️'}</span>
                {message.text}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: '#9ca3af'
                }}>
                  👤
                </span>
                <input
                  type="text"
                  value={loginForm.usuario}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
                  placeholder="Nombre de usuario"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: '#9ca3af'
                }}>
                  🔑
                </span>
                <input
                  type="password"
                  value={loginForm.contrasena}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
                  placeholder="Contraseña"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...styles.button,
                width: '100%',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
            >
              {loading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
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
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'white',
                fontSize: '1.25rem'
              }}>
                ⚙️
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Panel de Administración
                </h1>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Gestión de contenido audiovisual
                </p>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '9999px',
                color: 'white',
                background: isAdmin() 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                {isAdmin() ? 'Administrador' : 'Editor'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                <span style={{ fontWeight: '500' }}>{currentUser.usuario}</span>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '9999px',
                  background: isAdmin() ? '#f3e8ff' : '#dbeafe',
                  color: isAdmin() ? '#7c3aed' : '#2563eb'
                }}>
                  {isAdmin() ? '👑 Admin' : '👤 Editor'}
                </span>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                style={{
                  color: '#6b7280',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#6b7280';
                  e.target.style.background = 'transparent';
                }}
              >
                🚪 <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Notificación */}
        {message && (
          <div style={{
            ...styles.notification,
            background: message.type === 'success' 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          }}>
            <span style={{ fontSize: '1.25rem' }}>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span style={{ fontWeight: '500' }}>{message.text}</span>
          </div>
        )}

        {/* Navegación por pestañas */}
        <nav style={{
          ...styles.section,
          padding: '0',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', fontSize: '0.875rem', fontWeight: '500', textAlign: 'center' }}>
            <button
              onClick={() => setActiveTab('upload-section')}
              style={{
                flex: '1',
                padding: '1.5rem',
                border: 'none',
                borderBottom: activeTab === 'upload-section' ? '2px solid #3b82f6' : '2px solid transparent',
                background: activeTab === 'upload-section' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeTab === 'upload-section' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📤</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Subir Álbum</div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.75' }}>Crear nuevo contenido</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('albums-section')}
              style={{
                flex: '1',
                padding: '1.5rem',
                border: 'none',
                borderBottom: activeTab === 'albums-section' ? '2px solid #3b82f6' : '2px solid transparent',
                background: activeTab === 'albums-section' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeTab === 'albums-section' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🖼️</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Gestionar Álbumes</div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.75' }}>Editar y organizar</div>
                </div>
              </div>
            </button>
            {isAdmin() && (
              <button
                onClick={() => setActiveTab('users-section')}
                style={{
                  flex: '1',
                  padding: '1.5rem',
                  border: 'none',
                  borderBottom: activeTab === 'users-section' ? '2px solid #3b82f6' : '2px solid transparent',
                  background: activeTab === 'users-section' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: activeTab === 'users-section' ? '#3b82f6' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>👥</span>
                  <div>
                    <div style={{ fontWeight: '600' }}>Usuarios</div>
                    <div style={{ fontSize: '0.75rem', opacity: '0.75' }}>Administrar accesos</div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </nav>

        {/* Sección Subir Álbum */}
        {activeTab === 'upload-section' && (
          <section style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                ➕
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Crear nuevo álbum</h2>
                <p style={{ color: '#6b7280' }}>Sube tus mejores momentos audiovisuales</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                    Nombre del álbum *
                  </label>
                  <input
                    type="text"
                    value={albumForm.sesion}
                    onChange={(e) => setAlbumForm(prev => ({ ...prev, sesion: e.target.value }))}
                    placeholder="Ej: Vacaciones de verano 2025"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.5)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                    Descripción
                  </label>
                  <textarea
                    value={albumForm.descripcion}
                    onChange={(e) => setAlbumForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe este álbum y los momentos especiales que contiene..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.5)',
                      resize: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                  Archivos *
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                  minHeight: '250px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.6)';
                  e.target.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderColor = '#d1d5db';
                }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: 'white',
                      fontSize: '1.5rem'
                    }}>
                      ☁️
                    </div>
                    <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Arrastra archivos aquí o haz clic para seleccionar
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      JPG, PNG, GIF, MP4 - Máximo 50MB por archivo
                    </span>
                  </label>
                  
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '1.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.875rem',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          margin: '0.5rem 0'
                        }}>
                          <div style={{ fontSize: '1.25rem' }}>
                            {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                          </div>
                          <div style={{ flex: '1', minWidth: '0' }}>
                            <p style={{ fontWeight: '500', color: '#1f2937', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0' }}>
                              {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type.startsWith('image/') ? 'Imagen' : 'Video'}
                            </p>
                          </div>
                          <div>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: '#dcfce7',
                              color: '#166534',
                              fontSize: '0.75rem',
                              borderRadius: '9999px',
                              fontWeight: '500'
                            }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
              <button
                onClick={handleCreateAlbum}
                disabled={loading}
                style={{
                  ...styles.button,
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Creando álbum...
                  </>
                ) : (
                  <>
                    💾 Crear Álbum
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Sección Gestionar Álbumes */}
        {activeTab === 'albums-section' && (
          <section style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                🖼️
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Gestionar Álbumes</h2>
                <p style={{ color: '#6b7280' }}>Organiza y edita tus álbumes existentes</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#f3f4f6',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                fontSize: '2rem'
              }}>
                📁
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                Funcionalidad en desarrollo
              </h3>
              <p style={{ color: '#6b7280' }}>
                Pronto podrás gestionar tus álbumes desde aquí
              </p>
            </div>
          </section>
        )}

        {/* Sección Usuarios */}
        {activeTab === 'users-section' && isAdmin() && (
          <section style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                🛡️
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Administración de usuarios</h2>
                <p style={{ color: '#6b7280' }}>Gestiona accesos y permisos del sistema</p>
              </div>
            </div>

            {/* Cambio de contraseña personal */}
            <div style={{
              marginBottom: '2.5rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderRadius: '1rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🔑</span>
                Cambiar mi contraseña
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={passwordChange.oldPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="Tu contraseña actual"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.7)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordChange.newPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Nueva contraseña"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.7)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Confirmar nueva
                  </label>
                  <input
                    type="password"
                    value={passwordChange.confirmPassword}
                    onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repetir nueva contraseña"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.7)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                🔑 Cambiar mi contraseña
              </button>
            </div>

            {/* Lista de usuarios */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>👥</span>
                Lista de usuarios
              </h3>
              <div style={{
                overflowX: 'auto',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Usuario
                      </th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Rol
                      </th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                    {users.map((user, index) => (
                      <tr key={user.id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '1rem', fontWeight: '500', color: '#1f2937' }}>{user.usuario}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            gap: '0.25rem',
                            background: user.role === 'admin' ? '#f3e8ff' : '#dbeafe',
                            color: user.role === 'admin' ? '#7c3aed' : '#2563eb'
                          }}>
                            <span>{user.role === 'admin' ? '👑' : '👤'}</span>
                            {user.role === 'admin' ? 'Administrador' : 'Editor'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {user.id !== 1 && user.usuario !== 'admin' && user.id !== currentUser.id ? (
                            <button
                              onClick={() => deleteUser(user.id, user.usuario)}
                              style={{
                                color: '#dc2626',
                                background: 'transparent',
                                border: 'none',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.color = '#991b1b';
                                e.target.style.background = '#fef2f2';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = '#dc2626';
                                e.target.style.background = 'transparent';
                              }}
                            >
                              <span>🗑️</span>
                              <span>Eliminar</span>
                            </button>
                          ) : (
                            <span style={{
                              color: '#9ca3af',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
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
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: '1rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1.5rem',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>👤➕</span>
                  Añadir nuevo usuario
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      value={newUser.usuario}
                      onChange={(e) => setNewUser(prev => ({ ...prev, usuario: e.target.value }))}
                      placeholder="Nuevo usuario"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        background: 'rgba(255, 255, 255, 0.7)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={newUser.contrasena}
                      onChange={(e) => setNewUser(prev => ({ ...prev, contrasena: e.target.value }))}
                      placeholder="Contraseña"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        background: 'rgba(255, 255, 255, 0.7)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Rol
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        background: 'rgba(255, 255, 255, 0.7)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreateUser}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  👤➕ Añadir usuario
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}