'use client';

// src/app/page.js - Página principal

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar backend
      await checkBackend();
      
      // Cargar sesiones
      await loadSesiones();
      
    } catch (err) {
      setError(err.message);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBackend = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      console.error('Error conectando al backend:', error);
      setBackendStatus({ status: 'error', message: error.message });
    }
  };

  const loadSesiones = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';
      const response = await fetch(`${API_URL}/api/sesiones`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSesiones(data);
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      throw error;
    }
  };

  const handleLike = async (sesionId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com';
      const response = await fetch(`${API_URL}/api/like/${sesionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Recargar sesiones para actualizar likes
        await loadSesiones();
      }
    } catch (error) {
      console.error('Error dando like:', error);
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 200px)'
    }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          margin: '0 0 20px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎬 Mi Portafolio Audiovisual
        </h1>
        <p style={{ 
          fontSize: '1.3rem', 
          color: '#666', 
          margin: '0',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.6'
        }}>
          Explora mi colección de sesiones audiovisuales, cada una capturando momentos únicos y creativos.
        </p>
      </header>

      {/* Estado del sistema */}
      {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
        <section style={{ 
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: loading ? '#f8f9fa' : (backendStatus?.status === 'healthy' ? '#d4edda' : '#f8d7da'),
          border: '1px solid',
          borderColor: loading ? '#dee2e6' : (backendStatus?.status === 'healthy' ? '#c3e6cb' : '#f5c6cb'),
          borderRadius: '12px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>
            🔧 Estado del Sistema (Desarrollo)
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <strong>Backend:</strong> {' '}
              {backendStatus?.status === 'healthy' ? (
                <span style={{ color: '#155724' }}>✅ Conectado</span>
              ) : (
                <span style={{ color: '#721c24' }}>❌ {backendStatus?.status || 'Error'}</span>
              )}
            </div>
            
            <div>
              <strong>API:</strong> {process.env.NEXT_PUBLIC_API_URL}
            </div>

            {backendStatus?.uptime && (
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>Uptime:</strong> {Math.floor(backendStatus.uptime / 60)} min
              </div>
            )}

            <button 
              onClick={loadData}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 Actualizar
            </button>
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Cargando contenido...</h3>
          <p style={{ margin: '0', color: '#666' }}>
            Conectando con el backend y obteniendo las sesiones más recientes.
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ 
          padding: '30px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '12px',
          color: '#721c24',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>❌</div>
          <h3 style={{ margin: '0 0 15px 0' }}>Error de conexión</h3>
          <p style={{ margin: '0 0 20px 0' }}>{error}</p>
          <button 
            onClick={loadData}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Reintentar conexión
          </button>
        </div>
      )}

      {/* Galería de sesiones */}
      {!loading && !error && (
        <section>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{ margin: '0', fontSize: '2rem', color: '#333' }}>
              📸 Sesiones Audiovisuales
            </h2>
            <div style={{ 
              fontSize: '1rem', 
              color: '#666',
              padding: '8px 16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '20px',
              border: '1px solid #dee2e6'
            }}>
              {sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'}
            </div>
          </div>
          
          {sesiones.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
                Aún no hay sesiones
              </h3>
              <p style={{ margin: '0', color: '#666', fontSize: '1.1rem' }}>
                ¡Sé el primero en crear una sesión audiovisual y compartir tu arte!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '25px',
              marginTop: '30px'
            }}>
              {sesiones.map((sesion) => (
                <article
                  key={sesion.id}
                  style={{
                    border: '1px solid #e1e8ed',
                    borderRadius: '16px',
                    padding: '25px',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="hover-card"
                >
                  {/* Indicador de categoría */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  }} />

                  <h3 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#2c3e50',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    lineHeight: '1.3'
                  }}>
                    📸 {sesion.nombre}
                  </h3>
                  
                  {sesion.descripcion && (
                    <p style={{ 
                      margin: '0 0 20px 0', 
                      color: '#5a6c7d',
                      fontSize: '15px',
                      lineHeight: '1.5'
                    }}>
                      {sesion.descripcion}
                    </p>
                  )}

                  {/* Estadísticas */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      📁 {sesion.total_archivos || 0} archivos
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(sesion.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#e74c3c',
                        transition: 'all 0.2s'
                      }}
                      className="hover-button"
                    >
                      💖 {sesion.likes || 0}
                    </button>
                  </div>

                  {/* Fecha */}
                  {sesion.fecha_creacion && (
                    <div style={{ 
                      fontSize: '12px',
                      color: '#95a5a6',
                      textAlign: 'right'
                    }}>
                      🗓️ {new Date(sesion.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Call to action si no hay sesiones */}
      {!loading && !error && sesiones.length === 0 && (
        <section style={{ 
          marginTop: '50px',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#667eea',
          color: 'white',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.5rem' }}>
            ¿Listo para comenzar?
          </h3>
          <p style={{ margin: '0 0 20px 0', opacity: 0.9 }}>
            Accede al panel de administración para crear tu primera sesión
          </p>
          <button style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            🚀 Comenzar ahora
          </button>
        </section>
      )}
    </div>
  );
}