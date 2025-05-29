// routes/sesionesRoutes.js
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

// Rutas existentes
router.post('/', crearSesion);
router.get('/', obtenerSesiones);
router.post('/reordenar', reordenarSesiones);

// Nuevas rutas para gestión avanzada
router.get('/:id', obtenerSesionPorId);
router.put('/:id', actualizarSesion);
router.delete('/:id', eliminarSesion);
router.post('/:id/reordenar-archivos', reordenarArchivos);
router.delete('/archivo/:archivoId', eliminarArchivo);

module.exports = router;