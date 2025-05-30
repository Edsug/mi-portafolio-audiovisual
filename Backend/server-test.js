// server-test.js - Servidor básico para probar Express 4.x
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Versión de Express:', require('express/package.json').version);
console.log('🔧 Versión de Node:', process.version);

// Middleware básico
app.use(express.json());

// Rutas de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    express: require('express/package.json').version,
    node: process.version
  });
});

app.get('/test/:id', (req, res) => {
  res.json({ 
    message: 'Ruta con parámetro funcionando',
    id: req.params.id
  });
});

app.post('/test', (req, res) => {
  res.json({ message: 'POST funcionando' });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor de prueba iniciado en puerto ${PORT}`);
  console.log(`🌐 Prueba: http://localhost:${PORT}`);
  console.log(`🌐 Prueba con parámetro: http://localhost:${PORT}/test/123`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});