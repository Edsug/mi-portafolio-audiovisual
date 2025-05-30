// Controllers/reaccionesController.js - Convertido a PostgreSQL
const { queryMany, queryOne, query } = require('../database');

// ✅ Obtener todas las reacciones
const obtenerReacciones = async (req, res) => {
  try {
    console.log('💖 Obteniendo todas las reacciones...');
    
    const reacciones = await queryMany(`
      SELECT 
        r.*,
        s.nombre as sesion_nombre
      FROM reacciones r
      LEFT JOIN sesiones s ON r.sesion_id = s.id
      ORDER BY r.likes DESC, r.fecha_actualizacion DESC
    `);
    
    console.log(`✅ ${reacciones.length} reacciones encontradas`);
    
    res.json(reacciones);
    
  } catch (error) {
    console.error('❌ Error al obtener reacciones:', error);
    res.status(500).json({ error: 'Error al obtener las reacciones' });
  }
};

// ✅ Dar like a una sesión
const darLike = async (req, res) => {
  try {
    const { sesion_id } = req.params;
    
    console.log('💖 Dando like a sesión ID:', sesion_id);
    
    // Verificar que la sesión existe
    const sesion = await queryOne('SELECT * FROM sesiones WHERE id = $1', [sesion_id]);
    
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Usar UPSERT para insertar o actualizar
    await query(`
      INSERT INTO reacciones (sesion_id, likes) 
      VALUES ($1, 1)
      ON CONFLICT (sesion_id) 
      DO UPDATE SET 
        likes = reacciones.likes + 1,
        fecha_actualizacion = NOW()
    `, [sesion_id]);
    
    // Obtener el resultado actualizado
    const reaccionActualizada = await queryOne(
      'SELECT * FROM reacciones WHERE sesion_id = $1', 
      [sesion_id]
    );
    
    console.log('✅ Like agregado. Total likes:', reaccionActualizada.likes);
    
    res.json({
      sesion_id: parseInt(sesion_id),
      likes: reaccionActualizada.likes,
      mensaje: 'Like agregado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al dar like:', error);
    res.status(500).json({ error: 'Error al dar like' });
  }
};

// ✅ Obtener likes de una sesión específica
const obtenerLikesPorSesion = async (req, res) => {
  try {
    const { sesion_id } = req.params;
    
    console.log('💖 Obteniendo likes de sesión ID:', sesion_id);
    
    const reaccion = await queryOne(
      'SELECT * FROM reacciones WHERE sesion_id = $1', 
      [sesion_id]
    );
    
    const likes = reaccion ? reaccion.likes : 0;
    
    console.log(`✅ Sesión tiene ${likes} likes`);
    
    res.json({
      sesion_id: parseInt(sesion_id),
      likes,
      fecha_creacion: reaccion?.fecha_creacion || null,
      fecha_actualizacion: reaccion?.fecha_actualizacion || null
    });
    
  } catch (error) {
    console.error('❌ Error al obtener likes:', error);
    res.status(500).json({ error: 'Error al obtener los likes' });
  }
};

// ✅ Resetear likes de una sesión (para administración)
const resetearLikes = async (req, res) => {
  try {
    const { sesion_id } = req.params;
    
    console.log('💖 Reseteando likes de sesión ID:', sesion_id);
    
    // Verificar que la sesión existe
    const sesion = await queryOne('SELECT * FROM sesiones WHERE id = $1', [sesion_id]);
    
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Resetear likes a 0
    await query(`
      INSERT INTO reacciones (sesion_id, likes) 
      VALUES ($1, 0)
      ON CONFLICT (sesion_id) 
      DO UPDATE SET 
        likes = 0,
        fecha_actualizacion = NOW()
    `, [sesion_id]);
    
    console.log('✅ Likes reseteados a 0');
    
    res.json({
      sesion_id: parseInt(sesion_id),
      likes: 0,
      mensaje: 'Likes reseteados exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al resetear likes:', error);
    res.status(500).json({ error: 'Error al resetear los likes' });
  }
};

module.exports = {
  obtenerReacciones,
  darLike,
  obtenerLikesPorSesion,
  resetearLikes
};