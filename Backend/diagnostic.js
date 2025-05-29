// diagnostic.js - Script para diagnosticar problemas de subida
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('🔍 === DIAGNÓSTICO DEL SISTEMA ===\n');

// 1. Verificar estructura de carpetas
console.log('📁 1. VERIFICANDO ESTRUCTURA DE CARPETAS:');
const requiredDirs = ['uploads', 'db', 'routes', 'controllers', 'models'];
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}/`);
  
  if (dir === 'uploads' && exists) {
    const files = fs.readdirSync(dir);
    console.log(`      └─ ${files.length} archivo(s) en uploads`);
    if (files.length > 0) {
      files.slice(0, 3).forEach(file => {
        const stats = fs.statSync(path.join(dir, file));
        console.log(`         - ${file} (${stats.size} bytes)`);
      });
      if (files.length > 3) {
        console.log(`         ... y ${files.length - 3} más`);
      }
    }
  }
});

// 2. Verificar archivos clave
console.log('\n📄 2. VERIFICANDO ARCHIVOS CLAVE:');
const requiredFiles = [
  'server.js',
  'package.json',
  'routes/fileRoutes.js',
  'controllers/fileController.js',
  'db/database.sqlite'
];
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 3. Verificar base de datos
console.log('\n💾 3. VERIFICANDO BASE DE DATOS:');
const dbPath = path.join(__dirname, 'db', 'database.sqlite');
if (fs.existsSync(dbPath)) {
  const db = new sqlite3.Database(dbPath);
  
  // Verificar tablas
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (!err) {
      console.log('   📋 Tablas encontradas:');
      tables.forEach(table => {
        console.log(`      ✅ ${table.name}`);
      });
      
      // Verificar estructura de tabla archivos
      db.all("PRAGMA table_info('archivos')", [], (err, columns) => {
        if (!err) {
          console.log('\n   📊 Estructura de tabla "archivos":');
          columns.forEach(col => {
            console.log(`      - ${col.name} (${col.type})`);
          });
          
          // Contar registros
          db.get("SELECT COUNT(*) as count FROM archivos", [], (err, result) => {
            if (!err) {
              console.log(`\n   📈 Total de archivos en BD: ${result.count}`);
              
              if (result.count > 0) {
                // Mostrar algunos ejemplos
                db.all("SELECT nombre_archivo, ruta, sesion_id FROM archivos LIMIT 3", [], (err, samples) => {
                  if (!err) {
                    console.log('   📄 Ejemplos de registros:');
                    samples.forEach((sample, i) => {
                      const fileExists = fs.existsSync(sample.ruta);
                      console.log(`      ${i+1}. ${sample.nombre_archivo}`);
                      console.log(`         Ruta: ${sample.ruta}`);
                      console.log(`         Sesión: ${sample.sesion_id}`);
                      console.log(`         ¿Existe físicamente? ${fileExists ? '✅' : '❌'}`);
                    });
                  }
                  db.close();
                });
              } else {
                db.close();
              }
            } else {
              db.close();
            }
          });
        } else {
          db.close();
        }
      });
    } else {
      console.log('   ❌ Error accediendo a las tablas');
      db.close();
    }
  });
} else {
  console.log('   ❌ Base de datos no encontrada');
}

// 4. Verificar package.json y dependencias
console.log('\n📦 4. VERIFICANDO DEPENDENCIAS:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'cors', 'sqlite3', 'multer'];
  
  console.log('   📋 Dependencias requeridas:');
  requiredDeps.forEach(dep => {
    const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
    const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
    const exists = hasInDeps || hasInDevDeps;
    console.log(`      ${exists ? '✅' : '❌'} ${dep} ${exists ? `(${hasInDeps || hasInDevDeps})` : ''}`);
  });
  
  // Verificar si node_modules existe
  const nodeModulesExists = fs.existsSync('node_modules');
  console.log(`   📁 node_modules: ${nodeModulesExists ? '✅' : '❌'}`);
  
  if (!nodeModulesExists) {
    console.log('   💡 Ejecuta: npm install');
  }
}

// 5. Verificar permisos
console.log('\n🔐 5. VERIFICANDO PERMISOS:');
try {
  // Intentar crear archivo de prueba en uploads
  const testFile = path.join(__dirname, 'uploads', 'test-permission.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('   ✅ Permisos de escritura en uploads/');
} catch (error) {
  console.log('   ❌ Sin permisos de escritura en uploads/');
  console.log(`      Error: ${error.message}`);
}

// 6. Verificar configuración de multer
console.log('\n⚙️ 6. VERIFICANDO CONFIGURACIÓN:');
if (fs.existsSync('routes/fileRoutes.js')) {
  const fileRoutesContent = fs.readFileSync('routes/fileRoutes.js', 'utf8');
  
  const checks = [
    { name: 'multer importado', pattern: /require.*multer/ },
    { name: 'storage configurado', pattern: /multer\.diskStorage/ },
    { name: 'destination configurado', pattern: /destination.*uploads/ },
    { name: 'ruta POST /subir', pattern: /router\.post.*subir/ }
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(fileRoutesContent);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
  });
}

// 7. Consejos de solución
setTimeout(() => {
  console.log('\n💡 CONSEJOS DE SOLUCIÓN:');
  console.log('   1. Si no se crean archivos en uploads/:');
  console.log('      - Verifica permisos de la carpeta');
  console.log('      - Verifica configuración de multer');
  console.log('      - Revisa logs del servidor al subir');
  console.log('');
  console.log('   2. Si los archivos no aparecen en la interfaz:');
  console.log('      - Verifica que se guarden en la BD');
  console.log('      - Revisa la consola del navegador');
  console.log('      - Verifica rutas de archivos estáticos');
  console.log('');
  console.log('   3. Para debugging en tiempo real:');
  console.log('      - Abre consola del navegador (F12)');
  console.log('      - Mira logs del servidor al subir archivos');
  console.log('      - Verifica requests en Network tab');
  
  console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
}, 3000);