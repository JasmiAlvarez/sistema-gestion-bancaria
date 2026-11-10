import { IconoBanco, IconoChevronAbajo } from './Iconos';

export default function Navbar({
  cuentas,
  numeroCuentaSeleccionado,
  onSeleccionarCuenta,
  cargando
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950 via-[#1d1435] to-aurora-950/95 shadow-lg shadow-slate-950/20 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora-500 to-fuchsia-600 text-white shadow-brillo">
            <IconoBanco className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white">
              Banco Aurora
            </p>
            <p className="text-xs font-medium text-aurora-200/80">
              Sistema de Cuenta Bancaria Simplificada
            </p>
          </div>
        </div>

        <label className="flex w-full flex-col gap-1.5 md:w-auto md:min-w-[300px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-200/70">
            Cuenta activa
          </span>
          <div className="relative">
            <select
              value={numeroCuentaSeleccionado}
              onChange={(evento) => onSeleccionarCuenta(evento.target.value)}
              disabled={cargando || cuentas.length === 0}
              aria-label="Seleccionar cuenta bancaria"
              style={{ colorScheme: 'dark' }}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 py-2.5 pl-3 pr-10 text-sm font-semibold text-white outline-none transition hover:bg-white/15 focus:border-aurora-300 focus:ring-2 focus:ring-aurora-400/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando && <option value="">Cargando cuentas…</option>}
              {!cargando && cuentas.length === 0 && (
                <option value="">Sin cuentas disponibles</option>
              )}
              {cuentas.map((cuenta) => (
                <option key={cuenta.numeroCuenta} value={cuenta.numeroCuenta}>
                  {cuenta.numeroCuenta} · {cuenta.titular}
                </option>
              ))}
            </select>
            <IconoChevronAbajo className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aurora-200" />
          </div>
        </label>
      </div>
    </header>
  );
}
