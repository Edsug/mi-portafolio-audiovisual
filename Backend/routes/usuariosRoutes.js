// routes/usuariosRoutes.js - Actualizado para PostgreSQL
const express = require('express');
const {
  crearUsuario,
  login,
  listarUsuarios,
  cambiarContrasena,
  eliminarUsuario,
  verificarPermiso
} = require('../Controllers/usuariosController');

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`👤 UsuariosRoutes: ${req.method} ${req.path}`);
  next();
});

// Función helper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rutas públicas (sin verificación de permisos)
router.post('/login', asyncHandler(login));

// Rutas que requieren autenticación
router.get('/', verificarPermiso('any'), asyncHandler(listarUsuarios));
router.put('/:id/password', verificarPermiso('any'), asyncHandler(cambiarContrasena));

// Rutas que requieren permisos de administrador
router.post('/register', verificarPermiso('admin'), asyncHandler(crearUsuario));
router.delete('/:id', verificarPermiso('admin'), asyncHandler(eliminarUsuario));

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en usuariosRoutes:', error.message);
  res.status(500).json({ 
    error: 'Error en gestión de usuarios',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

module.exports = router;