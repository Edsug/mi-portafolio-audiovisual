// controllers/sesionesController.js
const db = require('../models/db');
const fs = require('fs');
const path = require('path');

const crearSesion = (req, res) => {
  const { nombre, descripcion } = req.body;
  db.run(
    `INSERT INTO sesiones (nombre, descripcion) VALUES (?, ?)`,
    [nombre, descripcion],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, nombre, descripcion });
    }
  );
};

const obtenerSesiones = (req, res) => {
  console.log('📋 === OBTENIENDO SESIONES ===');
  
  db.all(
    `SELECT 
       s.id, s.nombre, s.descripcion, s.fecha_creacion, s.orden,
       COALESCE(r.likes, 0) AS likes,
       (SELECT COUNT(*) FROM archivos a WHERE a.sesion_id = s.id) AS archivo_count
     FROM sesiones s
     LEFT JOIN reacciones r ON r.sesion_id = s.id
     ORDER BY s.orden ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Error obteniendo sesiones:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`📊 Sesiones encontradas: ${rows ? rows.length : 0}`);
      
      if (rows && rows.length > 0) {
        console.log('📄 Muestra de sesiones:');
        rows.forEach((row, i) => {
          console.log(`   ${i+1}. ${row.nombre} (ID: ${row.id}) - ${row.archivo_count} archivos`);
        });
      } else {
        console.log('⚠️ No se encontraron sesiones en la base de datos');
        
        // Verificar si existen sesiones sin JOIN
        db.all('SELECT * FROM sesiones', [], (err2, allSessions) => {
          if (!err2) {
            console.log(`🔍 Total sesiones sin JOIN: ${allSessions ? allSessions.length : 0}`);
            if (allSessions && allSessions.length > 0) {
              console.log('📋 Sesiones básicas encontradas:');
              allSessions.forEach(s => {
                console.log(`   - ID: ${s.id}, Nombre: ${s.nombre}`);
              });
            }
          }
        });
      }
      
      console.log('📤 Enviando respuesta...');
      res.json(rows || []);
      console.log('📋 === FIN OBTENIENDO SESIONES ===\n');
    }
  );
};

// Obtener una sesión específica con sus archivos
const obtenerSesionPorId = (req, res) => {
  const { id } = req.params;
  
  console.log('Obteniendo sesión con ID:', id); // Debug
  
  // Verificar que el ID sea válido
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID de sesión inválido' });
  }
  
  // Obtener datos de la sesión
  db.get(
    `SELECT 
       s.id, s.nombre, s.descripcion, s.fecha_creacion, s.orden,
       COALESCE(r.likes, 0) AS likes
     FROM sesiones s
     LEFT JOIN reacciones r ON r.sesion_id = s.id
     WHERE s.id = ?`,
    [parseInt(id)],
    (err, sesion) => {
      if (err) {
        console.error('Error obteniendo sesión:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!sesion) {
        console.log('Sesión no encontrada con ID:', id);
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }
      
      console.log('Sesión encontrada:', sesion); // Debug
      
      // Obtener archivos de la sesión
      db.all(
        `SELECT 
          id, 
          COALESCE(nombre_archivo, nombre) as nombre_archivo, 
          ruta, 
          COALESCE(tipo_archivo, 
            CASE 
              WHEN categoria = 'visual' THEN 'image/jpeg'
              WHEN categoria = 'audiovisual' THEN 'video/mp4'
              ELSE 'application/octet-stream'
            END
          ) as tipo_archivo,
          COALESCE(orden, 999) as orden, 
          fecha_subida 
         FROM archivos 
         WHERE sesion_id = ? 
         ORDER BY orden ASC, fecha_subida ASC`,
        [parseInt(id)],
        (err, archivos) => {
          if (err) {
            console.error('Error obteniendo archivos:', err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log(`📁 Archivos encontrados para sesión ${id}:`, archivos ? archivos.length : 0);
          
          res.json({
            ...sesion,
            archivos: archivos || []
          });
        }
      );
    }
  );
};

// Actualizar información de la sesión
const actualizarSesion = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  
  db.run(
    `UPDATE sesiones SET nombre = ?, descripcion = ? WHERE id = ?`,
    [nombre, descripcion, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
      res.json({ success: true, message: 'Sesión actualizada correctamente' });
    }
  );
};

// Eliminar sesión completa
const eliminarSesion = (req, res) => {
  const { id } = req.params;
  
  // Primero obtener todos los archivos para eliminar físicamente
  db.all(
    `SELECT ruta FROM archivos WHERE sesion_id = ?`,
    [id],
    (err, archivos) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Eliminar archivos físicos
      archivos.forEach(archivo => {
        const rutaCompleta = path.join(__dirname, '..', archivo.ruta);
        if (fs.existsSync(rutaCompleta)) {
          fs.unlinkSync(rutaCompleta);
        }
      });
      
      // Eliminar registros de la base de datos en el orden correcto
      db.serialize(() => {
        db.run(`DELETE FROM reacciones WHERE sesion_id = ?`, [id]);
        db.run(`DELETE FROM archivos WHERE sesion_id = ?`, [id]);
        db.run(`DELETE FROM sesiones WHERE id = ?`, [id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
          res.json({ success: true, message: 'Sesión eliminada correctamente' });
        });
      });
    }
  );
};

const reordenarSesiones = (req, res) => {
  const { orden } = req.body; // ej. [3,1,2]
  const stmt = db.prepare(`UPDATE sesiones SET orden = ? WHERE id = ?`);
  orden.forEach((id, idx) => stmt.run(idx, id));
  stmt.finalize(err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

// Reordenar archivos dentro de una sesión
const reordenarArchivos = (req, res) => {
  const { id } = req.params; // sesion_id
  const { orden } = req.body; // array de archivo_ids en nuevo orden
  
  console.log(`Reordenando archivos para sesión ${id}:`, orden);
  
  const stmt = db.prepare(`UPDATE archivos SET orden = ? WHERE id = ? AND sesion_id = ?`);
  orden.forEach((archivoId, idx) => {
    stmt.run(idx, archivoId, id);
  });
  
  stmt.finalize(err => {
    if (err) {
      console.error('Error reordenando archivos:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Archivos reordenados correctamente');
    res.json({ success: true, message: 'Orden de archivos actualizado' });
  });
};

// Eliminar archivo individual
const eliminarArchivo = (req, res) => {
  const { archivoId } = req.params;
  
  // Obtener información del archivo antes de eliminarlo
  db.get(
    `SELECT ruta FROM archivos WHERE id = ?`,
    [archivoId],
    (err, archivo) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado' });
      
      // Eliminar archivo físico
      const rutaCompleta = path.join(__dirname, '..', archivo.ruta);
      if (fs.existsSync(rutaCompleta)) {
        fs.unlinkSync(rutaCompleta);
      }
      
      // Eliminar registro de la base de datos
      db.run(
        `DELETE FROM archivos WHERE id = ?`,
        [archivoId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: 'Archivo eliminado correctamente' });
        }
      );
    }
  );
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