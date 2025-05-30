// Controllers/sesionesController.js - Convertido a PostgreSQL
const { 
  queryMany, 
  queryOne, 
  insertAndGetId, 
  query 
} = require('../database');

// ✅ Crear una nueva sesión
const crearSesion = async (req, res) => {
  try {
    const { nombre, descripcion, orden = 0 } = req.body;
    
    console.log('📋 Creando sesión:', { nombre, descripcion, orden });
    
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la sesión es requerido' });
    }
    
    // Insertar nueva sesión
    const id = await insertAndGetId(
      'INSERT INTO sesiones (nombre, descripcion, orden) VALUES ($1, $2, $3)',
      [nombre.trim(), descripcion || '', orden]
    );
    
    console.log('✅ Sesión creada con ID:', id);
    
    res.status(201).json({
      id,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      orden,
      fecha_creacion: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error al crear sesión:', error);
    res.status(500).json({ error: 'Error al crear la sesión' });
  }
};

// ✅ Obtener todas las sesiones
const obtenerSesiones = async (req, res) => {
  try {
    console.log('📋 Obteniendo todas las sesiones...');
    
    const sesiones = await queryMany(`
      SELECT 
        s.*,
        COUNT(a.id) as total_archivos,
        COALESCE(r.likes, 0) as likes
      FROM sesiones s
      LEFT JOIN archivos a ON s.id = a.sesion_id
      LEFT JOIN reacciones r ON s.id = r.sesion_id
      GROUP BY s.id, r.likes
      ORDER BY s.orden ASC, s.fecha_creacion DESC
    `);
    
    console.log(`✅ ${sesiones.length} sesiones encontradas`);
    
    res.json(sesiones);
    
  } catch (error) {
    console.error('❌ Error al obtener sesiones:', error);
    res.status(500).json({ error: 'Error al obtener las sesiones' });
  }
};

// ✅ Obtener sesión por ID con sus archivos
const obtenerSesionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📋 Obteniendo sesión ID:', id);
    
    // Obtener sesión
    const sesion = await queryOne('SELECT * FROM sesiones WHERE id = $1', [id]);
    
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Obtener archivos de la sesión
    const archivos = await queryMany(
      'SELECT * FROM archivos WHERE sesion_id = $1 ORDER BY orden ASC, fecha_subida ASC',
      [id]
    );
    
    // Obtener reacciones
    const reacciones = await queryOne('SELECT * FROM reacciones WHERE sesion_id = $1', [id]);
    
    console.log(`✅ Sesión encontrada con ${archivos.length} archivos`);
    
    res.json({
      ...sesion,
      archivos,
      likes: reacciones?.likes || 0
    });
    
  } catch (error) {
    console.error('❌ Error al obtener sesión:', error);
    res.status(500).json({ error: 'Error al obtener la sesión' });
  }
};

// ✅ Actualizar sesión
const actualizarSesion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, orden } = req.body;
    
    console.log('📋 Actualizando sesión ID:', id, { nombre, descripcion, orden });
    
    // Verificar que la sesión existe
    const sesionExistente = await queryOne('SELECT * FROM sesiones WHERE id = $1', [id]);
    
    if (!sesionExistente) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Actualizar sesión
    await query(
      'UPDATE sesiones SET nombre = $1, descripcion = $2, orden = $3 WHERE id = $4',
      [nombre || sesionExistente.nombre, descripcion || sesionExistente.descripcion, orden || sesionExistente.orden, id]
    );
    
    // Obtener sesión actualizada
    const sesionActualizada = await queryOne('SELECT * FROM sesiones WHERE id = $1', [id]);
    
    console.log('✅ Sesión actualizada correctamente');
    
    res.json(sesionActualizada);
    
  } catch (error) {
    console.error('❌ Error al actualizar sesión:', error);
    res.status(500).json({ error: 'Error al actualizar la sesión' });
  }
};

// ✅ Eliminar sesión
const eliminarSesion = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📋 Eliminando sesión ID:', id);
    
    // Verificar que la sesión existe
    const sesion = await queryOne('SELECT * FROM sesiones WHERE id = $1', [id]);
    
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // PostgreSQL manejará la eliminación en cascada automáticamente
    // gracias a las foreign keys definidas en el schema
    await query('DELETE FROM sesiones WHERE id = $1', [id]);
    
    console.log('✅ Sesión eliminada correctamente');
    
    res.json({ message: 'Sesión eliminada correctamente', id });
    
  } catch (error) {
    console.error('❌ Error al eliminar sesión:', error);
    res.status(500).json({ error: 'Error al eliminar la sesión' });
  }
};

// ✅ Reordenar sesiones
const reordenarSesiones = async (req, res) => {
  try {
    const { sesiones } = req.body; // Array de { id, orden }
    
    console.log('📋 Reordenando sesiones:', sesiones);
    
    if (!Array.isArray(sesiones)) {
      return res.status(400).json({ error: 'Se esperaba un array de sesiones' });
    }
    
    // Actualizar orden de cada sesión
    for (const { id, orden } of sesiones) {
      await query('UPDATE sesiones SET orden = $1 WHERE id = $2', [orden, id]);
    }
    
    console.log('✅ Sesiones reordenadas correctamente');
    
    res.json({ message: 'Sesiones reordenadas correctamente' });
    
  } catch (error) {
    console.error('❌ Error al reordenar sesiones:', error);
    res.status(500).json({ error: 'Error al reordenar las sesiones' });
  }
};

// ✅ Reordenar archivos dentro de una sesión
const reordenarArchivos = async (req, res) => {
  try {
    const { id } = req.params; // sesion_id
    const { archivos } = req.body; // Array de { id, orden }
    
    console.log('📋 Reordenando archivos de sesión ID:', id, archivos);
    
    if (!Array.isArray(archivos)) {
      return res.status(400).json({ error: 'Se esperaba un array de archivos' });
    }
    
    // Actualizar orden de cada archivo
    for (const { id: archivoId, orden } of archivos) {
      await query('UPDATE archivos SET orden = $1 WHERE id = $2 AND sesion_id = $3', [orden, archivoId, id]);
    }
    
    console.log('✅ Archivos reordenados correctamente');
    
    res.json({ message: 'Archivos reordenados correctamente' });
    
  } catch (error) {
    console.error('❌ Error al reordenar archivos:', error);
    res.status(500).json({ error: 'Error al reordenar los archivos' });
  }
};

// ✅ Eliminar archivo específico
const eliminarArchivo = async (req, res) => {
  try {
    const { archivoId } = req.params;
    
    console.log('📋 Eliminando archivo ID:', archivoId);
    
    // Obtener información del archivo antes de eliminarlo
    const archivo = await queryOne('SELECT * FROM archivos WHERE id = $1', [archivoId]);
    
    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Eliminar archivo de la base de datos
    await query('DELETE FROM archivos WHERE id = $1', [archivoId]);
    
    // TODO: También eliminar el archivo físico del servidor
    // const fs = require('fs');
    // if (fs.existsSync(archivo.ruta)) {
    //   fs.unlinkSync(archivo.ruta);
    // }
    
    console.log('✅ Archivo eliminado correctamente');
    
    res.json({ message: 'Archivo eliminado correctamente', archivo });
    
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error);
    res.status(500).json({ error: 'Error al eliminar el archivo' });
  }
};

module.exports = {
  crearSesion,
  obtenerSesiones,
  obtenerSesionPorId,
  actualizarSesion,
  eliminarSesion,
  reordenarSesiones,
  reordenarArchivos,
  eliminarArchivo
};