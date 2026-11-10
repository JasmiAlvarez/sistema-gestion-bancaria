/**
 * Formatos visuales del frontend.
 * El monto se muestra como "S/ 1,234.56" según el requerimiento.
 */

const formatoNumero = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatoFechaHora = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export function formatearSoles(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 'S/ 0.00';
  }

  return `S/ ${formatoNumero.format(numero)}`;
}

export function formatearFechaHora(fecha) {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha no disponible';
  }

  return formatoFechaHora.format(valor);
}

export function etiquetaMoneda(moneda) {
  if (moneda === 'PEN') {
    return 'PEN · Soles peruanos';
  }

  return moneda || 'PEN';
}
