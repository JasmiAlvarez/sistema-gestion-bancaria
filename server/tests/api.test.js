import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import app from '../server.js';
import { conectarDB, desconectarDB } from '../config/database.js';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { convertirSolesACentimos } from '../utils/dinero.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let memoria = null;

/**
 * Deriva una base de pruebas con sufijo _test a partir de una URI de MongoDB.
 * Ejemplo: .../banco?retryWrites=true -> .../banco_test?retryWrites=true
 */
function construirUriPruebas(uri) {
  const coincidencia = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/([^?]*))?(\?.*)?$/);

  if (!coincidencia) {
    return uri;
  }

  const [, base, nombreBase = '', consulta = ''] = coincidencia;
  const nombreLimpio = (nombreBase || 'banco').replace(/_test$/, '');

  return `${base}/${nombreLimpio}_test${consulta}`;
}

function ocultarCredenciales(uri) {
  return uri.replace(/\/\/[^@/]+@/, '//***@');
}

async function saldoCentimos(numeroCuenta) {
  const cuenta = await Cuenta.findOne({ numeroCuenta }).lean();
  assert.ok(cuenta, `La cuenta ${numeroCuenta} debe existir.`);
  return cuenta.saldoCentimos;
}

before(
  async () => {
    const uriExterna = (process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || '').trim();
    let uri;

    if (uriExterna) {
      uri = construirUriPruebas(uriExterna);
      console.log(`🧪 Pruebas contra MongoDB externa: ${ocultarCredenciales(uri)}`);
    } else {
      console.log(
        '🧪 MONGODB_URI vacía. Se inicia MongoDB en memoria con replica set (base banco_test).'
      );
      memoria = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      uri = memoria.getUri('banco_test');
    }

    await conectarDB(uri);
    await Promise.all([Cuenta.init(), Transaccion.init()]);
  },
  { timeout: 600_000 }
);

beforeEach(async () => {
  await Promise.all([Transaccion.deleteMany({}), Cuenta.deleteMany({})]);

  await Cuenta.create([
    {
      titular: 'Ana Torres',
      numeroCuenta: '100001',
      saldoCentimos: convertirSolesACentimos('5000.00')
    },
    {
      titular: 'Carlos Pérez',
      numeroCuenta: '100002',
      saldoCentimos: convertirSolesACentimos('3000.00')
    },
    {
      titular: 'María López',
      numeroCuenta: '100003',
      saldoCentimos: convertirSolesACentimos('1500.00')
    }
  ]);
});

after(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await desconectarDB();

    if (memoria) {
      await memoria.stop();
    }
  }
});

/* -------------------------------------------------------------------------- */
/* Consultas                                                                   */
/* -------------------------------------------------------------------------- */

test('GET /api/cuentas devuelve únicamente cuentas activas', async () => {
  await Cuenta.updateOne({ numeroCuenta: '100003' }, { estado: 'INACTIVA' });

  const respuesta = await request(app).get('/api/cuentas');

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.ok, true);
  assert.equal(respuesta.body.data.length, 2);
  assert.deepEqual(
    respuesta.body.data.map((cuenta) => cuenta.numeroCuenta),
    ['100001', '100002']
  );
  assert.equal(respuesta.body.data[0].titular, 'Ana Torres');
});

test('GET /api/cuenta/:id devuelve la cuenta existente en soles', async () => {
  const respuesta = await request(app).get('/api/cuenta/100001');

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.ok, true);
  assert.equal(respuesta.body.data.titular, 'Ana Torres');
  assert.equal(respuesta.body.data.numeroCuenta, '100001');
  assert.equal(respuesta.body.data.saldo, 5000);
  assert.equal(respuesta.body.data.moneda, 'PEN');
  assert.equal(respuesta.body.data.estado, 'ACTIVA');
});

test('GET /api/cuenta/:id devuelve 404 si la cuenta no existe', async () => {
  const respuesta = await request(app).get('/api/cuenta/999999');

  assert.equal(respuesta.status, 404);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /no encontrada/i);
});

test('GET /api/cuenta/:id/historial devuelve un arreglo vacío sin movimientos', async () => {
  const respuesta = await request(app).get('/api/cuenta/100003/historial');

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.ok, true);
  assert.deepEqual(respuesta.body.data, []);
});

