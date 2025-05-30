// routes/reaccionesRoutes.js - Actualizado para PostgreSQL
const express = require('express');
const { 
  obtenerReacciones, 
  darLike, 
  obtenerLikesPorSesion,
  resetearLikes
} = require('../Controllers/reaccionesController');

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`💖 ReaccionesRoutes: ${req.method} ${req.path}`);
  next();
});

// Función helper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Obtener todas las reacciones
router.get('/likes', asyncHandler(obtenerReacciones));

// Dar like a una sesión específica
router.post('/like/:sesion_id', asyncHandler(darLike));

// Obtener likes de una sesión específica
router.get('/likes/:sesion_id', asyncHandler(obtenerLikesPorSesion));

// Resetear likes de una sesión (para administración)
router.delete('/likes/:sesion_id', asyncHandler(resetearLikes));

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en reaccionesRoutes:', error.message);
  res.status(500).json({ 
    error: 'Error en gestión de reacciones',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

module.exports = router;