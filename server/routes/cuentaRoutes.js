import { Router } from 'express';
import {
  listarCuentas,
  obtenerCuenta,
  obtenerHistorial,
  depositar,
  retirar,
  transferir
} from '../controllers/cuentaController.js';

const router = Router();

// Ruta auxiliar para el selector de cuentas del frontend.
router.get('/cuentas', listarCuentas);

// Historial antes de la ruta genérica de cuenta.
router.get('/cuenta/:id/historial', obtenerHistorial);
router.get('/cuenta/:id', obtenerCuenta);

// Operaciones.
router.post('/cuenta/deposito', depositar);
router.post('/cuenta/retiro', retirar);
router.post('/cuenta/transferencia', transferir);

export default router;
