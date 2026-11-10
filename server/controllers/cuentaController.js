import mongoose from 'mongoose';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import {
  convertirSolesACentimos,
  convertirCentimosASoles,
  formatearSolesServidor
} from '../utils/dinero.js';

const PATRON_CUENTA = /^\d{6}$/;

/* -------------------------------------------------------------------------- */
/* Validaciones del servidor (nunca confiar en el navegador)                   */
/* -------------------------------------------------------------------------- */

function validarNumeroCuenta(valor, campo = 'número de cuenta') {
  const numero = String(valor ?? '').trim();

  if (!PATRON_CUENTA.test(numero)) {
    throw new ApiError(400, `El ${campo} debe tener exactamente 6 dígitos.`);
  }

  return numero;
}

function validarMonto(valor) {
  const centimos = convertirSolesACentimos(valor);

  if (centimos === null) {
    throw new ApiError(
      400,
      'El monto debe ser un número mayor a 0 y tener como máximo 2 decimales.'
    );
  }

  return centimos;
}

function validarDescripcion(valor) {
  if (valor === undefined || valor === null) {
    return '';
  }

  if (typeof valor !== 'string') {
    throw new ApiError(400, 'La descripción debe ser un texto.');
  }

  const descripcion = valor.trim();

  if (descripcion.length > 200) {
    throw new ApiError(400, 'La descripción no puede superar los 200 caracteres.');
  }

  return descripcion;
}

function validarIdempotencyKey(valor) {
  if (valor === undefined || valor === null) {
    return undefined;
  }

  const clave = String(valor).trim();

  if (!clave) {
    return undefined;
  }

  if (clave.length > 100) {
    throw new ApiError(400, 'La clave de idempotencia no puede superar los 100 caracteres.');
  }

  return clave;
}

/* -------------------------------------------------------------------------- */
/* Serialización de respuestas (montos siempre en soles)                       */
/* -------------------------------------------------------------------------- */

function serializarCuenta(cuenta) {
  if (!cuenta) {
    return null;
  }

  return {
    id: String(cuenta._id),
    titular: cuenta.titular,
    numeroCuenta: cuenta.numeroCuenta,
    saldo: convertirCentimosASoles(cuenta.saldoCentimos),
    moneda: cuenta.moneda,
    estado: cuenta.estado,
    fechaCreacion: cuenta.fechaCreacion
  };
}

function referenciaCuenta(cuenta) {
  if (!cuenta || !cuenta.numeroCuenta) {
    return null;
  }

  return {
    numeroCuenta: cuenta.numeroCuenta,
    titular: cuenta.titular ?? null
  };
}

function calcularDireccion(transaccion, numeroCuentaConsulta) {
  if (transaccion.tipo === 'DEPOSITO') {
    return 'ENTRADA';
  }

  if (transaccion.tipo === 'RETIRO') {
    return 'SALIDA';
  }

  return transaccion.cuentaOrigen?.numeroCuenta === numeroCuentaConsulta ? 'SALIDA' : 'ENTRADA';
}

function serializarTransaccion(transaccion, numeroCuentaConsulta) {
  return {
    id: String(transaccion._id),
    tipo: transaccion.tipo,
    monto: convertirCentimosASoles(transaccion.montoCentimos),
    descripcion: transaccion.descripcion || '',
    fecha: transaccion.fecha,
    cuentaOrigen: referenciaCuenta(transaccion.cuentaOrigen),
    cuentaDestino: referenciaCuenta(transaccion.cuentaDestino),
    direccion: calcularDireccion(transaccion, numeroCuentaConsulta)
  };
}

/* -------------------------------------------------------------------------- */
/* Consultas auxiliares                                                        */
/* -------------------------------------------------------------------------- */

async function buscarCuentaPorNumero(numero, session = null) {
  let consulta = Cuenta.findOne({ numeroCuenta: numero });

  if (session) {
    consulta = consulta.session(session);
  }

  const cuenta = await consulta;

  if (!cuenta) {
    throw new ApiError(404, `Cuenta ${numero} no encontrada.`);
  }

  return cuenta;
}

function exigirCuentaActiva(cuenta) {
  if (cuenta.estado !== 'ACTIVA') {
    throw new ApiError(400, `La cuenta ${cuenta.numeroCuenta} está inactiva.`);
  }

  return cuenta;
}

async function buscarCuentaActiva(numero, session = null) {
  const cuenta = await buscarCuentaPorNumero(numero, session);
  return exigirCuentaActiva(cuenta);
}

function obtenerTransaccionPopulada(id) {
  return Transaccion.findById(id)
    .populate('cuentaOrigen', 'numeroCuenta titular')
    .populate('cuentaDestino', 'numeroCuenta titular')
    .lean();
}

