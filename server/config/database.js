import mongoose from 'mongoose';

/**
 * Opciones de conexión.
 * Un tiempo de espera razonable permite mostrar un error claro si Atlas
 * no responde (por ejemplo, por una IP no autorizada en Network Access).
 */
const OPCIONES_CONEXION = {
  serverSelectionTimeoutMS: 20_000,
  connectTimeoutMS: 20_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10
};

/**
 * Conecta la aplicación a MongoDB.
 * Funciona igual con MongoDB Atlas o con un MongoDB local configurado
 * como replica set (necesario para las transacciones multidocumento).
 *
 * @param {string} uri Cadena de conexión de MongoDB.
 * @returns {Promise<import('mongoose').Connection>}
 */
export async function conectarDB(uri) {
  const cadena = typeof uri === 'string' ? uri.trim() : '';

  if (!cadena) {
    throw new Error(
      'MONGODB_URI no está definida. Crea server/.env y coloca tu cadena de conexión de MongoDB Atlas o local.'
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(cadena, OPCIONES_CONEXION);

  const { host, name } = mongoose.connection;
  console.log(`✅ MongoDB conectado. Host: ${host} | Base de datos: ${name}`);

  await verificarReplicaSet();

  return mongoose.connection;
}

/**
 * Comprueba si la conexión pertenece a un replica set.
 * Las transacciones de MongoDB solo funcionan sobre replica sets o sharded clusters.
 */
async function verificarReplicaSet() {
  try {
    const info = await mongoose.connection.db.admin().command({ hello: 1 });

    if (info.setName) {
      console.log(
        `🔁 Replica set detectado: ${info.setName}. Transacciones multidocumento disponibles.`
      );
    } else {
      console.warn(
        '⚠️  La conexión NO es un replica set. Las transacciones fallarán. ' +
          'Atlas M0 ya es un replica set; para MongoDB local usa --replSet rs0.'
      );
    }
  } catch (error) {
    console.warn(`⚠️  No se pudo verificar el replica set: ${error.message}`);
  }
}

/**
 * Cierra la conexión con MongoDB de forma segura.
 */
export async function desconectarDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Devuelve un texto legible con el estado actual de la conexión.
 * @returns {string}
 */
export function estadoConexion() {
  const estados = {
    0: 'desconectado',
    1: 'conectado',
    2: 'conectando',
    3: 'desconectando'
  };

  return estados[mongoose.connection.readyState] ?? 'desconocido';
}
