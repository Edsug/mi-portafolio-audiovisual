// components/TestConnection.js - Componente para probar la conexión con el backend

import { useState, useEffect } from 'react';
import API from '../services/api';
import { API_URL } from '../config';

const TestConnection = () => {
  const [status, setStatus] = useState({
    health: null,
    sesiones: null,
    login: null,
    loading: false,
    error: null
  });

  const [loginForm, setLoginForm] = useState({
    usuario: 'admin',
    contrasena: 'admin123'
  });

  // Test de health check
  const testHealth = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const health = await API.health.check();
      setStatus(prev => ({ ...prev, health }));
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
    }
  };

  // Test de sesiones
  const testSesiones = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const sesiones = await API.sesiones.getAll();
      setStatus(prev => ({ ...prev, sesiones }));
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
    }
  };

  // Test de login
  const testLogin = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const result = await API.auth.login(loginForm.usuario, loginForm.contrasena);
      setStatus(prev => ({ ...prev, login: result }));
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
    }
  };

  // Auto-test al cargar
  useEffect(() => {
    testHealth();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      margin: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>🔧 Test de Conexión Backend</h2>
      
      {/* Información básica */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Backend URL:</strong> {API_URL}
        <br />
        <strong>Estado:</strong> {status.loading ? '⏳ Cargando...' : '✅ Listo'}
        {status.error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>❌ Error:</strong> {status.error}
          </div>
        )}
      </div>

      {/* Botones de test */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testHealth}
          disabled={status.loading}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🏥 Test Health
        </button>

        <button 
          onClick={testSesiones}
          disabled={status.loading}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 Test Sesiones
        </button>

        <button 
          onClick={testLogin}
          disabled={status.loading}
          style={{ 
            padding: '10px 15px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          👤 Test Login
        </button>
      </div>

      {/* Login Form */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h4>Test Login:</h4>
        <input
          type="text"
          placeholder="Usuario"
          value={loginForm.usuario}
          onChange={(e) => setLoginForm(prev => ({ ...prev, usuario: e.target.value }))}
          style={{ padding: '8px', marginRight: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={loginForm.contrasena}
          onChange={(e) => setLoginForm(prev => ({ ...prev, contrasena: e.target.value }))}
          style={{ padding: '8px', marginRight: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>

      {/* Resultados */}
      <div>
        <h3>📊 Resultados:</h3>
        
        {status.health && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
            <strong>🏥 Health Check:</strong>
            <pre style={{ margin: '5px 0', fontSize: '12px' }}>
              {JSON.stringify(status.health, null, 2)}
            </pre>
          </div>
        )}

        {status.sesiones && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
            <strong>📋 Sesiones ({status.sesiones.length} encontradas):</strong>
            <pre style={{ margin: '5px 0', fontSize: '12px' }}>
              {JSON.stringify(status.sesiones, null, 2)}
            </pre>
          </div>
        )}

        {status.login && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            <strong>👤 Login Exitoso:</strong>
            <pre style={{ margin: '5px 0', fontSize: '12px' }}>
              {JSON.stringify(status.login, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Links directos */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>🔗 Links directos al backend:</h4>
        <ul>
          <li>
            <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">
              Health Check
            </a>
          </li>
          <li>
            <a href={`${API_URL}/api/sesiones`} target="_blank" rel="noopener noreferrer">
              API Sesiones
            </a>
          </li>
          <li>
            <a href={`${API_URL}/`} target="_blank" rel="noopener noreferrer">
              Backend Status
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestConnection;