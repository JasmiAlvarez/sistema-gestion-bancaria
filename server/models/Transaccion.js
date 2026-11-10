import mongoose from 'mongoose';

/**
 * Movimiento bancario.
 * Una transferencia se guarda como UN SOLO registro con cuentaOrigen y cuentaDestino.
 * En depósitos y retiros, cuentaOrigen es la cuenta afectada.
 */
const transaccionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: [true, 'El tipo de transacción es obligatorio.'],
      enum: {
        values: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'],
        message: 'El tipo debe ser DEPOSITO, RETIRO o TRANSFERENCIA.'
      }
    },
    montoCentimos: {
      type: Number,
      required: [true, 'El monto es obligatorio.'],
      min: [1, 'El monto debe ser mayor que 0.'],
      validate: {
        validator: (valor) => Number.isInteger(valor),
        message: 'El monto debe expresarse en céntimos (número entero).'
      }
    },
    cuentaOrigen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      required: [true, 'La cuenta de origen es obligatoria.']
    },
    cuentaDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      default: null
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'La descripción no puede superar los 200 caracteres.']
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: [100, 'La clave de idempotencia no puede superar los 100 caracteres.']
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Índices compuestos solicitados para consultar el historial por cuenta y fecha.
transaccionSchema.index({ cuentaOrigen: 1, fecha: -1 });
transaccionSchema.index({ cuentaDestino: 1, fecha: -1 });

// Evita redefinir el modelo al importar varias veces (pruebas o recarga en caliente).
const Transaccion =
  mongoose.models.Transaccion || mongoose.model('Transaccion', transaccionSchema);

export default Transaccion;
