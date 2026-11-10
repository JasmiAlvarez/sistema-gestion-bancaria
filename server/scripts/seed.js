import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { conectarDB, desconectarDB } from '../config/database.js';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { convertirSolesACentimos, formatearSolesServidor } from '../utils/dinero.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CUENTAS_SEMILLA = [
  { titular: 'Ana Torres', numeroCuenta: '100001', saldo: '5000.00' },
  { titular: 'Carlos Pérez', numeroCuenta: '100002', saldo: '3000.00' },
  { titular: 'María López', numeroCuenta: '100003', saldo: '1500.00' }
];

const esReset = process.argv.includes('--reset');

async function ejecutarSeed() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    console.error(
      '❌ MONGODB_URI no está definida. Completa server/.env antes de ejecutar el seed.'
    );
    process.exitCode = 1;
    return;
  }

  try {
    await conectarDB(uri);

    for (const datos of CUENTAS_SEMILLA) {
      const saldoCentimos = convertirSolesACentimos(datos.saldo);

      if (saldoCentimos === null) {
        throw new Error(`El saldo semilla de ${datos.titular} no es válido.`);
      }

      const filtro = { numeroCuenta: datos.numeroCuenta };

      // Sin --reset se conserva el saldo actual de las cuentas existentes.
      const actualizacion = esReset
        ? {
            $set: {
              titular: datos.titular,
              moneda: 'PEN',
              estado: 'ACTIVA',
              saldoCentimos
            }
          }
        : {
            $set: {
              titular: datos.titular,
              moneda: 'PEN',
              estado: 'ACTIVA'
            },
            $setOnInsert: {
              saldoCentimos,
              fechaCreacion: new Date()
            }
          };

      const resultado = await Cuenta.updateOne(filtro, actualizacion, {
        upsert: true,
        runValidators: true
      });

      const accion = resultado.upsertedCount > 0 ? '➕ Creada' : '✔️  Actualizada';
      console.log(
        `${accion}: ${datos.numeroCuenta} | ${datos.titular} | ${formatearSolesServidor(saldoCentimos)}`
      );
    }

    if (esReset) {
      const { deletedCount } = await Transaccion.deleteMany({});
      console.log(`🧹 Movimientos eliminados: ${deletedCount}`);
    }

    const cuentas = await Cuenta.find({
      numeroCuenta: { $in: CUENTAS_SEMILLA.map((cuenta) => cuenta.numeroCuenta) }
    })
      .sort({ numeroCuenta: 1 })
      .lean();

    console.log('\n📋 Cuentas de prueba disponibles:');
    console.log('   N° cuenta | Titular        | Saldo          | Estado');

    for (const cuenta of cuentas) {
      console.log(
        `   ${cuenta.numeroCuenta}    | ${cuenta.titular.padEnd(14)} | ${formatearSolesServidor(
          cuenta.saldoCentimos
        ).padEnd(14)} | ${cuenta.estado}`
      );
    }

    if (esReset) {
      console.log(
        '\n✅ seed:reset completado. Saldos reiniciados y movimientos eliminados.'
      );
    } else {
      console.log(
        '\n✅ Seed completado. Las cuentas existentes conservaron su saldo (upsert).'
      );
    }
  } catch (error) {
    console.error(`❌ Error ejecutando el seed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await desconectarDB();
  }
}

await ejecutarSeed();
