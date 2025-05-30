// server.js - Versión final para Render
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importar configuración de base de datos
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Configuración del servidor:');
console.log('   Express version:', require('express/package.json').version);
console.log('   Node version:', process.version);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', PORT);
console.log('   DATABASE_URL definida:', !!process.env.DATABASE_URL);
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'No definida');

// Verificar y crear carpeta uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada:', uploadsDir);
} else {
  console.log('📁 Carpeta uploads encontrada:', uploadsDir);
}

// CORS configurado para producción y desarrollo
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite
      'http://localhost:5174', // Vite alternate
      process.env.FRONTEND_URL,
      /\.vercel\.app$/, // Cualquier subdominio de Vercel
      /\.netlify\.app$/, // Cualquier subdominio de Netlify
    ].filter(Boolean);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origen bloqueado por CORS:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log especial para endpoints importantes
  if (req.url.includes('/api/files/subir')) {
    console.log('📤 Upload request recibido');
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Content-Length:', req.headers['content-length']);
  }
  
  next();
});

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Backend funcionando correctamente',
    version: require('./package.json').version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    console.log('📁 Sirviendo archivo:', path.basename(filePath));
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000',
    });
  }
}));

// ===== CARGAR RUTAS =====
console.log('🔗 Cargando rutas...');

try {
  const usuariosRoutes = require('./routes/usuariosRoutes');
  const sesionesRoutes = require('./routes/sesionesRoutes');
  const fileRoutes = require('./routes/fileRoutes');
  const reaccionesRoutes = require('./routes/reaccionesRoutes');
  
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/sesiones', sesionesRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api', reaccionesRoutes);
  
  console.log('✅ Todas las rutas cargadas correctamente');
  
} catch (error) {
  console.error('❌ Error al cargar rutas:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/usuarios/login',
      'GET /api/sesiones',
      'POST /api/files/subir',
      'GET /uploads/:filename'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:');
  console.error('   URL:', req.url);
  console.error('   Método:', req.method);
  console.error('   Error:', err.message);
  console.error('   Stack:', err.stack);
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// ===== INICIAR SERVIDOR =====
async function startServer() {
  try {
    // Verificar variables críticas
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no definida');
      console.error('💡 Configura la variable en .env para desarrollo local');
      console.error('💡 O en las variables de entorno de Render para producción');
      process.exit(1);
    }
    
    // Inicializar base de datos
    console.log('🚀 Iniciando servidor...');
    console.log('🔧 Conectando a base de datos...');
    await initializeDatabase();
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Servidor iniciado exitosamente`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
      console.log(`🔗 API Endpoints:`);
      console.log(`   GET  ${PORT === 3000 ? 'http://localhost:3000' : 'https://tu-app.onrender.com'}/`);
      console.log(`   GET  ${PORT === 3000 ? 'http://localhost:3000' : 'https://tu-app.onrender.com'}/health`);
      console.log(`   POST ${PORT === 3000 ? 'http://localhost:3000' : 'https://tu-app.onrender.com'}/api/usuarios/login`);
      console.log(`   GET  ${PORT === 3000 ? 'http://localhost:3000' : 'https://tu-app.onrender.com'}/api/sesiones`);
      console.log(`   POST ${PORT === 3000 ? 'http://localhost:3000' : 'https://tu-app.onrender.com'}/api/files/subir`);
      console.log(`\n🎯 Backend listo para el frontend\n`);
    });

    // Manejo de cierre limpio
    process.on('SIGTERM', () => {
      console.log('📴 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n📴 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.message.includes('database') || error.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUCIÓN PARA PROBLEMA DE BASE DE DATOS:');
      console.error('   1. Verifica que DATABASE_URL esté correcta');
      console.error('   2. Verifica que Supabase esté funcionando');
      console.error('   3. Verifica que las tablas existan en Supabase');
    }
    
    process.exit(1);
  }
}

// Iniciar servidor
startServer();