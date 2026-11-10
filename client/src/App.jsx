import { useCallback, useEffect, useState } from 'react';

import Navbar from './components/Navbar';
import SaldoCard from './components/SaldoCard';
import FormOperacion from './components/FormOperacion';
import HistorialTransacciones from './components/HistorialTransacciones';
import MensajeAlerta from './components/MensajeAlerta';
import {
  extraerMensajeError,
  obtenerCuenta,
  obtenerCuentas,
  obtenerHistorial,
  realizarDeposito,
  realizarRetiro,
  realizarTransferencia
} from './services/cuentaService';
import { formatearSoles } from './utils/formato';

function generarIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  // Cuentas y cuenta seleccionada.
  const [cuentas, setCuentas] = useState([]);
  const [numeroCuentaSeleccionado, setNumeroCuentaSeleccionado] = useState('');
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);

  // Formulario de operación.
  const [tipoOperacion, setTipoOperacion] = useState('DEPOSITO');
  const [monto, setMonto] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generarIdempotencyKey);

  // Estados de carga, errores y mensajes.
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [cargandoCuenta, setCargandoCuenta] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);

  // Cambia para volver a consultar saldo e historial después de cada operación.
  const [refresco, setRefresco] = useState(0);

  const mostrarMensaje = useCallback((tipo, texto) => {
    setMensaje({ id: `${Date.now()}-${Math.random()}`, tipo, texto });
  }, []);

  const cerrarMensaje = useCallback(() => {
    setMensaje(null);
  }, []);

  // Carga inicial de la lista de cuentas.
  useEffect(() => {
    let activo = true;

    async function cargarCuentas() {
      try {
        const respuesta = await obtenerCuentas();

        if (!activo) {
          return;
        }

        const lista = Array.isArray(respuesta?.data) ? respuesta.data : [];
        setCuentas(lista);

        if (lista.length > 0) {
          setNumeroCuentaSeleccionado((actual) => actual || lista[0].numeroCuenta);
        } else {
          mostrarMensaje(
            'info',
            'No hay cuentas activas. Ejecuta "npm run seed" en server/ para crear las cuentas de prueba.'
          );
        }
      } catch (error) {
        if (activo) {
          mostrarMensaje('error', extraerMensajeError(error));
        }
      } finally {
        if (activo) {
          setCargandoCuentas(false);
        }
      }
    }

    cargarCuentas();

    return () => {
      activo = false;
    };
  }, [mostrarMensaje]);

  // Carga la cuenta y su historial cada vez que cambia la selección o hay un refresco.
  useEffect(() => {
    if (!numeroCuentaSeleccionado) {
      setCuenta(null);
      setHistorial([]);
      return undefined;
    }

    let activo = true;
    setCargandoCuenta(true);
    setCargandoHistorial(true);

    async function cargarDatosCuenta() {
      try {
        const resultados = await Promise.allSettled([
          obtenerCuenta(numeroCuentaSeleccionado),
          obtenerHistorial(numeroCuentaSeleccionado)
        ]);

        if (!activo) {
          return;
        }

        const [resultadoCuenta, resultadoHistorial] = resultados;

        if (resultadoCuenta.status === 'fulfilled') {
          setCuenta(resultadoCuenta.value.data);
        } else {
          setCuenta(null);
        }

        if (resultadoHistorial.status === 'fulfilled') {
          setHistorial(
            Array.isArray(resultadoHistorial.value.data)
              ? resultadoHistorial.value.data
              : []
          );
        } else {
          setHistorial([]);
        }

        if (
          resultadoCuenta.status === 'rejected' ||
          resultadoHistorial.status === 'rejected'
        ) {
          const error =
            resultadoCuenta.status === 'rejected'
              ? resultadoCuenta.reason
              : resultadoHistorial.reason;
          mostrarMensaje('error', extraerMensajeError(error));
        }
      } finally {
        if (activo) {
          setCargandoCuenta(false);
          setCargandoHistorial(false);
        }
      }
    }

    cargarDatosCuenta();

    return () => {
      activo = false;
    };
  }, [numeroCuentaSeleccionado, refresco, mostrarMensaje]);

  const manejarSeleccionCuenta = useCallback(
    (numeroCuenta) => {
      if (procesando || numeroCuenta === numeroCuentaSeleccionado) {
        return;
      }

      setNumeroCuentaSeleccionado(numeroCuenta);
      setCuenta(null);
      setHistorial([]);
      setMonto('');
      setCuentaDestino('');
      setDescripcion('');
      setErrores({});
      setIdempotencyKey(generarIdempotencyKey());
    },
    [numeroCuentaSeleccionado, procesando]
  );

  const manejarCambioTipo = useCallback((tipo) => {
    setTipoOperacion(tipo);
    setErrores({});

    if (tipo !== 'TRANSFERENCIA') {
      setCuentaDestino('');
    }
  }, []);

  const manejarCambioMonto = useCallback((valor) => {
    setMonto(valor);
    setErrores((anteriores) => ({ ...anteriores, monto: '' }));
  }, []);

  const manejarCambioCuentaDestino = useCallback((valor) => {
    setCuentaDestino(valor);
    setErrores((anteriores) => ({ ...anteriores, cuentaDestino: '' }));
  }, []);

  const manejarCambioDescripcion = useCallback((valor) => {
    setDescripcion(valor);
  }, []);

  function validarFormulario() {
    const nuevosErrores = {};
    const textoMonto = String(monto).trim().replace(',', '.');
    const montoNumero = Number(textoMonto);

    if (!textoMonto) {
      nuevosErrores.monto = 'Ingresa el monto de la operación.';
    } else if (
      !/^\d+(\.\d{1,2})?$/.test(textoMonto) ||
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0
    ) {
      nuevosErrores.monto = 'Ingresa un monto mayor a 0 con máximo 2 decimales.';
    }

    if (tipoOperacion === 'TRANSFERENCIA') {
      if (!cuentaDestino) {
        nuevosErrores.cuentaDestino = 'Selecciona la cuenta destino.';
      } else if (cuentaDestino === cuenta?.numeroCuenta) {
        nuevosErrores.cuentaDestino =
          'La cuenta destino debe ser diferente a la cuenta de origen.';
      }
    }

    if (
      !nuevosErrores.monto &&
      cuenta &&
      (tipoOperacion === 'RETIRO' || tipoOperacion === 'TRANSFERENCIA') &&
      montoNumero > Number(cuenta.saldo)
    ) {
      nuevosErrores.monto = `Saldo insuficiente. Disponible: ${formatearSoles(
        cuenta.saldo
      )}.`;
    }

    setErrores(nuevosErrores);

    return { valido: Object.keys(nuevosErrores).length === 0, montoNumero };
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    if (procesando || !cuenta) {
      return;
    }

    const { valido, montoNumero } = validarFormulario();

    if (!valido) {
      return;
    }

    setProcesando(true);
    setErrores({});

    const descripcionLimpia = descripcion.trim();
    const datosBase = {
      monto: montoNumero,
      descripcion: descripcionLimpia || undefined
    };

    try {
      let respuesta;

      if (tipoOperacion === 'DEPOSITO') {
        respuesta = await realizarDeposito({
          numeroCuenta: cuenta.numeroCuenta,
          ...datosBase
        });
      } else if (tipoOperacion === 'RETIRO') {
        respuesta = await realizarRetiro({
          numeroCuenta: cuenta.numeroCuenta,
          ...datosBase
        });
      } else {
        respuesta = await realizarTransferencia({
          cuentaOrigen: cuenta.numeroCuenta,
          cuentaDestino,
          ...datosBase,
          idempotencyKey
        });
      }

      mostrarMensaje(
        'exito',
        respuesta?.mensaje || 'La operación se realizó correctamente.'
      );

      setMonto('');
      setDescripcion('');
      setCuentaDestino('');

      if (tipoOperacion === 'TRANSFERENCIA') {
        setIdempotencyKey(generarIdempotencyKey());
      }

      // Dispara la recarga de saldo e historial sin recargar la página.
      setRefresco((valor) => valor + 1);
    } catch (error) {
      const textoError = extraerMensajeError(error);
      const erroresServidor = {};

      if (/monto|saldo insuficiente/i.test(textoError)) {
        erroresServidor.monto = textoError;
      }

      if (tipoOperacion === 'TRANSFERENCIA' && /destino/i.test(textoError)) {
        erroresServidor.cuentaDestino = textoError;
      }

      if (Object.keys(erroresServidor).length > 0) {
        setErrores(erroresServidor);
      }

      mostrarMensaje('error', textoError);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        cuentas={cuentas}
        numeroCuentaSeleccionado={numeroCuentaSeleccionado}
        onSeleccionarCuenta={manejarSeleccionCuenta}
        cargando={cargandoCuentas}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {mensaje && (
          <MensajeAlerta
            key={mensaje.id}
            mensaje={mensaje}
            onCerrar={cerrarMensaje}
          />
        )}

        {!cargandoCuentas && cuentas.length === 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold">No hay cuentas activas disponibles.</p>
            <p className="mt-1">
              Ejecuta{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs font-semibold">
                npm run seed
              </code>{' '}
              dentro de la carpeta <code className="font-mono text-xs">server/</code>{' '}
              y luego recarga esta página.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,410px)] lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            <SaldoCard cuenta={cuenta} cargando={cargandoCuenta} />
          </div>

          <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <FormOperacion
              tipoOperacion={tipoOperacion}
              onCambiarTipo={manejarCambioTipo}
              monto={monto}
              onCambiarMonto={manejarCambioMonto}
              cuentaDestino={cuentaDestino}
              onCambiarCuentaDestino={manejarCambioCuentaDestino}
              descripcion={descripcion}
              onCambiarDescripcion={manejarCambioDescripcion}
              cuentas={cuentas}
              cuenta={cuenta}
              procesando={procesando}
              errores={errores}
              onEnviar={manejarEnvio}
              idempotencyKey={idempotencyKey}
            />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <HistorialTransacciones
              historial={historial}
              numeroCuenta={cuenta?.numeroCuenta || numeroCuentaSeleccionado}
              cargando={cargandoHistorial}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-semibold text-slate-700">Banco Aurora</span> ·
            Proyecto académico de Ingeniería Web
          </p>
          <p>React + Vite + Tailwind · Node.js + Express + MongoDB</p>
        </div>
      </footer>
    </div>
  );
}
