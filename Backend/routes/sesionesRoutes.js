// routes/sesionesRoutes.js - Actualizado para PostgreSQL
const express = require('express');
const {
  crearSesion,
  obtenerSesiones,
  obtenerSesionPorId,
  actualizarSesion,
  eliminarSesion,
  reordenarSesiones,
  reordenarArchivos,
  eliminarArchivo
} = require('../Controllers/sesionesController');

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`📋 SesionesRoutes: ${req.method} ${req.path}`);
  next();
});

// Función helper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rutas principales
router.post('/', asyncHandler(crearSesion));
router.get('/', asyncHandler(obtenerSesiones));
router.post('/reordenar', asyncHandler(reordenarSesiones));

// Rutas para gestión avanzada
router.get('/:id', asyncHandler(obtenerSesionPorId));
router.put('/:id', asyncHandler(actualizarSesion));
router.delete('/:id', asyncHandler(eliminarSesion));
router.post('/:id/reordenar-archivos', asyncHandler(reordenarArchivos));
router.delete('/archivo/:archivoId', asyncHandler(eliminarArchivo));

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en sesionesRoutes:', error.message);
  res.status(500).json({ 
    error: 'Error en gestión de sesiones',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

module.exports = router;