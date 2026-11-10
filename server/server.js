import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { conectarDB, desconectarDB, estadoConexion } from './config/database.js';
import cuentaRoutes from './routes/cuentaRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carga siempre server/.env, sin importar desde qué carpeta se ejecute el comando.
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const origenesPermitidos = [
  ...new Set(
    (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean)
      .concat('http://127.0.0.1:5173')
  )
];

app.disable('x-powered-by');
app.use(cors({ origin: origenesPermitidos }));
app.use(express.json({ limit: '100kb' }));

// Comprobación rápida de disponibilidad de la API.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      estadoBaseDatos: estadoConexion(),
      fecha: new Date()
    },
    mensaje: 'API en ejecución.'
  });
});

app.use('/api', cuentaRoutes);

// Manejo centralizado de rutas inexistentes y errores.
app.use(notFound);
app.use(errorHandler);

/**
 * Inicia la API SOLO después de conectar con MongoDB.
 * Si la conexión falla, se muestra el error exacto y el proceso termina.
 */
export async function iniciar() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    console.error(
      '❌ MONGODB_URI está vacía. Completa server/.env con tu cadena de MongoDB Atlas o local antes de iniciar la API.'
    );
    process.exit(1);
  }

  try {
    await conectarDB(uri);
  } catch (error) {
    console.error(`❌ No se pudo conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }

  const servidor = app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}/api`);
    console.log(`🌐 CORS permitido para: ${origenesPermitidos.join(', ')}`);
  });

  servidor.on('error', (error) => {
    console.error(`❌ Error del servidor HTTP: ${error.message}`);
    process.exit(1);
  });

  return servidor;
}

/**
 * Cierre ordenado: desconecta MongoDB antes de terminar el proceso.
 */
async function cerrarServidor(senal) {
  console.log(`\n🛑 Señal ${senal} recibida. Cerrando servidor...`);

  try {
    if (mongoose.connection.readyState !== 0) {
      await desconectarDB();
      console.log('✅ Conexión a MongoDB cerrada.');
    }
  } catch (error) {
    console.error(`⚠️  Error al cerrar MongoDB: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => cerrarServidor('SIGINT'));
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));

// Solo arranca cuando se ejecuta directamente (no cuando los tests importan la app).
const rutaModulo = fileURLToPath(import.meta.url);
const rutaEjecutada = process.argv[1] ? path.resolve(process.argv[1]) : '';

const esEjecucionDirecta =
  process.platform === 'win32'
    ? rutaModulo.toLowerCase() === rutaEjecutada.toLowerCase()
    : rutaModulo === rutaEjecutada;

if (esEjecucionDirecta) {
  iniciar();
}

export default app;
