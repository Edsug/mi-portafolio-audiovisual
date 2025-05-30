// config.js - Configuración de la API para Next.js

// URL del backend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Configuración de endpoints
export const API_ENDPOINTS = {
  // Usuarios
  LOGIN: `${API_URL}/api/usuarios/login`,
  USERS: `${API_URL}/api/usuarios`,
  REGISTER: `${API_URL}/api/usuarios/register`,
  
  // Sesiones
  SESIONES: `${API_URL}/api/sesiones`,
  SESION_BY_ID: (id) => `${API_URL}/api/sesiones/${id}`,
  REORDER_SESIONES: `${API_URL}/api/sesiones/reordenar`,
  
  // Archivos
  FILES: `${API_URL}/api/files`,
  UPLOAD_FILE: `${API_URL}/api/files/subir`,
  UPLOADS: `${API_URL}/uploads`,
  
  // Reacciones/Likes
  LIKES: `${API_URL}/api/likes`,
  LIKE_BY_SESION: (sesionId) => `${API_URL}/api/likes/${sesionId}`,
  ADD_LIKE: (sesionId) => `${API_URL}/api/like/${sesionId}`,
  
  // Health check
  HEALTH: `${API_URL}/health`,
};

// Configuración de headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configuración para CORS
export const FETCH_CONFIG = {
  mode: 'cors',
  credentials: 'include',
};

// Helper para construir configuración de fetch
export const buildFetchConfig = (method = 'GET', body = null, additionalHeaders = {}) => {
  const config = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...additionalHeaders,
    },
    ...FETCH_CONFIG,
  };

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return config;
};

// Configuración del entorno
export const APP_CONFIG = {
  API_URL,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
};

console.log('🔧 Configuración de API cargada:', {
  API_URL,
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: APP_CONFIG.APP_ENV
});