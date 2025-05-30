// Controllers/usuariosController.js - Convertido a PostgreSQL
const { queryMany, queryOne, insertAndGetId, query } = require('../database');

// ✅ Crear nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { usuario, contrasena, role = 'editor' } = req.body;
    
    console.log('👤 Creando usuario:', { usuario, role });
    
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    
    // Verificar que el usuario no existe
    const usuarioExistente = await queryOne(
      'SELECT * FROM usuarios WHERE usuario = $1', 
      [usuario]
    );
    
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    // Crear usuario
    const id = await insertAndGetId(
      'INSERT INTO usuarios (usuario, contrasena, role) VALUES ($1, $2, $3)',
      [usuario, contrasena, role]
    );
    
    console.log('✅ Usuario creado con ID:', id);
    
    res.status(201).json({
      id,
      usuario,
      role,
      mensaje: 'Usuario creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// ✅ Login de usuario
const login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    
    console.log('👤 Intento de login:', { usuario });
    
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    
    // Buscar usuario
    const usuarioEncontrado = await queryOne(
      'SELECT * FROM usuarios WHERE usuario = $1 AND contrasena = $2',
      [usuario, contrasena]
    );
    
    if (!usuarioEncontrado) {
      console.log('❌ Credenciales inválidas para:', usuario);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    console.log('✅ Login exitoso para:', usuario);
    
    res.json({
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      role: usuarioEncontrado.role,
      mensaje: 'Login exitoso'
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error en el login' });
  }
};

// ✅ Listar usuarios
const listarUsuarios = async (req, res) => {
  try {
    console.log('👤 Listando usuarios...');
    
    const usuarios = await queryMany(`
      SELECT id, usuario, role, created_at 
      FROM usuarios 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${usuarios.length} usuarios encontrados`);
    
    res.json(usuarios);
    
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// ✅ Cambiar contraseña
const cambiarContrasena = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;
    
    console.log('👤 Cambiando contraseña para usuario ID:', id);
    
    if (!nuevaContrasena) {
      return res.status(400).json({ error: 'Nueva contraseña es requerida' });
    }
    
    // Verificar que el usuario existe
    const usuario = await queryOne('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar contraseña
    await query(
      'UPDATE usuarios SET contrasena = $1 WHERE id = $2',
      [nuevaContrasena, id]
    );
    
    console.log('✅ Contraseña actualizada para:', usuario.usuario);
    
    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};

// ✅ Eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('👤 Eliminando usuario ID:', id);
    
    // Verificar que el usuario existe
    const usuario = await queryOne('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No permitir eliminar el último admin
    if (usuario.role === 'admin') {
      const adminCount = await queryOne(
        'SELECT COUNT(*) as count FROM usuarios WHERE role = $1',
        ['admin']
      );
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
      }
    }
    
    // Eliminar usuario
    await query('DELETE FROM usuarios WHERE id = $1', [id]);
    
    console.log('✅ Usuario eliminado:', usuario.usuario);
    
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
    
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

// ✅ Middleware para verificar permisos
const verificarPermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      // En una implementación real, esto vendría de un token JWT o sesión
      // Por simplicidad, asumo que viene en el header 'user-id'
      const userId = req.headers['user-id'];
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const usuario = await queryOne('SELECT * FROM usuarios WHERE id = $1', [userId]);
      
      if (!usuario) {
        return res.status(401).json({ error: 'Usuario no válido' });
      }
      
      // Verificar permisos
      if (permisoRequerido === 'admin' && usuario.role !== 'admin') {
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }
      
      // Agregar usuario al request para uso posterior
      req.usuario = usuario;
      next();
      
    } catch (error) {
      console.error('❌ Error en verificación de permisos:', error);
      res.status(500).json({ error: 'Error en verificación de permisos' });
    }
  };
};

module.exports = {
  crearUsuario,
  login,
  listarUsuarios,
  cambiarContrasena,
  eliminarUsuario,
  verificarPermiso
};