function buscarTransaccionPorClave(idempotencyKey) {
  return Transaccion.findOne({ idempotencyKey })
    .populate('cuentaOrigen', 'numeroCuenta titular')
    .populate('cuentaDestino', 'numeroCuenta titular')
    .lean();
}

async function responderTransferenciaExistente(res, transaccion, numeroCuentaConsulta) {
  const [origen, destino] = await Promise.all([
    Cuenta.findOne({ numeroCuenta: transaccion.cuentaOrigen?.numeroCuenta }).lean(),
    Cuenta.findOne({ numeroCuenta: transaccion.cuentaDestino?.numeroCuenta }).lean()
  ]);

  return res.status(200).json({
    ok: true,
    data: {
      cuentaOrigen: serializarCuenta(origen),
      cuentaDestino: serializarCuenta(destino),
      transaccion: serializarTransaccion(transaccion, numeroCuentaConsulta)
    },
    mensaje:
      'La transferencia ya había sido procesada con esta clave de idempotencia. No se realizó un nuevo cobro.'
  });
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/cuentas
 * Lista auxiliar para el selector del frontend.
 */
export const listarCuentas = asyncHandler(async (req, res) => {
  const cuentas = await Cuenta.find({ estado: 'ACTIVA' })
    .select('numeroCuenta titular')
    .sort({ numeroCuenta: 1 })
    .lean();

  res.status(200).json({
    ok: true,
    data: cuentas.map((cuenta) => ({
      numeroCuenta: cuenta.numeroCuenta,
      titular: cuenta.titular
    })),
    mensaje: 'Cuentas obtenidas correctamente.'
  });
});

/**
 * GET /api/cuenta/:id
 * El parámetro :id es el número de cuenta.
 */
export const obtenerCuenta = asyncHandler(async (req, res) => {
  const numeroCuenta = validarNumeroCuenta(req.params.id);

  const cuenta = await Cuenta.findOne({ numeroCuenta }).lean();

  if (!cuenta) {
    throw new ApiError(404, `Cuenta ${numeroCuenta} no encontrada.`);
  }

  res.status(200).json({
    ok: true,
    data: serializarCuenta(cuenta),
    mensaje: 'Cuenta obtenida correctamente.'
  });
});

/**
 * GET /api/cuenta/:id/historial
 * Últimos 20 movimientos, más recientes primero.
 */
export const obtenerHistorial = asyncHandler(async (req, res) => {
  const numeroCuenta = validarNumeroCuenta(req.params.id);
  const cuenta = await Cuenta.findOne({ numeroCuenta }).lean();

  if (!cuenta) {
    throw new ApiError(404, `Cuenta ${numeroCuenta} no encontrada.`);
  }

  const transacciones = await Transaccion.find({
    $or: [{ cuentaOrigen: cuenta._id }, { cuentaDestino: cuenta._id }]
  })
    .sort({ fecha: -1, _id: -1 })
    .limit(20)
    .populate('cuentaOrigen', 'numeroCuenta titular')
    .populate('cuentaDestino', 'numeroCuenta titular')
    .lean();

  res.status(200).json({
    ok: true,
    data: transacciones.map((transaccion) =>
      serializarTransaccion(transaccion, numeroCuenta)
    ),
    mensaje: 'Historial obtenido correctamente.'
  });
});

/**
 * POST /api/cuenta/deposito
 * body: { numeroCuenta, monto, descripcion? }
 */
export const depositar = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const numeroCuenta = validarNumeroCuenta(body.numeroCuenta);
  const montoCentimos = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);

  let transaccionId = null;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cuenta = await buscarCuentaActiva(numeroCuenta, session);

      const actualizacion = await Cuenta.updateOne(
        { _id: cuenta._id, estado: 'ACTIVA' },
        { $inc: { saldoCentimos: montoCentimos } },
        { session }
      );

      if (actualizacion.modifiedCount !== 1) {
        throw new ApiError(400, 'No se pudo actualizar el saldo de la cuenta.');
      }

      const [transaccion] = await Transaccion.create(
        [
          {
            tipo: 'DEPOSITO',
            montoCentimos,
            cuentaOrigen: cuenta._id,
            cuentaDestino: null,
            descripcion
          }
        ],
        { session }
      );

      transaccionId = transaccion._id;
    });
  } finally {
    await session.endSession();
  }

  const [cuentaActualizada, transaccion] = await Promise.all([
    Cuenta.findOne({ numeroCuenta }).lean(),
    obtenerTransaccionPopulada(transaccionId)
  ]);

  res.status(201).json({
    ok: true,
    data: {
      cuenta: serializarCuenta(cuentaActualizada),
      transaccion: serializarTransaccion(transaccion, numeroCuenta)
    },
    mensaje: `Depósito de ${formatearSolesServidor(montoCentimos)} realizado correctamente.`
  });
});

