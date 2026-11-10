/**
 * Utilidades para manejar dinero sin errores de decimales.
 * La base de datos SIEMPRE guarda céntimos (números enteros).
 * La API recibe y devuelve soles (por ejemplo, 150.50).
 */

// Acepta enteros o decimales con 1 o 2 cifras. También admite coma decimal.
const PATRON_MONTO = /^\d+(\.\d{1,2})?$/;

/**
 * Convierte un monto en soles a céntimos enteros.
 * Devuelve null cuando el valor no es un número válido, no es mayor que 0
 * o tiene más de 2 decimales.
 *
 * @param {number|string} valor Monto en soles.
 * @returns {number|null} Monto en céntimos o null si es inválido.
 */
export function convertirSolesACentimos(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const texto = String(valor).trim().replace(',', '.');

  if (!PATRON_MONTO.test(texto)) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }

  const centimos = Math.round(numero * 100);

  if (!Number.isSafeInteger(centimos)) {
    return null;
  }

  return centimos;
}

/**
 * Convierte céntimos enteros a soles.
 *
 * @param {number} centimos Monto en céntimos.
 * @returns {number} Monto en soles con 2 decimales.
 */
export function convertirCentimosASoles(centimos) {
  const numero = Number(centimos);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.round(numero) / 100;
}

/**
 * Formatea céntimos como "S/ 1,234.56" para mensajes del servidor.
 *
 * @param {number} centimos Monto en céntimos.
 * @returns {string}
 */
export function formatearSolesServidor(centimos) {
  const numero = Math.round(Number(centimos) || 0) / 100;
  const formateado = numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `S/ ${formateado}`;
}
