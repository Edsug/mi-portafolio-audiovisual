// controllers/reaccionesController.js
const db = require('../models/db');

const obtenerReacciones = (req, res) => {
  console.log('💖 === OBTENIENDO REACCIONES ===');
  
  db.all(`SELECT sesion_id, likes FROM reacciones`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error obteniendo reacciones:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`📊 Reacciones encontradas: ${rows ? rows.length : 0}`);
    
    if (rows && rows.length > 0) {
      console.log('💖 Muestra de reacciones:');
      rows.forEach((row, i) => {
        console.log(`   ${i+1}. Sesión ID: ${row.sesion_id} - ${row.likes} likes`);
      });
    } else {
      console.log('⚠️ No se encontraron reacciones en la base de datos');
    }
    
    console.log('📤 Enviando respuesta de reacciones...');
    res.json(rows || []);
    console.log('💖 === FIN OBTENIENDO REACCIONES ===\n');
  });
};

const darLike = (req, res) => {
  const sesionId = req.params.sesion_id;
  
  console.log(`💖 === DANDO LIKE ===`);
  console.log(`📋 Sesión ID recibido: ${sesionId}`);
  
  // Validar que el sesionId sea un número válido
  const sesionIdNum = parseInt(sesionId, 10);
  if (isNaN(sesionIdNum)) {
    console.log(`❌ ID de sesión inválido: ${sesionId}`);
    return res.status(400).json({ error: 'ID de sesión inválido' });
  }
  
  console.log(`📋 Sesión ID convertido: ${sesionIdNum}`);
  
  // Verificar que la sesión exista antes de agregar like
  db.get(`SELECT id FROM sesiones WHERE id = ?`, [sesionIdNum], (err, sesion) => {
    if (err) {
      console.error('❌ Error verificando sesión:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!sesion) {
      console.log(`❌ Sesión no encontrada: ${sesionIdNum}`);
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    console.log(`✅ Sesión encontrada: ${sesionIdNum}`);
    
    // Usar INSERT OR REPLACE o UPSERT para SQLite
    db.run(`
      INSERT INTO reacciones (sesion_id, likes)
        VALUES (?, 1)
      ON CONFLICT(sesion_id) DO
        UPDATE SET likes = likes + 1
    `, [sesionIdNum], function(err) {
      if (err) {
        console.error('❌ Error al insertar/actualizar like:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Like agregado correctamente para sesión ${sesionIdNum}`);
      console.log(`📊 Cambios realizados: ${this.changes}`);
      
      // Obtener el nuevo contador de likes
      db.get(`SELECT likes FROM reacciones WHERE sesion_id = ?`, [sesionIdNum], (err, result) => {
        if (err) {
          console.error('❌ Error obteniendo nuevo contador:', err);
          return res.status(500).json({ error: err.message });
        }
        
        const newLikeCount = result ? result.likes : 1;
        console.log(`💖 Nuevo contador de likes: ${newLikeCount}`);
        
        res.json({ 
          success: true, 
          sesion_id: sesionIdNum,
          likes: newLikeCount,
          message: 'Like agregado correctamente'
        });
        
        console.log('💖 === FIN DANDO LIKE ===\n');
      });
    });
  });
};

// Nueva función para obtener likes de una sesión específica
const obtenerLikesPorSesion = (req, res) => {
  const sesionId = req.params.sesion_id;
  const sesionIdNum = parseInt(sesionId, 10);
  
  if (isNaN(sesionIdNum)) {
    return res.status(400).json({ error: 'ID de sesión inválido' });
  }
  
  console.log(`💖 Obteniendo likes para sesión: ${sesionIdNum}`);
  
  db.get(`
    SELECT r.likes, s.nombre as sesion_nombre
    FROM reacciones r
    LEFT JOIN sesiones s ON s.id = r.sesion_id
    WHERE r.sesion_id = ?
  `, [sesionIdNum], (err, row) => {
    if (err) {
      console.error('❌ Error obteniendo likes por sesión:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const likes = row ? row.likes : 0;
    const sesionNombre = row ? row.sesion_nombre : 'Desconocida';
    
    console.log(`💖 Likes para "${sesionNombre}": ${likes}`);
    
    res.json({
      sesion_id: sesionIdNum,
      sesion_nombre: sesionNombre,
      likes: likes
    });
  });
};

// Función para resetear likes (útil para administración)
const resetearLikes = (req, res) => {
  const sesionId = req.params.sesion_id;
  const sesionIdNum = parseInt(sesionId, 10);
  
  if (isNaN(sesionIdNum)) {
    return res.status(400).json({ error: 'ID de sesión inválido' });
  }
  
  console.log(`🔄 Reseteando likes para sesión: ${sesionIdNum}`);
  
  db.run(`DELETE FROM reacciones WHERE sesion_id = ?`, [sesionIdNum], function(err) {
    if (err) {
      console.error('❌ Error reseteando likes:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ Likes reseteados para sesión ${sesionIdNum}`);
    res.json({ 
      success: true, 
      message: 'Likes reseteados correctamente',
      sesion_id: sesionIdNum
    });
  });
};

module.exports = { 
  obtenerReacciones, 
  darLike,
  obtenerLikesPorSesion,
  resetearLikes
};