test('El historial devuelve los movimientos más recientes primero', async () => {
  await request(app)
    .post('/api/cuenta/deposito')
    .send({ numeroCuenta: '100001', monto: 100, descripcion: 'Primero' });
  await request(app)
    .post('/api/cuenta/retiro')
    .send({ numeroCuenta: '100001', monto: 50, descripcion: 'Segundo' });

  const respuesta = await request(app).get('/api/cuenta/100001/historial');

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.data.length, 2);
  assert.equal(respuesta.body.data[0].tipo, 'RETIRO');
  assert.equal(respuesta.body.data[0].descripcion, 'Segundo');
  assert.equal(respuesta.body.data[1].tipo, 'DEPOSITO');
  assert.equal(respuesta.body.data[0].cuentaOrigen.numeroCuenta, '100001');
});

/* -------------------------------------------------------------------------- */
/* Depósitos                                                                   */
/* -------------------------------------------------------------------------- */

test('Depósito válido acredita el saldo y crea la transacción', async () => {
  const respuesta = await request(app).post('/api/cuenta/deposito').send({
    numeroCuenta: '100001',
    monto: 150.5,
    descripcion: 'Depósito de prueba'
  });

  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.ok, true);
  assert.equal(respuesta.body.data.cuenta.saldo, 5150.5);
  assert.equal(respuesta.body.data.transaccion.tipo, 'DEPOSITO');
  assert.equal(respuesta.body.data.transaccion.monto, 150.5);

  assert.equal(await saldoCentimos('100001'), 515_050);

  const transaccion = await Transaccion.findOne({ tipo: 'DEPOSITO' }).lean();
  assert.ok(transaccion);
  assert.equal(transaccion.montoCentimos, 15_050);
  assert.equal(transaccion.descripcion, 'Depósito de prueba');
});

