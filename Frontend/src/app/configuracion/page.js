'use client';

import { useState, useEffect } from 'react';

export default function ConfiguracionPage() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [loginForm, setLoginForm] = useState({
    usuario: 'admin',
    contrasena: 'admin123'
  });

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      console.error('Error verificando backend:', error);
      setBackendStatus({ status: 'error', message: error.message });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';
      const response = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setMessage({ type: 'success', text: `¡Bienvenido, ${data.usuario}! Rol: ${data.role}` });
        setLoginForm({ usuario: '', contrasena: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error en el login' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el backend' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMessage({ type: 'info', text: 'Sesión cerrada correctamente' });
    setLoginForm({ usuario: 'admin', contrasena: 'admin123' });
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 200px)'
    }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: '0 0 15px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ⚙️ Panel de Configuración
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666', 
          margin: '0'
        }}>
          Administra tu portafolio audiovisual
        </p>
      </header>

      {/* Mensaje de estado */}
      {message && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '25px',
          backgroundColor: message.type === 'success' ? '#d4edda' : 
                          message.type === 'error' ? '#f8d7da' : '#d1ecf1',
          border: '1px solid',
          borderColor: message.type === 'success' ? '#c3e6cb' : 
                      message.type === 'error' ? '#f5c6cb' : '#bee5eb',
          color: message.type === 'success' ? '#155724' : 
                message.type === 'error' ? '#721c24' : '#0c5460'
        }}>
          {message.text}
        </div>
      )}

      {/* Estado del backend */}
      <section style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#2c3e50' }}>
          📊 Estado del Sistema
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <strong>Backend:</strong>
            <br />
            <span style={{ 
              color: backendStatus?.status === 'healthy' ? '#28a745' : '#dc3545',
              fontSize: '14px'
            }}>
              {backendStatus?.status === 'healthy' ? '✅ Conectado' : '❌ Error'}
            </span>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <strong>Estado Usuario:</strong>
            <br />
            <span style={{ fontSize: '14px', color: user ? '#28a745' : '#6c757d' }}>
              {user ? `✅ ${user.usuario} (${user.role})` : '❌ No autenticado'}
            </span>
          </div>

          {backendStatus?.uptime && (
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <strong>Uptime:</strong>
              <br />
              <span style={{ fontSize: '14px', color: '#666' }}>
                {Math.floor(backendStatus.uptime / 60)} minutos
              </span>
            </div>
          )}
        </div>

        <button 
          onClick={checkBackend}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Verificar Estado
        </button>
      </section>

      {/* Panel de login/logout */}
      <section style={{ marginBottom: '30px' }}>
        {!user ? (
          <div style={{
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '10px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#2c3e50' }}>
              🔐 Iniciar Sesión
            </h2>
            
            <form onSubmit={handleLogin} style={{ maxWidth: '350px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  color: '#555',
                  fontWeight: '500'
                }}>
                  Usuario:
                </label>
                <input
                  type="text"
                  value={loginForm.usuario}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  color: '#555',
                  fontWeight: '500'
                }}>
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={loginForm.contrasena}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#6c757d' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {loading ? '⏳ Iniciando...' : '🔓 Iniciar Sesión'}
              </button>
            </form>

            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#e9ecef',
              borderRadius: '5px',
              fontSize: '13px',
              color: '#495057'
            }}>
              <strong>💡 Credenciales:</strong> admin / admin123
            </div>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            borderRadius: '10px',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#155724' }}>
                  👋 ¡Hola, {user.usuario}!
                </h2>
                <p style={{ margin: '0', color: '#155724', fontSize: '14px' }}>
                  Rol: <strong>{user.role}</strong> | Acceso concedido
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Funciones administrativas */}
      {user && (
        <section style={{
          padding: '25px',
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#2c3e50' }}>
            🛠️ Funciones Administrativas
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>➕</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Crear Sesión</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                Agregar nueva sesión audiovisual
              </p>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Próximamente
              </button>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Subir Archivos</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                Agregar fotos y videos
              </p>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Próximamente
              </button>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚙️</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Configuración</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                Ajustes del portafolio
              </p>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Próximamente
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Enlaces útiles */}
      <section style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#2c3e50' }}>
          🔗 Enlaces de la API
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/health`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#333',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            <strong>🏥 Health Check</strong>
          </a>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/sesiones`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#333',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            <strong>📋 API Sesiones</strong>
          </a>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#333',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            <strong>🌐 Backend Status</strong>
          </a>
        </div>
      </section>
    </div>
  );
}