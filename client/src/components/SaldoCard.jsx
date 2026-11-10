import { formatearSoles, etiquetaMoneda } from '../utils/formato';
import { IconoBilletera, IconoSpinner } from './Iconos';

function EstadoCarga() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#241641] to-aurora-900 p-6 shadow-brillo sm:p-8">
      <div className="animate-pulse space-y-5">
        <div className="h-3 w-32 rounded-full bg-white/15" />
        <div className="h-12 w-64 max-w-full rounded-xl bg-white/15" />
        <div className="h-3 w-44 rounded-full bg-white/10" />
        <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div className="h-10 rounded-xl bg-white/10" />
          <div className="h-10 rounded-xl bg-white/10" />
        </div>
      </div>
    </section>
  );
}

export default function SaldoCard({ cuenta, cargando }) {
  if (!cuenta) {
    if (cargando) {
      return <EstadoCarga />;
    }

    return (
      <section className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-tarjeta">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-50 text-aurora-500">
          <IconoBilletera className="h-7 w-7" />
        </div>
        <p className="mt-4 text-base font-bold text-slate-800">
          Selecciona una cuenta
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Elige una cuenta en la parte superior para consultar su saldo y sus
          movimientos.
        </p>
      </section>
    );
  }

  const esActiva = cuenta.estado === 'ACTIVA';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#241641] to-aurora-900 p-6 text-white shadow-brillo sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-aurora-500/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-white/10"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-aurora-200">
              <IconoBilletera className="h-4 w-4" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aurora-200/80">
              Saldo disponible
            </p>
            {cargando && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-aurora-100">
                <IconoSpinner className="h-3 w-3 animate-spin" />
                Actualizando
              </span>
            )}
          </div>

          <p
            className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl"
            aria-live="polite"
          >
            {formatearSoles(cuenta.saldo)}
          </p>
          <p className="mt-1.5 text-sm text-aurora-100/70">
            Moneda: {etiquetaMoneda(cuenta.moneda)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
            esActiva
              ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30'
              : 'bg-rose-400/15 text-rose-300 ring-rose-400/30'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              esActiva ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          {cuenta.estado}
        </span>
      </div>

      <div className="relative mt-8 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-200/60">
            Titular
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {cuenta.titular}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-200/60">
            Número de cuenta
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-[0.18em] text-white">
            {cuenta.numeroCuenta}
          </p>
        </div>
      </div>
    </section>
  );
}
