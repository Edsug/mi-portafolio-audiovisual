const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Asegurarse de que la carpeta 'db' exista en el root del proyecto
const dbDir = path.resolve(__dirname, '../..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ruta al archivo SQLite
const dbPath = path.join(dbDir, 'database.sqlite');

// Conexión a la base de datos
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite en', dbPath);
  }
});

db.serialize(() => {
  console.log('🔧 Configurando base de datos...');
  
  // Tabla usuarios sin campo 'role'
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL
    );
  `);

  // Agregar columna 'role' si no existe
  db.all("PRAGMA table_info('usuarios')", (err, cols) => {
    if (!err && !cols.find(c => c.name === 'role')) {
      console.log('➕ Agregando columna role a usuarios...');
      db.run(`ALTER TABLE usuarios ADD COLUMN role TEXT NOT NULL DEFAULT 'editor'`);
    }
    // Sembrar usuario admin si la tabla está vacía
    db.get(`SELECT COUNT(*) AS count FROM usuarios`, (err2, row) => {
      if (!err2 && row.count === 0) {
        db.run(
          `INSERT INTO usuarios (usuario, contrasena, role) VALUES ('admin','admin123','admin')`,
          err3 => {
            if (err3) console.error('❌ Error al crear admin:', err3.message);
            else console.log('👤 Usuario admin/admin123 creado por defecto');
          }
        );
      }
    });
  });

  // Tabla sesiones (álbumes)
  db.run(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      orden INTEGER DEFAULT 0
    );
  `, (err) => {
    if (!err) console.log('📋 Tabla sesiones configurada');
  });

  // Tabla archivos vinculados a sesión - VERSIÓN ACTUALIZADA
  db.run(`
    CREATE TABLE IF NOT EXISTS archivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nombre_archivo TEXT,
      ruta TEXT NOT NULL,
      categoria TEXT,
      tipo_archivo TEXT,
      sesion_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      file_hash TEXT,
      fecha_subida TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE
    );
  `, (err) => {
    if (!err) console.log('📁 Tabla archivos configurada');
  });

  // MIGRACIÓN: Actualizar tabla archivos existente
  db.all("PRAGMA table_info('archivos')", (err, cols) => {
    if (!err) {
      const columnNames = cols.map(col => col.name);
      
      // Agregar file_hash si no existe
      if (!columnNames.includes('file_hash')) {
        console.log('➕ Agregando columna file_hash...');
        db.run(`ALTER TABLE archivos ADD COLUMN file_hash TEXT`);
      }
      
      // Agregar nombre_archivo si no existe
      if (!columnNames.includes('nombre_archivo')) {
        console.log('➕ Agregando columna nombre_archivo...');
        db.run(`ALTER TABLE archivos ADD COLUMN nombre_archivo TEXT`, (err) => {
          if (!err) {
            // Copiar datos de 'nombre' a 'nombre_archivo'
            db.run(`UPDATE archivos SET nombre_archivo = nombre WHERE nombre_archivo IS NULL`);
            console.log('✅ Migración nombre_archivo completada');
          }
        });
      }
      
      // Agregar tipo_archivo si no existe
      if (!columnNames.includes('tipo_archivo')) {
        console.log('➕ Agregando columna tipo_archivo...');
        db.run(`ALTER TABLE archivos ADD COLUMN tipo_archivo TEXT`, (err) => {
          if (!err) {
            // Migrar de categoria a tipo_archivo con conversión
            db.run(`
              UPDATE archivos SET tipo_archivo = 
                CASE 
                  WHEN categoria = 'visual' THEN 'image/' || LOWER(SUBSTR(nombre, -3))
                  WHEN categoria = 'audiovisual' THEN 'video/' || LOWER(SUBSTR(nombre, -3))
                  ELSE 'application/octet-stream'
                END
              WHERE tipo_archivo IS NULL
            `);
            console.log('✅ Migración tipo_archivo completada');
          }
        });
      }
      
      // Agregar orden si no existe
      if (!columnNames.includes('orden')) {
        console.log('➕ Agregando columna orden...');
        db.run(`ALTER TABLE archivos ADD COLUMN orden INTEGER DEFAULT 0`, (err) => {
          if (!err) {
            // Asignar orden basado en fecha_subida
            db.run(`
              UPDATE archivos SET orden = (
                SELECT COUNT(*) FROM archivos a2 
                WHERE a2.sesion_id = archivos.sesion_id 
                AND a2.fecha_subida <= archivos.fecha_subida
              ) - 1
              WHERE orden = 0
            `);
            console.log('✅ Migración orden completada');
          }
        });
      }
    }
  });

  // Tabla reacciones (likes) por sesión - MEJORADA
  db.run(`
    CREATE TABLE IF NOT EXISTS reacciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sesion_id INTEGER NOT NULL UNIQUE,
      likes INTEGER DEFAULT 0,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE
    );
  `, (err) => {
    if (!err) {
      console.log('💖 Tabla reacciones configurada');
      
      // Crear índice único para evitar duplicados
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_reacciones_sesion 
               ON reacciones(sesion_id)`, (err) => {
        if (!err) console.log('📊 Índice único para reacciones creado');
      });
      
      // Crear trigger para actualizar fecha_actualizacion
      db.run(`
        CREATE TRIGGER IF NOT EXISTS trigger_reacciones_update 
        AFTER UPDATE ON reacciones
        BEGIN
          UPDATE reacciones SET fecha_actualizacion = CURRENT_TIMESTAMP 
          WHERE id = NEW.id;
        END;
      `, (err) => {
        if (!err) console.log('⚡ Trigger de actualización para reacciones creado');
      });
    }
  });

  // Verificar y agregar columnas faltantes en reacciones
  db.all("PRAGMA table_info('reacciones')", (err, cols) => {
    if (!err) {
      const columnNames = cols.map(col => col.name);
      
      if (!columnNames.includes('fecha_creacion')) {
        console.log('➕ Agregando fecha_creacion a reacciones...');
        db.run(`ALTER TABLE reacciones ADD COLUMN fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP`);
      }
      
      if (!columnNames.includes('fecha_actualizacion')) {
        console.log('➕ Agregando fecha_actualizacion a reacciones...');
        db.run(`ALTER TABLE reacciones ADD COLUMN fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP`);
      }
    }
  });

  // Verificar integridad de los datos después de la configuración
  setTimeout(() => {
    db.get(`SELECT COUNT(*) as sesiones FROM sesiones`, (err, result) => {
      if (!err) console.log(`📊 Total de sesiones: ${result.sesiones}`);
    });
    
    db.get(`SELECT COUNT(*) as archivos FROM archivos`, (err, result) => {
      if (!err) console.log(`📁 Total de archivos: ${result.archivos}`);
    });
    
    db.get(`SELECT COUNT(*) as reacciones FROM reacciones`, (err, result) => {
      if (!err) console.log(`💖 Total de reacciones: ${result.reacciones}`);
    });
    
    console.log('✅ Base de datos configurada correctamente\n');
  }, 1000);
});

// Función para cerrar la conexión de manera limpia
process.on('SIGINT', () => {
  console.log('\n🔒 Cerrando conexión a la base de datos...');
  db.close((err) => {
    if (err) {
      console.error('❌ Error al cerrar la base de datos:', err.message);
    } else {
      console.log('✅ Conexión a la base de datos cerrada correctamente');
    }
    process.exit(0);
  });
});

module.exports = db;