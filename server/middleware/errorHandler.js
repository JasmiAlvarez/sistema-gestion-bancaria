/**
 * Error controlado con código HTTP y mensaje para el cliente.
 */
export class ApiError extends Error {
  /**
   * @param {number} status Código HTTP.
   * @param {string} mensaje Mensaje claro para el usuario.
   */
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Envuelve controladores asíncronos para que sus errores lleguen al middleware central.
 * @param {Function} controlador
 * @returns {Function}
 */
export function asyncHandler(controlador) {
  return (req, res, next) => {
    Promise.resolve(controlador(req, res, next)).catch(next);
  };
}

/**
 * Middleware para rutas no encontradas.
 */
export function notFound(req, res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/**
 * Middleware central de errores.
 * Todas las respuestas de error conservan el formato { ok: false, mensaje }.
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let status = Number(error.status || error.statusCode) || 500;
  let mensaje = error.message || 'Error interno del servidor.';

  // Errores de validación de Mongoose.
  if (error.name === 'ValidationError') {
    status = 400;
    mensaje = Object.values(error.errors)
      .map((detalle) => detalle.message)
      .join(' ');
  }

  // Identificadores u objetos con formato inválido.
  if (error.name === 'CastError') {
    status = 400;
    mensaje = 'Identificador o dato con formato inválido.';
  }

  // Violación de índice único (por ejemplo, idempotencyKey repetida).
  if (error.code === 11000) {
    status = 400;
    mensaje = error.keyPattern?.idempotencyKey
      ? 'La clave de idempotencia ya fue utilizada.'
      : 'Ya existe un registro con esos datos.';
  }

  // JSON mal formado enviado por el cliente.
  if (error.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido.';
  }

  if (status >= 500) {
    console.error('💥 Error interno:', error);
    mensaje = 'Error interno del servidor. Intenta nuevamente.';
  }

  res.status(status).json({ ok: false, mensaje });
}
