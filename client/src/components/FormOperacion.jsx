import { formatearSoles } from '../utils/formato';
import {
  IconoEscudo,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoSpinner,
  IconoTransferencia
} from './Iconos';

const TIPOS_OPERACION = [
  { valor: 'DEPOSITO', etiqueta: 'Depósito', Icono: IconoFlechaAbajo },
  { valor: 'RETIRO', etiqueta: 'Retiro', Icono: IconoFlechaArriba },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia', Icono: IconoTransferencia }
];

const ETIQUETAS_BOTON = {
  DEPOSITO: 'Confirmar depósito',
  RETIRO: 'Confirmar retiro',
  TRANSFERENCIA: 'Confirmar transferencia'
};

export default function FormOperacion({
  tipoOperacion,
  onCambiarTipo,
  monto,
  onCambiarMonto,
  cuentaDestino,
  onCambiarCuentaDestino,
  descripcion,
  onCambiarDescripcion,
  cuentas,
  cuenta,
  procesando,
  errores = {},
  onEnviar,
  idempotencyKey
}) {
  const textoMonto = String(monto ?? '').trim().replace(',', '.');
  const montoNumero = Number(textoMonto);
  const montoValido =
    /^\d+(\.\d{1,2})?$/.test(textoMonto) &&
    Number.isFinite(montoNumero) &&
    montoNumero > 0;

  const cuentasDestino = cuentas.filter(
    (item) => item.numeroCuenta !== cuenta?.numeroCuenta
  );

  const saldoProyectado =
    cuenta && montoValido
      ? tipoOperacion === 'DEPOSITO'
        ? Number(cuenta.saldo) + montoNumero
        : Number(cuenta.saldo) - montoNumero
      : null;

  const saldoInsuficiente = saldoProyectado !== null && saldoProyectado < 0;
  const esTransferencia = tipoOperacion === 'TRANSFERENCIA';

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-tarjeta sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          Nueva operación
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Realiza un depósito, retiro o transferencia de forma segura.
        </p>
      </div>

      <form onSubmit={onEnviar} noValidate className="space-y-5">
        <div
          role="tablist"
          aria-label="Tipo de operación"
          className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1"
        >
          {TIPOS_OPERACION.map(({ valor, etiqueta, Icono }) => {
            const activo = tipoOperacion === valor;

            return (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => onCambiarTipo(valor)}
                disabled={procesando}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-aurora-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
                  activo
                    ? 'bg-white text-aurora-700 shadow-sm'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                <Icono className="h-4 w-4 shrink-0" />
                <span className="truncate">{etiqueta}</span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="monto"
              className="block text-sm font-semibold text-slate-700"
            >
              Monto
            </label>
            {cuenta && (
              <span className="text-xs font-medium text-slate-400">
                Disponible: {formatearSoles(cuenta.saldo)}
              </span>
            )}
          </div>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">
              S/
            </span>
            <input
              id="monto"
              name="monto"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={monto}
              onChange={(evento) => onCambiarMonto(evento.target.value)}
              disabled={procesando || !cuenta}
              aria-invalid={Boolean(errores.monto)}
              aria-describedby={errores.monto ? 'error-monto' : undefined}
              className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-lg font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                errores.monto
                  ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-aurora-400 focus:ring-aurora-100'
              }`}
            />
          </div>
          {errores.monto && (
            <p id="error-monto" className="mt-1.5 text-xs font-medium text-rose-600">
              {errores.monto}
            </p>
          )}
        </div>

        {montoValido && (
          <div className="rounded-2xl border border-aurora-100 bg-aurora-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aurora-700">
                Vista previa
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {formatearSoles(montoNumero)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {tipoOperacion === 'DEPOSITO' &&
                'El monto se sumará al saldo disponible de la cuenta.'}
              {tipoOperacion === 'RETIRO' &&
                'El monto se descontará del saldo disponible de la cuenta.'}
              {esTransferencia &&
                'El monto se descontará de la cuenta de origen y se abonará a la cuenta destino.'}
            </p>
            {saldoProyectado !== null && tipoOperacion !== 'DEPOSITO' && (
              <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-aurora-100 pt-2.5 text-xs font-semibold">
                <span className="text-slate-500">Saldo después de la operación</span>
                <span
                  className={
                    saldoInsuficiente ? 'text-rose-600' : 'text-emerald-600'
                  }
                >
                  {formatearSoles(Math.max(saldoProyectado, 0))}
                </span>
              </div>
            )}
            {saldoInsuficiente && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                El monto supera el saldo disponible.
              </p>
            )}
          </div>
        )}

        {esTransferencia && (
          <div>
            <label
              htmlFor="cuentaDestino"
              className="block text-sm font-semibold text-slate-700"
            >
              Cuenta destino
            </label>
            <select
              id="cuentaDestino"
              name="cuentaDestino"
              value={cuentaDestino}
              onChange={(evento) => onCambiarCuentaDestino(evento.target.value)}
              disabled={procesando || !cuenta}
              aria-invalid={Boolean(errores.cuentaDestino)}
              aria-describedby={
                errores.cuentaDestino ? 'error-cuenta-destino' : undefined
              }
              className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                errores.cuentaDestino
                  ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-aurora-400 focus:ring-aurora-100'
              }`}
            >
              <option value="">Selecciona una cuenta…</option>
              {cuentasDestino.map((item) => (
                <option key={item.numeroCuenta} value={item.numeroCuenta}>
                  {item.numeroCuenta} · {item.titular}
                </option>
              ))}
            </select>
            {errores.cuentaDestino && (
              <p
                id="error-cuenta-destino"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                {errores.cuentaDestino}
              </p>
            )}
            {cuentasDestino.length === 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                No hay otras cuentas activas para transferir.
              </p>
            )}

            {idempotencyKey && (
              <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Clave de idempotencia
                </span>
                <code
                  className="truncate text-[11px] font-semibold text-slate-700"
                  title={idempotencyKey}
                >
                  {idempotencyKey.slice(0, 8)}…
                </code>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="descripcion"
              className="block text-sm font-semibold text-slate-700"
            >
              Descripción <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {descripcion.length}/200
            </span>
          </div>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={2}
            maxLength={200}
            placeholder="Ej. Pago de alquiler, depósito de ahorro…"
            value={descripcion}
            onChange={(evento) => onCambiarDescripcion(evento.target.value)}
            disabled={procesando || !cuenta}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-aurora-400 focus:ring-2 focus:ring-aurora-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        <button
          type="submit"
          disabled={procesando || !cuenta}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aurora-700 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-aurora-200 transition hover:from-aurora-800 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-aurora-700 disabled:hover:to-violet-600"
        >
          {procesando ? (
            <>
              <IconoSpinner className="h-5 w-5 animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <span>{ETIQUETAS_BOTON[tipoOperacion]}</span>
              {montoValido && (
                <>
                  <span className="font-normal text-white/60">·</span>
                  <span>{formatearSoles(montoNumero)}</span>
                </>
              )}
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
        <IconoEscudo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Las operaciones se validan en el servidor y se ejecutan con
          transacciones atómicas de MongoDB.
        </p>
      </div>
    </section>
  );
}
