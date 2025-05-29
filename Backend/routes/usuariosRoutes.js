// routes/usuariosRoutes.js - Con sistema de permisos
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

// Rutas públicas (sin verificación de permisos)
router.post('/login', login);

// Rutas que requieren autenticación
router.get('/', verificarPermiso('any'), listarUsuarios);
router.put('/:id/password', verificarPermiso('any'), cambiarContrasena);

// Rutas que requieren permisos de administrador
router.post('/register', verificarPermiso('admin'), crearUsuario);
router.delete('/:id', verificarPermiso('admin'), eliminarUsuario);

module.exports = router;