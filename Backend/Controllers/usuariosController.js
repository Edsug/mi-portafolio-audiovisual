// controllers/usuariosController.js - Versión mejorada con permisos
const db = require('../models/db');

// Middleware para verificar permisos
const verificarPermiso = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.headers['user-role'];
    const userId = req.headers['user-id'];
    
    console.log('🔐 Verificando permisos:', { userRole, userId, requiredRole });
    
    if (!userRole || !userId) {
      return res.status(401).json({ error: 'No autorizado - falta información de usuario' });
    }
    
    // Administradores tienen acceso a todo
    if (userRole === 'admin') {
      return next();
    }
    
    // Verificar permisos específicos
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado - se requieren permisos de administrador' });
    }
    
    // Para cambio de contraseña, permitir solo si es el mismo usuario
    if (req.route.path === '/:id/password') {
      const targetUserId = parseInt(req.params.id);
      const currentUserId = parseInt(userId);
      
      if (targetUserId !== currentUserId && userRole !== 'admin') {
        return res.status(403).json({ error: 'Solo puedes cambiar tu propia contraseña' });
      }
    }
    
    next();
  };
};

// Registrar nuevo usuario (solo admins)
const crearUsuario = (req, res) => {
  console.log('👤 Creando nuevo usuario:', req.body);
  
  const { usuario, contrasena, role } = req.body;
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  
  if (!role || !['admin', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido. Debe ser "admin" o "editor"' });
  }
  
  // Verificar que el usuario no exista
  db.get(
    `SELECT id FROM usuarios WHERE usuario = ?`,
    [usuario],
    (err, existing) => {
      if (err) {
        console.error('❌ Error verificando usuario existente:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (existing) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      
      // Crear usuario
      db.run(
        `INSERT INTO usuarios (usuario, contrasena, role) VALUES (?, ?, ?)`,
        [usuario, contrasena, role],
        function(err) {
          if (err) {
            console.error('❌ Error creando usuario:', err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log(`✅ Usuario creado: ${usuario} (${role}) - ID: ${this.lastID}`);
          res.json({ 
            id: this.lastID, 
            usuario, 
            role,
            message: 'Usuario creado exitosamente'
          });
        }
      );
    }
  );
};

// Login mejorado
const login = (req, res) => {
  console.log('🔑 Intento de login:', req.body.usuario);
  
  const { usuario, contrasena } = req.body;
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  
  db.get(
    `SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?`,
    [usuario, contrasena],
    (err, row) => {
      if (err) {
        console.error('❌ Error en login:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        console.log(`❌ Login fallido para: ${usuario}`);
        return res.status(401).json({ acceso: false, error: 'Credenciales incorrectas' });
      }
      
      console.log(`✅ Login exitoso: ${usuario} (${row.role})`);
      res.json({ 
        acceso: true, 
        id: row.id, 
        usuario: row.usuario, 
        role: row.role || 'editor' // Fallback por si no tiene role
      });
    }
  );
};

// Listar usuarios (solo admins ven todos, editores solo se ven a sí mismos)
const listarUsuarios = (req, res) => {
  const userRole = req.headers['user-role'];
  const userId = req.headers['user-id'];
  
  console.log('📋 Listando usuarios para:', { userRole, userId });
  
  let query = `SELECT id, usuario, role FROM usuarios`;
  let params = [];
  
  // Si no es admin, solo mostrar su propio usuario
  if (userRole !== 'admin') {
    query += ` WHERE id = ?`;
    params = [userId];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('❌ Error listando usuarios:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`📊 Usuarios encontrados: ${rows.length}`);
    res.json(rows);
  });
};

// Cambiar contraseña mejorado
const cambiarContrasena = (req, res) => {
  console.log('🔑 Cambio de contraseña solicitado para usuario ID:', req.params.id);
  
  const { id } = req.params;
  const { actual, nueva } = req.body;
  const userRole = req.headers['user-role'];
  
  if (!nueva) {
    return res.status(400).json({ error: 'Nueva contraseña es requerida' });
  }
  
  if (nueva.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }
  
  // Para no-admins, verificar contraseña actual
  if (userRole !== 'admin' && !actual) {
    return res.status(400).json({ error: 'Contraseña actual es requerida' });
  }
  
  // Verificar contraseña actual si se proporcionó
  if (actual || userRole !== 'admin') {
    db.get(
      `SELECT contrasena FROM usuarios WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error('❌ Error verificando contraseña actual:', err);
          return res.status(500).json({ error: err.message });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        if (userRole !== 'admin' && user.contrasena !== actual) {
          console.log('❌ Contraseña actual incorrecta');
          return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }
        
        // Actualizar contraseña
        actualizarContrasena(id, nueva, res);
      }
    );
  } else {
    // Admin cambiando contraseña sin verificar la actual
    actualizarContrasena(id, nueva, res);
  }
};

function actualizarContrasena(id, nueva, res) {
  db.run(
    `UPDATE usuarios SET contrasena = ? WHERE id = ?`,
    [nueva, id],
    function(err) {
      if (err) {
        console.error('❌ Error actualizando contraseña:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      console.log(`✅ Contraseña actualizada para usuario ID: ${id}`);
      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    }
  );
}

// Eliminar usuario (solo admins)
const eliminarUsuario = (req, res) => {
  console.log('🗑️ Eliminando usuario ID:', req.params.id);
  
  const { id } = req.params;
  
  // No permitir eliminar admin con ID 1
  if (parseInt(id) === 1) {
    return res.status(400).json({ error: 'No se puede eliminar el usuario administrador principal' });
  }
  
  // Verificar que el usuario existe antes de eliminar
  db.get(
    `SELECT usuario FROM usuarios WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) {
        console.error('❌ Error verificando usuario a eliminar:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      db.run(
        `DELETE FROM usuarios WHERE id = ?`, 
        [id], 
        function(err) {
          if (err) {
            console.error('❌ Error eliminando usuario:', err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log(`✅ Usuario eliminado: ${user.usuario} (ID: ${id})`);
          res.json({ success: true, message: `Usuario ${user.usuario} eliminado exitosamente` });
        }
      );
    }
  );
};

module.exports = {
  crearUsuario,
  login,
  listarUsuarios,
  cambiarContrasena,
  eliminarUsuario,
  verificarPermiso // Exportar middleware
};