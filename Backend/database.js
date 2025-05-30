// database.js - PostgreSQL para Render + Supabase
const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Función helper para queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Query ejecutada:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    console.error('📝 Query que falló:', text);
    throw error;
  }
}

// Función para obtener un solo registro
async function queryOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Función para obtener múltiples registros
async function queryMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Función para insertar y obtener ID
async function insertAndGetId(text, params) {
  const result = await query(text + ' RETURNING id', params);
  return result.rows[0]?.id || null;
}

// Función de inicialización (verificar conexión)
async function initializeDatabase() {
  try {
    console.log('🔧 Verificando conexión a PostgreSQL...');
    
    // Test de conexión
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Conectado a PostgreSQL:', result.rows[0].current_time);
    
    // Verificar que las tablas existan
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas disponibles:', tables.rows.map(t => t.table_name));
    
    // Verificar datos iniciales
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM sesiones) as sesiones,
        (SELECT COUNT(*) FROM archivos) as archivos,
        (SELECT COUNT(*) FROM reacciones) as reacciones
    `);
    
    const counts = stats.rows[0];
    console.log('📊 Registros en base de datos:');
    console.log(`   👤 Usuarios: ${counts.usuarios}`);
    console.log(`   📋 Sesiones: ${counts.sesiones}`);
    console.log(`   📁 Archivos: ${counts.archivos}`);
    console.log(`   💖 Reacciones: ${counts.reacciones}`);
    
    console.log('✅ Base de datos PostgreSQL configurada correctamente\n');
    
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Variables de entorno:');
    console.error('   - NODE_ENV:', process.env.NODE_ENV);
    console.error('   - DATABASE_URL definida:', !!process.env.DATABASE_URL);
    
    // Si no hay DATABASE_URL, mostrar ayuda
    if (!process.env.DATABASE_URL) {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Ve a tu proyecto en Supabase');
      console.error('   2. Settings → Database → Connection string');
      console.error('   3. Copia la URL y agrégala a las variables de entorno de Render');
      console.error('   4. DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]/postgres');
    }
    
    throw error;
  }
}

// Funciones específicas del negocio (adaptadas de tu SQLite)

// USUARIOS
async function getUsuarioByCredentials(usuario, contrasena) {
  return await queryOne(
    'SELECT * FROM usuarios WHERE usuario = $1 AND contrasena = $2',
    [usuario, contrasena]
  );
}

async function createUsuario(usuario, contrasena, role = 'editor') {
  return await insertAndGetId(
    'INSERT INTO usuarios (usuario, contrasena, role) VALUES ($1, $2, $3)',
    [usuario, contrasena, role]
  );
}

// SESIONES
async function getAllSesiones() {
  return await queryMany(
    'SELECT * FROM sesiones ORDER BY orden, fecha_creacion DESC'
  );
}

async function getSesionById(id) {
  return await queryOne('SELECT * FROM sesiones WHERE id = $1', [id]);
}

async function createSesion(nombre, descripcion, orden = 0) {
  return await insertAndGetId(
    'INSERT INTO sesiones (nombre, descripcion, orden) VALUES ($1, $2, $3)',
    [nombre, descripcion, orden]
  );
}

async function updateSesion(id, nombre, descripcion, orden) {
  return await query(
    'UPDATE sesiones SET nombre = $1, descripcion = $2, orden = $3 WHERE id = $4',
    [nombre, descripcion, orden, id]
  );
}

async function deleteSesion(id) {
  return await query('DELETE FROM sesiones WHERE id = $1', [id]);
}

// ARCHIVOS
async function getArchivosBySesionId(sesionId) {
  return await queryMany(
    'SELECT * FROM archivos WHERE sesion_id = $1 ORDER BY orden, fecha_subida',
    [sesionId]
  );
}

async function createArchivo(data) {
  const { nombre, nombre_archivo, ruta, categoria, tipo_archivo, sesion_id, orden, file_hash } = data;
  return await insertAndGetId(`
    INSERT INTO archivos (nombre, nombre_archivo, ruta, categoria, tipo_archivo, sesion_id, orden, file_hash) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [nombre, nombre_archivo, ruta, categoria, tipo_archivo, sesion_id, orden || 0, file_hash]);
}

async function deleteArchivo(id) {
  return await query('DELETE FROM archivos WHERE id = $1', [id]);
}

async function updateArchivoOrden(id, orden) {
  return await query('UPDATE archivos SET orden = $1 WHERE id = $2', [orden, id]);
}

// REACCIONES
async function getReaccionesBySesionId(sesionId) {
  return await queryOne('SELECT * FROM reacciones WHERE sesion_id = $1', [sesionId]);
}

async function upsertReacciones(sesionId, likes) {
  return await query(`
    INSERT INTO reacciones (sesion_id, likes) 
    VALUES ($1, $2)
    ON CONFLICT (sesion_id) 
    DO UPDATE SET 
      likes = EXCLUDED.likes,
      fecha_actualizacion = NOW()
  `, [sesionId, likes]);
}

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  console.log('\n🔒 Cerrando conexiones a PostgreSQL...');
  try {
    await pool.end();
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar conexiones:', error.message);
  }
  process.exit(0);
});

// Exportar funciones
module.exports = {
  query,
  queryOne,
  queryMany,
  insertAndGetId,
  initializeDatabase,
  
  // Funciones específicas
  getUsuarioByCredentials,
  createUsuario,
  getAllSesiones,
  getSesionById,
  createSesion,
  updateSesion,
  deleteSesion,
  getArchivosBySesionId,
  createArchivo,
  deleteArchivo,
  updateArchivoOrden,
  getReaccionesBySesionId,
  upsertReacciones,
  
  // Pool directo para casos especiales
  pool
};