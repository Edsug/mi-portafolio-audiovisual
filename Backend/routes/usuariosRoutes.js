// routes/usuariosRoutes.js - Actualizado para PostgreSQL
const express = require('express');
const bcrypt = require('bcrypt'); // 👈 AGREGAR ESTA LÍNEA
const {
  crearUsuario,
  login,
  listarUsuarios,
  cambiarContrasena,
  eliminarUsuario,
  verificarPermiso
} = require('../Controllers/usuariosController');

// 👈 AGREGAR ESTA LÍNEA - Importar modelo Usuario
// Ajusta la ruta según donde tengas tu modelo
const { Usuario } = require('../models'); // o const Usuario = require('../models/Usuario');

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

// 🔧 RUTAS DE DEBUG TEMPORALES (AGREGAR AQUÍ) 👇
// ========================================

// Ruta para arreglar password de admin
router.get('/fix-admin-password', asyncHandler(async (req, res) => {
  try {
    console.log('🔧 Arreglando password de admin...');
    
    // Hashear la contraseña correctamente
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Buscar si existe admin
    let admin = await Usuario.findOne({ where: { usuario: 'admin' } });
    
    if (admin) {
      // Actualizar existente
      await admin.update({ contrasena: hashedPassword });
      console.log('✅ Admin actualizado correctamente');
      
      res.json({
        success: true,
        message: '✅ Admin actualizado correctamente',
        usuario: 'admin',
        password: 'admin123',
        action: 'updated',
        hash_preview: hashedPassword.substring(0, 20) + '...'
      });
    } else {
      // Crear nuevo admin
      admin = await Usuario.create({
        usuario: 'admin',
        contrasena: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin creado correctamente');
      
      res.json({
        success: true,
        message: '✅ Admin creado correctamente',
        usuario: 'admin',
        password: 'admin123',
        action: 'created',
        hash_preview: hashedPassword.substring(0, 20) + '...'
      });
    }
    
  } catch (error) {
    console.error('❌ Error arreglando admin:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Error al arreglar contraseña de admin'
    });
  }
}));

// Ruta para debuggear login
router.post('/debug-login', asyncHandler(async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    
    console.log('🔍 Debug login para:', usuario);
    
    // Buscar usuario en la base de datos
    const user = await Usuario.findOne({ where: { usuario } });
    
    if (!user) {
      return res.json({ 
        error: 'Usuario no encontrado',
        debug: 'Usuario no existe en BD',
        usuarios_disponibles: await Usuario.findAll({ 
          attributes: ['usuario', 'role'],
          limit: 5 
        })
      });
    }
    
    // Información de debug detallada
    const passwordInfo = {
      encontrado: true,
      usuario: user.usuario,
      role: user.role,
      password_length: user.contrasena.length,
      password_preview: user.contrasena.substring(0, 15) + '...',
      is_hashed: user.contrasena.startsWith('$2b$') || user.contrasena.startsWith('$2a$'),
      input_password: contrasena,
      bcrypt_compare: await bcrypt.compare(contrasena, user.contrasena),
      direct_compare: user.contrasena === contrasena,
      created_at: user.created_at || user.createdAt
    };
    
    console.log('🔍 Debug info:', passwordInfo);
    
    res.json({
      message: '🔍 Información de debug del login',
      debug: passwordInfo,
      recommendation: passwordInfo.bcrypt_compare ? 
        '✅ La contraseña es correcta con bcrypt' : 
        '❌ La contraseña no coincide - necesita ser hasheada'
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Error interno'
    });
  }
}));

// Ruta para ver todos los usuarios admin
router.get('/debug-admins', asyncHandler(async (req, res) => {
  try {
    const admins = await Usuario.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'usuario', 'role', 'created_at', 'createdAt']
    });
    
    res.json({
      message: '🔍 Usuarios administradores encontrados',
      count: admins.length,
      admins: admins,
      note: 'Contraseñas no se muestran por seguridad'
    });
    
  } catch (error) {
    console.error('❌ Error listando admins:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
}));

// ========================================
// 🔧 FIN DE RUTAS DE DEBUG TEMPORALES 👆

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