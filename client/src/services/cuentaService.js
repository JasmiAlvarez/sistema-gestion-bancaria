import axios from 'axios';

/**
 * URL base del API. Se configura con VITE_API_URL en client/.env.
 * Si no existe el archivo .env, se usa el valor por defecto de desarrollo.
 */
export const URL_API = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: URL_API,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Traduce cualquier error de Axios a un mensaje claro para el usuario.
 */
export function extraerMensajeError(error) {
  if (error?.response?.data?.mensaje) {
    return error.response.data.mensaje;
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución y que la URL del API sea correcta.';
  }

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'La solicitud tardó demasiado. Intenta nuevamente.';
  }

  if (error?.response?.status === 404) {
    return 'El recurso solicitado no existe.';
  }

  if (error?.response?.status >= 500) {
    return 'El servidor tuvo un problema interno. Intenta nuevamente.';
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

export async function obtenerCuentas() {
  const { data } = await api.get('/cuentas');
  return data;
}

export async function obtenerCuenta(numeroCuenta) {
  const { data } = await api.get(`/cuenta/${encodeURIComponent(numeroCuenta)}`);
  return data;
}

export async function obtenerHistorial(numeroCuenta) {
  const { data } = await api.get(`/cuenta/${encodeURIComponent(numeroCuenta)}/historial`);
  return data;
}

export async function realizarDeposito({ numeroCuenta, monto, descripcion }) {
  const { data } = await api.post('/cuenta/deposito', {
    numeroCuenta,
    monto,
    descripcion
  });
  return data;
}

export async function realizarRetiro({ numeroCuenta, monto, descripcion }) {
  const { data } = await api.post('/cuenta/retiro', {
    numeroCuenta,
    monto,
    descripcion
  });
  return data;
}

export async function realizarTransferencia({
  cuentaOrigen,
  cuentaDestino,
  monto,
  descripcion,
  idempotencyKey
}) {
  const { data } = await api.post('/cuenta/transferencia', {
    cuentaOrigen,
    cuentaDestino,
    monto,
    descripcion,
    idempotencyKey
  });
  return data;
}
