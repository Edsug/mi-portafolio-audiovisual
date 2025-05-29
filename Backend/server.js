// server.js - Con debugging para subida de archivos
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// Rutas
const sesionesRoutes   = require('./routes/sesionesRoutes');
const fileRoutes       = require('./routes/fileRoutes');
const reaccionesRoutes = require('./routes/reaccionesRoutes');
const usuariosRoutes   = require('./routes/usuariosRoutes');

const app = express();
const PORT = 3000;

// Verificar y crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada:', uploadsDir);
} else {
  console.log('📁 Carpeta uploads encontrada:', uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para debugging
app.use((req, res, next) => {
  if (req.url.includes('/api/files/subir')) {
    console.log(`📤 ${req.method} ${req.url}`);
    console.log('📋 Headers:', req.headers);
  }
  next();
});

// IMPORTANTE: Servir archivos estáticos ANTES de las rutas de API
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    console.log('📁 Sirviendo archivo:', filePath);
  }
}));

// Rutas de la API
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', reaccionesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Archivos servidos desde: ${uploadsDir}`);
  console.log(`🔗 Endpoint de subida: http://localhost:${PORT}/api/files/subir`);
  
  // Verificar que las rutas importantes existan
  console.log('🔍 Verificando rutas...');
  console.log('   /api/files/subir - Subida de archivos');
  console.log('   /api/sesiones - Gestión de álbumes');
  console.log('   /uploads - Archivos estáticos');
});