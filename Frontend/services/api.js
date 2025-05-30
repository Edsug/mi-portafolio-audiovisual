// services/api.js - Servicio de API para comunicación con el backend

import { API_ENDPOINTS, buildFetchConfig } from '../config';

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};

// Helper para manejar errores
const handleError = (error, operation) => {
  console.error(`❌ Error en ${operation}:`, error);
  throw error;
};

// ===== USUARIOS =====

export const authAPI = {
  // Login
  login: async (usuario, contrasena) => {
    try {
      console.log('👤 Intentando login para:', usuario);
      
      const response = await fetch(
        API_ENDPOINTS.LOGIN,
        buildFetchConfig('POST', { usuario, contrasena })
      );
      
      const data = await handleResponse(response);
      console.log('✅ Login exitoso:', data);
      return data;
    } catch (error) {
      handleError(error, 'login');
    }
  },

  // Obtener usuarios (requiere autenticación)
  getUsers: async (userId = null) => {
    try {
      const headers = userId ? { 'user-id': userId } : {};
      
      const response = await fetch(
        API_ENDPOINTS.USERS,
        buildFetchConfig('GET', null, headers)
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'obtener usuarios');
    }
  },

  // Registrar usuario (requiere admin)
  register: async (userData, adminUserId) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.REGISTER,
        buildFetchConfig('POST', userData, { 'user-id': adminUserId })
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'registrar usuario');
    }
  },
};

// ===== SESIONES =====

export const sesionesAPI = {
  // Obtener todas las sesiones
  getAll: async () => {
    try {
      console.log('📋 Obteniendo sesiones...');
      
      const response = await fetch(
        API_ENDPOINTS.SESIONES,
        buildFetchConfig('GET')
      );
      
      const sesiones = await handleResponse(response);
      console.log(`✅ ${sesiones.length} sesiones obtenidas`);
      return sesiones;
    } catch (error) {
      handleError(error, 'obtener sesiones');
    }
  },

  // Obtener sesión por ID
  getById: async (id) => {
    try {
      console.log('📋 Obteniendo sesión ID:', id);
      
      const response = await fetch(
        API_ENDPOINTS.SESION_BY_ID(id),
        buildFetchConfig('GET')
      );
      
      const sesion = await handleResponse(response);
      console.log('✅ Sesión obtenida:', sesion.nombre);
      return sesion;
    } catch (error) {
      handleError(error, 'obtener sesión por ID');
    }
  },

  // Crear nueva sesión
  create: async (sesionData) => {
    try {
      console.log('📋 Creando sesión:', sesionData.nombre);
      
      const response = await fetch(
        API_ENDPOINTS.SESIONES,
        buildFetchConfig('POST', sesionData)
      );
      
      const nuevaSesion = await handleResponse(response);
      console.log('✅ Sesión creada con ID:', nuevaSesion.id);
      return nuevaSesion;
    } catch (error) {
      handleError(error, 'crear sesión');
    }
  },

  // Actualizar sesión
  update: async (id, sesionData) => {
    try {
      console.log('📋 Actualizando sesión ID:', id);
      
      const response = await fetch(
        API_ENDPOINTS.SESION_BY_ID(id),
        buildFetchConfig('PUT', sesionData)
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'actualizar sesión');
    }
  },

  // Eliminar sesión
  delete: async (id) => {
    try {
      console.log('📋 Eliminando sesión ID:', id);
      
      const response = await fetch(
        API_ENDPOINTS.SESION_BY_ID(id),
        buildFetchConfig('DELETE')
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'eliminar sesión');
    }
  },
};

// ===== ARCHIVOS =====

export const filesAPI = {
  // Obtener archivos
  getAll: async (sesionId = null, categoria = null) => {
    try {
      let url = API_ENDPOINTS.FILES;
      const params = new URLSearchParams();
      
      if (sesionId) params.append('sesion_id', sesionId);
      if (categoria) params.append('categoria', categoria);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('📁 Obteniendo archivos:', { sesionId, categoria });
      
      const response = await fetch(url, buildFetchConfig('GET'));
      
      const archivos = await handleResponse(response);
      console.log(`✅ ${archivos.length} archivos obtenidos`);
      return archivos;
    } catch (error) {
      handleError(error, 'obtener archivos');
    }
  },

  // Subir archivo
  upload: async (file, sesionId, categoria = 'general', nombre = null) => {
    try {
      console.log('📤 Subiendo archivo:', file.name);
      
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('sesion_id', sesionId);
      formData.append('categoria', categoria);
      if (nombre) formData.append('nombre', nombre);
      
      // Para FormData, no incluir Content-Type header
      const response = await fetch(
        API_ENDPOINTS.UPLOAD_FILE,
        {
          method: 'POST',
          body: formData,
          mode: 'cors',
          credentials: 'include',
        }
      );
      
      const resultado = await handleResponse(response);
      console.log('✅ Archivo subido:', resultado.nombre_archivo);
      return resultado;
    } catch (error) {
      handleError(error, 'subir archivo');
    }
  },

  // Construir URL de archivo
  getFileUrl: (filename) => {
    return `${API_ENDPOINTS.UPLOADS}/${filename}`;
  },
};

// ===== REACCIONES/LIKES =====

export const likesAPI = {
  // Obtener likes de una sesión
  getBySesion: async (sesionId) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.LIKE_BY_SESION(sesionId),
        buildFetchConfig('GET')
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'obtener likes');
    }
  },

  // Dar like a una sesión
  addLike: async (sesionId) => {
    try {
      console.log('💖 Dando like a sesión:', sesionId);
      
      const response = await fetch(
        API_ENDPOINTS.ADD_LIKE(sesionId),
        buildFetchConfig('POST')
      );
      
      const resultado = await handleResponse(response);
      console.log('✅ Like agregado. Total:', resultado.likes);
      return resultado;
    } catch (error) {
      handleError(error, 'dar like');
    }
  },

  // Obtener todas las reacciones
  getAll: async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.LIKES,
        buildFetchConfig('GET')
      );
      
      return await handleResponse(response);
    } catch (error) {
      handleError(error, 'obtener todas las reacciones');
    }
  },
};

// ===== HEALTH CHECK =====

export const healthAPI = {
  check: async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.HEALTH,
        buildFetchConfig('GET')
      );
      
      return await handleResponse(response);
    } catch (error) {
      console.warn('⚠️ Health check falló:', error.message);
      return { status: 'error', message: error.message };
    }
  },
};

// ===== EXPORT DEFAULT =====

const API = {
  auth: authAPI,
  sesiones: sesionesAPI,
  files: filesAPI,
  likes: likesAPI,
  health: healthAPI,
};

export default API;