// routes/reaccionesRoutes.js
const express = require('express');
const { 
  obtenerReacciones, 
  darLike, 
  obtenerLikesPorSesion,
  resetearLikes
} = require('../Controllers/reaccionesController');

const router = express.Router();

// Obtener todas las reacciones
router.get('/likes', obtenerReacciones);

// Dar like a una sesión específica
router.post('/like/:sesion_id', darLike);

// Obtener likes de una sesión específica
router.get('/likes/:sesion_id', obtenerLikesPorSesion);

// Resetear likes de una sesión (para administración)
router.delete('/likes/:sesion_id', resetearLikes);

module.exports = router;