test('Depósito con monto negativo devuelve 400 y no modifica el saldo', async () => {
  const respuesta = await request(app)
    .post('/api/cuenta/deposito')
    .send({ numeroCuenta: '100001', monto: -10 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /monto/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Depósito con monto cero devuelve 400 y no modifica el saldo', async () => {
  const respuesta = await request(app)
    .post('/api/cuenta/deposito')
    .send({ numeroCuenta: '100001', monto: 0 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Depósito con más de 2 decimales devuelve 400', async () => {
  const respuesta = await request(app)
    .post('/api/cuenta/deposito')
    .send({ numeroCuenta: '100001', monto: 10.999 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.equal(await saldoCentimos('100001'), 500_000);
});

/* -------------------------------------------------------------------------- */
/* Retiros                                                                     */
/* -------------------------------------------------------------------------- */

test('Retiro válido descuenta el saldo y crea la transacción', async () => {
  const respuesta = await request(app).post('/api/cuenta/retiro').send({
    numeroCuenta: '100001',
    monto: 200.25,
    descripcion: 'Retiro de prueba'
  });

  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.ok, true);
  assert.equal(respuesta.body.data.cuenta.saldo, 4799.75);
  assert.equal(await saldoCentimos('100001'), 479_975);

  const transaccion = await Transaccion.findOne({ tipo: 'RETIRO' }).lean();
  assert.ok(transaccion);
  assert.equal(transaccion.montoCentimos, 20_025);
});

test('Retiro mayor al saldo devuelve 400 y conserva el saldo', async () => {
  const respuesta = await request(app)
    .post('/api/cuenta/retiro')
    .send({ numeroCuenta: '100001', monto: 5000.01 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /saldo insuficiente/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Retiro con monto negativo devuelve 400', async () => {
  const respuesta = await request(app)
    .post('/api/cuenta/retiro')
    .send({ numeroCuenta: '100001', monto: -5 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.equal(await saldoCentimos('100001'), 500_000);
});

/* -------------------------------------------------------------------------- */
/* Transferencias                                                              */
/* -------------------------------------------------------------------------- */

test('Transferencia válida actualiza ambos saldos y aparece en ambos historiales', async () => {
  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '100001',
    cuentaDestino: '100002',
    monto: 500,
    descripcion: 'Alquiler',
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.ok, true);
  assert.equal(respuesta.body.data.cuentaOrigen.saldo, 4500);
  assert.equal(respuesta.body.data.cuentaDestino.saldo, 3500);
  assert.equal(respuesta.body.data.transaccion.tipo, 'TRANSFERENCIA');
  assert.equal(respuesta.body.data.transaccion.monto, 500);

  assert.equal(await saldoCentimos('100001'), 450_000);
  assert.equal(await saldoCentimos('100002'), 350_000);
  assert.equal(await Transaccion.countDocuments(), 1);

  const historialOrigen = await request(app).get('/api/cuenta/100001/historial');
  assert.equal(historialOrigen.status, 200);
  assert.equal(historialOrigen.body.data.length, 1);
  assert.equal(historialOrigen.body.data[0].tipo, 'TRANSFERENCIA');
  assert.equal(historialOrigen.body.data[0].direccion, 'SALIDA');
  assert.equal(historialOrigen.body.data[0].cuentaOrigen.numeroCuenta, '100001');
  assert.equal(historialOrigen.body.data[0].cuentaDestino.numeroCuenta, '100002');
  assert.equal(historialOrigen.body.data[0].cuentaDestino.titular, 'Carlos Pérez');

  const historialDestino = await request(app).get('/api/cuenta/100002/historial');
  assert.equal(historialDestino.status, 200);
  assert.equal(historialDestino.body.data.length, 1);
  assert.equal(historialDestino.body.data[0].direccion, 'ENTRADA');
});

test('Transferencia con destino inexistente devuelve 404 sin mover saldos', async () => {
  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '100001',
    cuentaDestino: '999999',
    monto: 100,
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 404);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /no encontrada/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Transferencia con origen inexistente devuelve 404 sin mover saldos', async () => {
  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '999999',
    cuentaDestino: '100001',
    monto: 100,
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 404);
  assert.equal(respuesta.body.ok, false);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Transferencia a la misma cuenta devuelve 400', async () => {
  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '100001',
    cuentaDestino: '100001',
    monto: 100,
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /diferentes/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Transferencia con saldo insuficiente devuelve 400 y no modifica ningún saldo', async () => {
  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '100001',
    cuentaDestino: '100002',
    monto: 5000.01,
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /saldo insuficiente/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
  assert.equal(await saldoCentimos('100002'), 300_000);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Reintentar con la misma idempotencyKey no cobra dos veces', async () => {
  const idempotencyKey = randomUUID();
  const cuerpo = {
    cuentaOrigen: '100001',
    cuentaDestino: '100002',
    monto: 400.5,
    descripcion: 'Pago idempotente',
    idempotencyKey
  };

  const primera = await request(app).post('/api/cuenta/transferencia').send(cuerpo);
  assert.equal(primera.status, 201);
  assert.equal(await saldoCentimos('100001'), 459_950);
  assert.equal(await saldoCentimos('100002'), 340_050);

  const segunda = await request(app).post('/api/cuenta/transferencia').send(cuerpo);

  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.ok, true);
  assert.match(segunda.body.mensaje, /ya había sido procesada/i);
  assert.equal(segunda.body.data.transaccion.id, primera.body.data.transaccion.id);

  assert.equal(await saldoCentimos('100001'), 459_950);
  assert.equal(await saldoCentimos('100002'), 340_050);
  assert.equal(await Transaccion.countDocuments(), 1);
});

test('Una operación fallida no modifica ningún saldo ni deja movimientos', async () => {
  const saldosAntes = {
    origen: await saldoCentimos('100001'),
    destino: await saldoCentimos('100002')
  };

  const respuesta = await request(app).post('/api/cuenta/transferencia').send({
    cuentaOrigen: '100001',
    cuentaDestino: '100002',
    monto: 999999,
    idempotencyKey: randomUUID()
  });

  assert.equal(respuesta.status, 400);
  assert.equal(await saldoCentimos('100001'), saldosAntes.origen);
  assert.equal(await saldoCentimos('100002'), saldosAntes.destino);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('Una cuenta inactiva no puede recibir depósitos', async () => {
  await Cuenta.updateOne({ numeroCuenta: '100001' }, { estado: 'INACTIVA' });

  const respuesta = await request(app)
    .post('/api/cuenta/deposito')
    .send({ numeroCuenta: '100001', monto: 100 });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.ok, false);
  assert.match(respuesta.body.mensaje, /inactiva/i);
  assert.equal(await saldoCentimos('100001'), 500_000);
});
