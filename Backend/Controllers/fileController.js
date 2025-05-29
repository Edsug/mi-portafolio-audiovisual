// controllers/fileController.js - Con debugging completo
const db = require('../models/db');
const path = require('path');
const fs = require('fs');

const subirArchivo = (req, res) => {
  console.log('🔥 === INICIO SUBIDA DE ARCHIVO ===');
  console.log('📋 Datos recibidos:');
  console.log('   - Body:', req.body);
  console.log('   - File:', req.file ? 'SÍ' : 'NO');
  
  if (!req.file) {
    console.log('❌ No se recibió archivo');
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }

  console.log('📁 Información del archivo:');
  console.log('   - Nombre original:', req.file.originalname);
  console.log('   - Ruta temporal:', req.file.path);
  console.log('   - Tamaño:', req.file.size);
  console.log('   - Tipo MIME:', req.file.mimetype);

  const nombre_archivo = req.file.originalname;
  const sesionId = parseInt(req.body.sesion_id, 10);
  
  console.log('🎯 Parámetros procesados:');
  console.log('   - Nombre archivo:', nombre_archivo);
  console.log('   - ID sesión:', sesionId);

  if (isNaN(sesionId)) {
    console.log('❌ ID de sesión inválido');
    // Limpiar archivo temporal
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'ID de sesión inválido' });
  }

  // Verificar que el archivo temporal existe
  if (!fs.existsSync(req.file.path)) {
    console.log('❌ Archivo temporal no existe:', req.file.path);
    return res.status(500).json({ error: 'Error procesando archivo' });
  }

  // Normalizar la ruta (convertir a ruta relativa)
  let ruta = req.file.path.replace(/\\/g, '/'); // Convertir backslashes
  
  // Convertir ruta absoluta a relativa desde la carpeta uploads
  if (ruta.includes('/uploads/')) {
    ruta = 'uploads/' + ruta.split('/uploads/')[1];
  } else if (ruta.includes('\\uploads\\')) {
    ruta = 'uploads/' + ruta.split('\\uploads\\')[1];
  }
  
  console.log('📂 Ruta normalizada:', ruta);

  // Detectar tipo de archivo
  const ext = path.extname(nombre_archivo).toLowerCase();
  let tipo_archivo = req.file.mimetype || 'application/octet-stream';
  
  console.log('🔍 Detección de tipo:');
  console.log('   - Extensión:', ext);
  console.log('   - MIME type original:', req.file.mimetype);

  // Asegurar tipos correctos
  if (['.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) {
    if (!tipo_archivo.startsWith('image/')) {
      tipo_archivo = `image/${ext.substring(1) === 'jpg' ? 'jpeg' : ext.substring(1)}`;
    }
  } else if (['.mp4','.webm','.ogg','.mov','.avi'].includes(ext)) {
    if (!tipo_archivo.startsWith('video/')) {
      tipo_archivo = `video/${ext.substring(1)}`;
    }
  }

  console.log('   - Tipo final:', tipo_archivo);

  // Obtener el siguiente orden para esta sesión
  console.log('🔢 Obteniendo orden para la sesión...');
  db.get(
    `SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM archivos WHERE sesion_id = ?`,
    [sesionId],
    (err, row) => {
      if (err) {
        console.error('❌ Error obteniendo orden:', err);
        // Limpiar archivo temporal
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ error: err.message });
      }
      
      const orden = row ? row.next_orden : 0;
      console.log('📊 Orden asignado:', orden);
      
      // Insertar archivo en la base de datos
      console.log('💾 Insertando en base de datos...');
      db.run(
        `INSERT INTO archivos (
          nombre, nombre_archivo, ruta, tipo_archivo, sesion_id, orden
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre_archivo, nombre_archivo, ruta, tipo_archivo, sesionId, orden],
        function(err) {
          if (err) {
            console.error('❌ Error insertando en BD:', err);
            // Limpiar archivo temporal en caso de error
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ error: err.message });
          }
          
          console.log('✅ Archivo guardado correctamente:');
          console.log('   - ID asignado:', this.lastID);
          console.log('   - Ruta física:', req.file.path);
          console.log('   - Ruta en BD:', ruta);
          
          // Verificar que el archivo físico realmente existe
          const fileExists = fs.existsSync(req.file.path);
          console.log('📁 ¿Archivo físico existe?', fileExists ? '✅ SÍ' : '❌ NO');
          
          if (fileExists) {
            const stats = fs.statSync(req.file.path);
            console.log('📊 Tamaño del archivo:', stats.size, 'bytes');
          }
          
          const response = { 
            id: this.lastID, 
            nombre_archivo,
            ruta, 
            tipo_archivo,
            sesion_id: sesionId,
            orden,
            duplicated: false,
            debug: {
              file_exists: fileExists,
              file_path: req.file.path,
              file_size: req.file.size
            }
          };
          
          console.log('📤 Respuesta enviada:', response);
          console.log('🔥 === FIN SUBIDA DE ARCHIVO ===\n');
          
          res.json(response);
        }
      );
    }
  );
};

const obtenerArchivos = (req, res) => {
  const { sesion_id } = req.query;
  
  console.log('📋 Obteniendo archivos para sesión:', sesion_id || 'TODAS');
  
  const sql = sesion_id
    ? `SELECT 
        id, nombre_archivo, ruta, tipo_archivo, 
        sesion_id, orden, fecha_subida
       FROM archivos 
       WHERE sesion_id = ? 
       ORDER BY COALESCE(orden, 999), fecha_subida ASC`
    : `SELECT 
        id, nombre_archivo, ruta, tipo_archivo, 
        sesion_id, orden, fecha_subida
       FROM archivos 
       ORDER BY sesion_id, COALESCE(orden, 999), fecha_subida ASC`;
  
  const params = sesion_id ? [sesion_id] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ Error obteniendo archivos:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`📁 Archivos encontrados: ${rows.length}`);
    if (rows.length > 0) {
      console.log('📄 Muestra de archivos:');
      rows.slice(0, 3).forEach((row, i) => {
        const fileExists = fs.existsSync(row.ruta);
        console.log(`   ${i+1}. ${row.nombre_archivo} -> ${row.ruta} (${fileExists ? '✅' : '❌'})`);
      });
    }
    
    res.json(rows);
  });
};

module.exports = { subirArchivo, obtenerArchivos };