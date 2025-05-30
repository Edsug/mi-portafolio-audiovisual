// server.js - DEBUG: Cargar rutas una por una
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables de entorno para debugging
console.log('🔧 Configuración del servidor:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', PORT);
console.log('   DATABASE_URL definida:', !!process.env.DATABASE_URL);
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'No definida');

// Verificar y crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada:', uploadsDir);
} else {
  console.log('📁 Carpeta uploads encontrada:', uploadsDir);
}

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

// ===== CARGAR RUTAS UNA POR UNA PARA DEBUGGING =====
console.log('\n🔗 Cargando rutas paso a paso...');

try {
  // RUTA 1: Usuarios
  console.log('1️⃣ Cargando usuariosRoutes...');
  const usuariosRoutes = require('./routes/usuariosRoutes');
  app.use('/api/usuarios', usuariosRoutes);
  console.log('✅ usuariosRoutes cargado correctamente');

} catch (error) {
  console.error('❌ ERROR en usuariosRoutes:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

try {
  // RUTA 2: Sesiones
  console.log('2️⃣ Cargando sesionesRoutes...');
  const sesionesRoutes = require('./routes/sesionesRoutes');
  app.use('/api/sesiones', sesionesRoutes);
  console.log('✅ sesionesRoutes cargado correctamente');

} catch (error) {
  console.error('❌ ERROR en sesionesRoutes:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

try {
  // RUTA 3: Files
  console.log('3️⃣ Cargando fileRoutes...');
  const fileRoutes = require('./routes/fileRoutes');
  app.use('/api/files', fileRoutes);
  console.log('✅ fileRoutes cargado correctamente');

} catch (error) {
  console.error('❌ ERROR en fileRoutes:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

try {
  // RUTA 4: Reacciones
  console.log('4️⃣ Cargando reaccionesRoutes...');
  const reaccionesRoutes = require('./routes/reaccionesRoutes');
  app.use('/api', reaccionesRoutes);
  console.log('✅ reaccionesRoutes cargado correctamente');

} catch (error) {
  console.error('❌ ERROR en reaccionesRoutes:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

console.log('✅ Todas las rutas cargadas exitosamente');

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor SIN base de datos por ahora
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor iniciado exitosamente en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`\n🎯 Si llegas aquí, el problema NO son las rutas`);
  console.log(`🔄 Si no llegas aquí, el error te dirá exactamente qué ruta falla\n`);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});