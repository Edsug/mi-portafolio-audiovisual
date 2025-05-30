// routes/fileRoutes.js - Con debugging mejorado para PostgreSQL
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { subirArchivo, obtenerArchivos } = require('../Controllers/fileController');

// Verificar que la carpeta uploads existe
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada en fileRoutes:', uploadsDir);
}

// Configuración de multer con debugging
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Configurando destino para:', file.originalname);
    console.log('📂 Carpeta destino:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + '-' + file.originalname;
    console.log('📝 Nombre de archivo generado:', fileName);
    cb(null, fileName);
  }
});

// Configurar multer con límites y filtros
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Filtrando archivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Permitir imágenes y videos
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log('✅ Archivo aceptado');
      return cb(null, true);
    } else {
      console.log('❌ Archivo rechazado - tipo no permitido');
      return cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

const router = express.Router();

// Middleware de logging para todas las rutas
router.use((req, res, next) => {
  console.log(`🔗 FileRoutes: ${req.method} ${req.path}`);
  next();
});

// Ruta para subir archivos con manejo de errores mejorado
router.post('/subir', (req, res, next) => {
  console.log('📤 === INICIO RUTA /subir ===');
  
  upload.single('archivo')(req, res, async (err) => {
    if (err) {
      console.error('❌ Error en multer:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Archivo demasiado grande (máximo 50MB)' });
        }
        return res.status(400).json({ error: 'Error de subida: ' + err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    
    console.log('✅ Multer procesó correctamente');
    console.log('📋 Request info:');
    console.log('   - Body:', req.body);
    console.log('   - File:', req.file ? 'Presente' : 'Ausente');
    
    if (req.file) {
      console.log('📁 Archivo procesado:');
      console.log('   - Original:', req.file.originalname);
      console.log('   - Guardado como:', req.file.filename);
      console.log('   - Ruta:', req.file.path);
      console.log('   - Tamaño:', req.file.size);
      console.log('   - MIME:', req.file.mimetype);
    }
    
    try {
      // Pasar al controlador (ahora async)
      await subirArchivo(req, res);
    } catch (error) {
      console.error('❌ Error en controlador subirArchivo:', error);
      res.status(500).json({ error: 'Error al procesar archivo' });
    }
  });
});

// Ruta para obtener archivos
router.get('/', async (req, res, next) => {
  try {
    await obtenerArchivos(req, res);
  } catch (error) {
    console.error('❌ Error en obtenerArchivos:', error);
    next(error);
  }
});

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en fileRoutes:', error);
  res.status(500).json({ error: 'Error interno del servidor de archivos' });
});

console.log('🔗 FileRoutes configurado correctamente');
console.log('📁 Carpeta uploads:', uploadsDir);

module.exports = router;