/**
 * Iconos SVG reutilizables (estilo Heroicons, trazo).
 * Todos heredan el color con currentColor y aceptan className.
 */

function base(className) {
  return {
    className: className || 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };
}

export function IconoBanco({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M3 21h18M4 18h16M6 18V9m4 9V9m4 9V9m4 9V9M3 9l9-5 9 5H3Z" />
    </svg>
  );
}

export function IconoBilletera({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />
      <path d="M3 8.5h14.5A2.5 2.5 0 0 1 20 11v2.5h-5a2.5 2.5 0 0 1 0-5H20" />
      <circle cx="15.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoFlechaAbajo({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
    </svg>
  );
}

export function IconoFlechaArriba({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 20V4m0 0 6 6m-6-6-6 6" />
    </svg>
  );
}

export function IconoTransferencia({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M4 7h13m0 0-3-3m3 3-3 3M20 17H7m0 0 3 3m-3-3 3-3" />
    </svg>
  );
}

export function IconoHistorial({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 8v4l3 2" />
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  );
}

export function IconoCheck({ className }) {
  return (
    <svg {...base(className)}>
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconoError({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 9v4m0 4h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconoInfo({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 11v5m0-8h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconoCerrar({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconoSpinner({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function IconoEscudo({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconoFlechaDerecha({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M5 12h14m0 0-5-5m5 5-5 5" />
    </svg>
  );
}

export function IconoChevronAbajo({ className }) {
  return (
    <svg {...base(className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconoActualizar({ className }) {
  return (
    <svg {...base(className)}>
      <path d="M4 4v6h6M20 20v-6h-6" />
      <path d="M20 9a8 8 0 0 0-14.9-3M4 15a8 8 0 0 0 14.9 3" />
    </svg>
  );
}
