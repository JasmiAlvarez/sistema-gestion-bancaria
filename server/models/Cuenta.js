import mongoose from 'mongoose';

/**
 * Cuenta bancaria simplificada.
 * El saldo se almacena en céntimos (entero) para evitar errores de coma flotante.
 */
const cuentaSchema = new mongoose.Schema(
  {
    titular: {
      type: String,
      required: [true, 'El titular es obligatorio.'],
      trim: true
    },
    numeroCuenta: {
      type: String,
      required: [true, 'El número de cuenta es obligatorio.'],
      unique: true, // Genera un índice único.
      trim: true,
      match: [/^\d{6}$/, 'El número de cuenta debe tener exactamente 6 dígitos.']
    },
    saldoCentimos: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El saldo no puede ser negativo.'],
      validate: {
        validator: (valor) => Number.isInteger(valor),
        message: 'El saldo debe expresarse en céntimos (número entero).'
      }
    },
    moneda: {
      type: String,
      default: 'PEN',
      trim: true,
      uppercase: true
    },
    estado: {
      type: String,
      enum: {
        values: ['ACTIVA', 'INACTIVA'],
        message: 'El estado debe ser ACTIVA o INACTIVA.'
      },
      default: 'ACTIVA'
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Evita redefinir el modelo al importar varias veces (pruebas o recarga en caliente).
const Cuenta = mongoose.models.Cuenta || mongoose.model('Cuenta', cuentaSchema);

export default Cuenta;
