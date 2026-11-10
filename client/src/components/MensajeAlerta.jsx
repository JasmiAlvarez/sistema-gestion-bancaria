import { useEffect } from 'react';
import { IconoCheck, IconoCerrar, IconoError, IconoInfo } from './Iconos';

const ESTILOS = {
  exito: {
    etiqueta: 'Operación exitosa',
    Icono: IconoCheck,
    contenedor: 'border-emerald-200 bg-white',
    icono: 'bg-emerald-50 text-emerald-600',
    titulo: 'text-emerald-800',
    texto: 'text-emerald-700',
    barraFondo: 'bg-emerald-100',
    barra: 'bg-emerald-500'
  },
  error: {
    etiqueta: 'Ocurrió un error',
    Icono: IconoError,
    contenedor: 'border-rose-200 bg-white',
    icono: 'bg-rose-50 text-rose-600',
    titulo: 'text-rose-800',
    texto: 'text-rose-700',
    barraFondo: 'bg-rose-100',
    barra: 'bg-rose-500'
  },
  info: {
    etiqueta: 'Información',
    Icono: IconoInfo,
    contenedor: 'border-aurora-200 bg-white',
    icono: 'bg-aurora-50 text-aurora-600',
    titulo: 'text-aurora-800',
    texto: 'text-slate-600',
    barraFondo: 'bg-aurora-100',
    barra: 'bg-aurora-500'
  }
};

export default function MensajeAlerta({ mensaje, onCerrar, duracion = 5000 }) {
  useEffect(() => {
    if (!mensaje) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      onCerrar();
    }, duracion);

    return () => window.clearTimeout(temporizador);
  }, [mensaje, onCerrar, duracion]);

  if (!mensaje) {
    return null;
  }

  const estilo = ESTILOS[mensaje.tipo] || ESTILOS.info;
  const Icono = estilo.Icono;

  return (
    <div
      role={mensaje.tipo === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className="fixed inset-x-4 top-4 z-[60] animate-fade-in-up sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
    >
      <div
        className={`overflow-hidden rounded-2xl border shadow-2xl shadow-slate-900/15 ${estilo.contenedor}`}
      >
        <div className="flex items-start gap-3 p-4">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${estilo.icono}`}
          >
            <Icono className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${estilo.titulo}`}>
              {estilo.etiqueta}
            </p>
            <p className={`mt-0.5 break-words text-sm ${estilo.texto}`}>
              {mensaje.texto}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar mensaje"
            className={`rounded-lg p-1.5 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 ${estilo.texto}`}
          >
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>

        <div className={`h-1 ${estilo.barraFondo}`}>
          <div className={`h-full animate-barra-progreso ${estilo.barra}`} />
        </div>
      </div>
    </div>
  );
}