/**
 * POST /api/cuenta/retiro
 * body: { numeroCuenta, monto, descripcion? }
 */
export const retirar = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const numeroCuenta = validarNumeroCuenta(body.numeroCuenta);
  const montoCentimos = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);

  let transaccionId = null;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cuenta = await buscarCuentaActiva(numeroCuenta, session);

      const actualizacion = await Cuenta.updateOne(
        {
          _id: cuenta._id,
          estado: 'ACTIVA',
          saldoCentimos: { $gte: montoCentimos }
        },
        { $inc: { saldoCentimos: -montoCentimos } },
        { session }
      );

      if (actualizacion.modifiedCount !== 1) {
        throw new ApiError(400, 'Saldo insuficiente para realizar el retiro.');
      }

      const [transaccion] = await Transaccion.create(
        [
          {
            tipo: 'RETIRO',
            montoCentimos,
            cuentaOrigen: cuenta._id,
            cuentaDestino: null,
            descripcion
          }
        ],
        { session }
      );

      transaccionId = transaccion._id;
    });
  } finally {
    await session.endSession();
  }

  const [cuentaActualizada, transaccion] = await Promise.all([
    Cuenta.findOne({ numeroCuenta }).lean(),
    obtenerTransaccionPopulada(transaccionId)
  ]);

  res.status(201).json({
    ok: true,
    data: {
      cuenta: serializarCuenta(cuentaActualizada),
      transaccion: serializarTransaccion(transaccion, numeroCuenta)
    },
    mensaje: `Retiro de ${formatearSolesServidor(montoCentimos)} realizado correctamente.`
  });
});

/**
 * POST /api/cuenta/transferencia
 * body: { cuentaOrigen, cuentaDestino, monto, descripcion?, idempotencyKey? }
 */
export const transferir = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const numeroOrigen = validarNumeroCuenta(body.cuentaOrigen, 'número de cuenta de origen');
  const numeroDestino = validarNumeroCuenta(body.cuentaDestino, 'número de cuenta de destino');
  const montoCentimos = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);
  const idempotencyKey = validarIdempotencyKey(body.idempotencyKey);

  if (numeroOrigen === numeroDestino) {
    throw new ApiError(400, 'La cuenta de origen y la cuenta destino deben ser diferentes.');
  }

  // Idempotencia: si la clave ya existe, se devuelve el movimiento original.
  if (idempotencyKey) {
    const existente = await buscarTransaccionPorClave(idempotencyKey);

    if (existente) {
      return responderTransferenciaExistente(res, existente, numeroOrigen);
    }
  }

  let transaccionId = null;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const origen = await buscarCuentaActiva(numeroOrigen, session);
      const destino = await buscarCuentaActiva(numeroDestino, session);

      const descuento = await Cuenta.updateOne(
        {
          _id: origen._id,
          estado: 'ACTIVA',
          saldoCentimos: { $gte: montoCentimos }
        },
        { $inc: { saldoCentimos: -montoCentimos } },
        { session }
      );

      if (descuento.modifiedCount !== 1) {
        throw new ApiError(400, 'Saldo insuficiente para realizar la transferencia.');
      }

      const abono = await Cuenta.updateOne(
        { _id: destino._id, estado: 'ACTIVA' },
        { $inc: { saldoCentimos: montoCentimos } },
        { session }
      );

      if (abono.modifiedCount !== 1) {
        throw new ApiError(400, `La cuenta destino ${numeroDestino} no está activa.`);
      }

      const [transaccion] = await Transaccion.create(
        [
          {
            tipo: 'TRANSFERENCIA',
            montoCentimos,
            cuentaOrigen: origen._id,
            cuentaDestino: destino._id,
            descripcion,
            idempotencyKey
          }
        ],
        { session }
      );

      transaccionId = transaccion._id;
    });
  } catch (error) {
    // Carrera entre dos peticiones con la misma clave: devolver la transferencia ya creada.
    if (idempotencyKey && error?.code === 11000) {
      const existente = await buscarTransaccionPorClave(idempotencyKey);

      if (existente) {
        return responderTransferenciaExistente(res, existente, numeroOrigen);
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }

  const [origenActualizado, destinoActualizado, transaccion] = await Promise.all([
    Cuenta.findOne({ numeroCuenta: numeroOrigen }).lean(),
    Cuenta.findOne({ numeroCuenta: numeroDestino }).lean(),
    obtenerTransaccionPopulada(transaccionId)
  ]);

  res.status(201).json({
    ok: true,
    data: {
      cuentaOrigen: serializarCuenta(origenActualizado),
      cuentaDestino: serializarCuenta(destinoActualizado),
      transaccion: serializarTransaccion(transaccion, numeroOrigen)
    },
    mensaje: `Transferencia de ${formatearSolesServidor(montoCentimos)} realizada correctamente.`
  });
});
