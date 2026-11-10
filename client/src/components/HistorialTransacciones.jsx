import { formatearFechaHora, formatearSoles } from '../utils/formato';
import {
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoFlechaDerecha,
  IconoHistorial,
  IconoSpinner,
  IconoTransferencia
} from './Iconos';

const ETIQUETA_TIPO = {
  DEPOSITO: 'Depósito',
  RETIRO: 'Retiro',
  TRANSFERENCIA: 'Transferencia'
};

function esEntrada(transaccion) {
  if (transaccion.direccion) {
    return transaccion.direccion === 'ENTRADA';
  }

  return transaccion.tipo === 'DEPOSITO';
}

function IconoTipo({ transaccion, className }) {
  if (transaccion.tipo === 'DEPOSITO') {
    return <IconoFlechaAbajo className={className} />;
  }

  if (transaccion.tipo === 'RETIRO') {
    return <IconoFlechaArriba className={className} />;
  }

  return <IconoTransferencia className={className} />;
}

function etiquetaOperacion(transaccion, entrada) {
  const base = ETIQUETA_TIPO[transaccion.tipo] || transaccion.tipo;

  if (transaccion.tipo !== 'TRANSFERENCIA') {
    return base;
  }

  return entrada ? 'Transferencia recibida' : 'Transferencia enviada';
}

function DescripcionCuentas({ transaccion }) {
  const origen = transaccion.cuentaOrigen;
  const destino = transaccion.cuentaDestino;

  if (transaccion.tipo === 'DEPOSITO') {
    return (
      <span className="text-slate-600">
        En <span className="font-semibold">{origen?.numeroCuenta}</span> ·{' '}
        {origen?.titular}
      </span>
    );
  }

  if (transaccion.tipo === 'RETIRO') {
    return (
      <span className="text-slate-600">
        De <span className="font-semibold">{origen?.numeroCuenta}</span> ·{' '}
        {origen?.titular}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-600">
      <span className="font-semibold">{origen?.numeroCuenta}</span>
      <span className="text-slate-400">{origen?.titular}</span>
      <IconoFlechaDerecha className="h-3.5 w-3.5 text-aurora-400" />
      <span className="font-semibold">{destino?.numeroCuenta}</span>
      <span className="text-slate-400">{destino?.titular}</span>
    </span>
  );
}

function FilaEsqueleto() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-7 w-28 rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-40 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="ml-auto h-4 w-20 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="ml-auto h-4 w-28 rounded bg-slate-100" />
      </td>
    </tr>
  );
}

export default function HistorialTransacciones({
  historial = [],
  numeroCuenta,
  cargando
}) {
  const hayMovimientos = historial.length > 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-tarjeta">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Movimientos recientes
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Últimos 20 movimientos de la cuenta{' '}
            <span className="font-semibold text-slate-700">
              {numeroCuenta || '—'}
            </span>
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {cargando ? (
            <IconoSpinner className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <IconoHistorial className="h-3.5 w-3.5" />
          )}
          {historial.length} {historial.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {!hayMovimientos && cargando && (
        <div className="space-y-3 p-5 sm:p-6">
          {[0, 1, 2].map((indice) => (
            <div
              key={indice}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {!hayMovimientos && !cargando && (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-50 text-aurora-500">
            <IconoHistorial className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-800">
            Aún no hay movimientos
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Cuando realices un depósito, retiro o transferencia, aparecerá aquí
            con su fecha, hora y descripción.
          </p>
        </div>
      )}

      {hayMovimientos && (
        <>
          {/* Tabla para escritorio y tablet */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Operación
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Cuentas involucradas
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-bold">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-bold">
                    Fecha y hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando && <FilaEsqueleto />}
                {historial.map((transaccion) => {
                  const entrada = esEntrada(transaccion);
                  const claseDireccion = entrada
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                    : 'bg-rose-50 text-rose-700 ring-rose-100';

                  return (
                    <tr
                      key={transaccion.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${claseDireccion}`}
                        >
                          <IconoTipo
                            transaccion={transaccion}
                            className="h-3.5 w-3.5"
                          />
                          {etiquetaOperacion(transaccion, entrada)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <DescripcionCuentas transaccion={transaccion} />
                      </td>
                      <td className="max-w-[220px] px-6 py-4 text-xs text-slate-500">
                        <span className="line-clamp-2">
                          {transaccion.descripcion || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <span
                          className={`text-sm font-extrabold tabular-nums ${
                            entrada ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {entrada ? '+' : '−'} {formatearSoles(transaccion.monto)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                        {formatearFechaHora(transaccion.fecha)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tarjetas para celular */}
          <div className="divide-y divide-slate-100 md:hidden">
            {cargando && (
              <div className="space-y-3 p-4">
                {[0, 1].map((indice) => (
                  <div
                    key={indice}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            )}

            {historial.map((transaccion) => {
              const entrada = esEntrada(transaccion);
              const claseDireccion = entrada
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700';

              return (
                <article key={transaccion.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${claseDireccion}`}
                      >
                        <IconoTipo
                          transaccion={transaccion}
                          className="h-4 w-4"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {etiquetaOperacion(transaccion, entrada)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatearFechaHora(transaccion.fecha)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-extrabold tabular-nums ${
                        entrada ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {entrada ? '+' : '−'} {formatearSoles(transaccion.monto)}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
                    <DescripcionCuentas transaccion={transaccion} />
                  </div>

                  {transaccion.descripcion && (
                    <p className="mt-2 text-xs text-slate-500">
                      “{transaccion.descripcion}”
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
