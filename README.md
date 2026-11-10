# Sistema de Gestión de Cuenta Bancaria Simplificada

Aplicación web full-stack para administrar una cuenta bancaria simplificada. Permite consultar saldo, realizar **depósitos**, **retiros** y **transferencias**, y revisar el historial de los últimos movimientos. El dinero se almacena internamente en **céntimos** y todas las operaciones críticas usan **transacciones multidocumento de MongoDB**.

Proyecto académico de la asignatura **Ingeniería Web – Unidad de Desarrollo Full-Stack**.

> **Estado importante:** el archivo `server/.env` se entrega con `MONGODB_URI=` vacía de forma intencional. Debes completar tu propia cadena de MongoDB Atlas (o de un MongoDB local con replica set) antes de iniciar la API. La aplicación **no se conecta a Atlas hasta que tú configures la credencial**.

---

## 1. Objetivo

Demostrar el desarrollo de una aplicación full-stack real (no una maqueta) que cumpla estos objetivos:

- API REST con Node.js, Express y Mongoose.
- Persistencia en MongoDB Atlas M0 (replica set) o MongoDB local con replica set.
- Operaciones bancarias atómicas y consistentes.
- Validaciones de negocio en el servidor.
- Transferencias idempotentes para evitar cobros duplicados por reintentos.
- Frontend React + Vite + Tailwind CSS, responsive y con estados de carga.
- Pruebas automatizadas de los casos principales y de error.

---

## 2. Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Backend | Node.js, Express 5, JavaScript ES Modules, Mongoose, dotenv, cors |
| Base de datos | MongoDB Atlas M0 (replica set) o MongoDB local con replica set |
| Frontend | React 19, Vite 7, JSX, useState, useEffect, Props, Axios, Tailwind CSS 3 |
| Pruebas | `node:test`, `supertest`, `mongodb-memory-server` (respaldo para testing) |

No se usa TypeScript, Firebase, Supabase, Bootstrap ni CSS tradicional para los componentes. Los estilos son clases utilitarias de Tailwind.

---

## 3. Requisitos previos

- **Node.js >= 20.19** (recomendado Node 22 o superior).
- **npm >= 10**.
- Cuenta gratuita en **MongoDB Atlas** para usar el clúster M0, **o** MongoDB Community instalado localmente con replica set.
- Navegador moderno (Chrome, Edge, Firefox o Safari actualizado).

Verifica las versiones:

```bash
node -v
npm -v
```

---

## 4. Estructura de carpetas

```text
sistema-bancario/
├── server/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Cuenta.js
│   │   └── Transaccion.js
│   ├── controllers/
│   │   └── cuentaController.js
│   ├── routes/
│   │   └── cuentaRoutes.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── dinero.js
│   ├── scripts/
│   │   └── seed.js
│   ├── tests/
│   │   └── api.test.js
│   ├── .env                 # local, NO se sube a GitHub
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SaldoCard.jsx
│   │   │   ├── FormOperacion.jsx
│   │   │   ├── HistorialTransacciones.jsx
│   │   │   ├── MensajeAlerta.jsx
│   │   │   └── Iconos.jsx
│   │   ├── services/
│   │   │   └── cuentaService.js
│   │   ├── utils/
│   │   │   └── formato.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 5. Crear el clúster gratuito M0 en MongoDB Atlas

### 5.1 Crear la cuenta y el clúster

1. Ingresa a <https://www.mongodb.com/cloud/atlas> y crea una cuenta.
2. Crea un proyecto (por ejemplo, `IngenieriaWeb`).
3. Pulsa **Create** / **Build a Database** y elige el plan **M0 FREE**.
4. Selecciona un proveedor y una región cercana (por ejemplo, AWS / São Paulo).
5. Asigna un nombre al clúster (por ejemplo, `ClusterBanco`) y crea el clúster.
6. Espera hasta que el estado sea **Active**.

### 5.2 Database Access (usuario y contraseña)

1. En el menú lateral entra a **Database Access** → **Add New Database User**.
2. Crea un usuario, por ejemplo `usuario_banco`, con una contraseña segura.
3. Para la demostración académica asigna el rol **Read and write to any database** (o `Atlas admin` si tu docente lo permite).
4. Guarda el usuario y la contraseña en un lugar seguro.

> Si la contraseña contiene caracteres especiales como `@`, `:`, `/`, `?`, `#` o `%`, debes codificarlos en la URL. Por ejemplo, `@` se convierte en `%40`. Es más sencillo usar una contraseña alfanumérica para la demo.

### 5.3 Network Access (dirección IP)

1. Entra a **Network Access** → **Add IP Address**.
2. Para la demostración puedes usar **Allow access from anywhere**: `0.0.0.0/0`.
3. Confirma el cambio.

> `0.0.0.0/0` es aceptable solo para una demo académica. En producción debes restringir las IP permitidas.

### 5.4 Obtener la cadena de conexión

1. En el clúster pulsa **Connect** → **Drivers**.
2. Selecciona **Node.js** y copia la cadena, similar a:

```text
mongodb+srv://usuario_banco:<db_password>@clusterbanco.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

3. Reemplaza `<db_password>` por tu contraseña real.
4. Agrega el nombre de la base de datos `banco` antes del signo `?`:

```text
mongodb+srv://usuario_banco:TU_CLAVE@clusterbanco.xxxxx.mongodb.net/banco?retryWrites=true&w=majority
```

5. Pega la cadena en `server/.env`:

```env
MONGODB_URI=mongodb+srv://usuario_banco:TU_CLAVE@clusterbanco.xxxxx.mongodb.net/banco?retryWrites=true&w=majority
PORT=5000
CLIENT_URL=http://localhost:5173
```

> **Nunca** escribas la cadena de conexión en el código ni subas `server/.env` a GitHub. El archivo `.gitignore` ya lo excluye.

---

## 6. Variables de entorno

### 6.1 Backend — `server/.env`

Copia el ejemplo y complétalo:

```bash
cd server
copy .env.example .env        # Windows
# cp .env.example .env        # Linux / macOS
```

Contenido:

```env
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@CLUSTER.mongodb.net/banco?retryWrites=true&w=majority
PORT=5000
CLIENT_URL=http://localhost:5173
```

`server/.env.example` se sube a GitHub porque no contiene credenciales. `server/.env` no se sube.

### 6.2 Frontend — `client/.env`

El servicio Axios usa `VITE_API_URL` y, si no existe, cae en `http://localhost:5000/api`.

Para personalizarlo:

```bash
cd client
copy .env.example .env        # Windows
# cp .env.example .env        # Linux / macOS
```

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Instalación y ejecución

### 7.1 Backend

```bash
cd server
npm install
npm run seed        # crea las cuentas de prueba (requiere MONGODB_URI)
npm run dev         # inicia nodemon en http://localhost:5000
```

Verás mensajes como:

```text
✅ MongoDB conectado. Host: clusterbanco.xxxxx.mongodb.net | Base de datos: banco
🔁 Replica set detectado: atlas-xxxxx-shard-0. Transacciones multidocumento disponibles.
🚀 API escuchando en http://localhost:5000/api
```

Si `MONGODB_URI` está vacía o la conexión falla, el servidor muestra el error y **no levanta la API**.

### 7.2 Frontend

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Abre <http://localhost:5173>.

### 7.3 Orden recomendado de arranque

1. MongoDB Atlas activo (o MongoDB local con replica set).
2. `server/.env` completo.
3. `cd server && npm run seed`.
4. `cd server && npm run dev`.
5. `cd client && npm run dev`.

---

## 8. Seed de datos

```bash
cd server
npm run seed
```

Crea o actualiza sin duplicar (**upsert**) las cuentas:

| N° cuenta | Titular | Saldo inicial |
| --- | --- | --- |
| 100001 | Ana Torres | S/ 5,000.00 |
| 100002 | Carlos Pérez | S/ 3,000.00 |
| 100003 | María López | S/ 1,500.00 |

- Se puede ejecutar varias veces.
- En ejecuciones normales **no reinicia** los saldos existentes.
- `npm run seed:reset` reinicia los saldos y **borra todos los movimientos**, ideal para preparar la demostración.

```bash
npm run seed:reset
```

---

## 9. API REST

Base URL local: `http://localhost:5000/api`

Todas las respuestas usan el formato:

```json
{ "ok": true, "data": {}, "mensaje": "..." }
```

o, en caso de error:

```json
{ "ok": false, "mensaje": "..." }
```

### 9.1 Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/cuenta/:id` | Datos y saldo de la cuenta (`:id` = número de cuenta) |
| GET | `/api/cuenta/:id/historial` | Últimos 20 movimientos, más recientes primero |
| GET | `/api/cuentas` | Lista auxiliar de cuentas activas (número y titular) |
| POST | `/api/cuenta/deposito` | Registrar un depósito |
| POST | `/api/cuenta/retiro` | Registrar un retiro |
| POST | `/api/cuenta/transferencia` | Transferir entre cuentas |

### 9.2 Consultar una cuenta

```http
GET /api/cuenta/100001
```

```json
{
  "ok": true,
  "data": {
    "id": "672f1a2b3c4d5e6f7890abcd",
    "titular": "Ana Torres",
    "numeroCuenta": "100001",
    "saldo": 5000,
    "moneda": "PEN",
    "estado": "ACTIVA",
    "fechaCreacion": "2026-11-09T14:00:00.000Z"
  },
  "mensaje": "Cuenta obtenida correctamente."
}
```

### 9.3 Listar cuentas para el selector

```http
GET /api/cuentas
```

```json
{
  "ok": true,
  "data": [
    { "numeroCuenta": "100001", "titular": "Ana Torres" },
    { "numeroCuenta": "100002", "titular": "Carlos Pérez" },
    { "numeroCuenta": "100003", "titular": "María López" }
  ],
  "mensaje": "Cuentas obtenidas correctamente."
}
```

### 9.4 Depósito

```http
POST /api/cuenta/deposito
Content-Type: application/json
```

```json
{
  "numeroCuenta": "100001",
  "monto": 150.50,
  "descripcion": "Depósito de ahorro"
}
```

Respuesta `201`:

```json
{
  "ok": true,
  "data": {
    "cuenta": {
      "id": "672f1a2b3c4d5e6f7890abcd",
      "titular": "Ana Torres",
      "numeroCuenta": "100001",
      "saldo": 5150.5,
      "moneda": "PEN",
      "estado": "ACTIVA",
      "fechaCreacion": "2026-11-09T14:00:00.000Z"
    },
    "transaccion": {
      "id": "672f1a2b3c4d5e6f7890abce",
      "tipo": "DEPOSITO",
      "monto": 150.5,
      "descripcion": "Depósito de ahorro",
      "fecha": "2026-11-09T15:10:00.000Z",
      "cuentaOrigen": { "numeroCuenta": "100001", "titular": "Ana Torres" },
      "cuentaDestino": null,
      "direccion": "ENTRADA"
    }
  },
  "mensaje": "Depósito de S/ 150.50 realizado correctamente."
}
```

### 9.5 Retiro

```http
POST /api/cuenta/retiro
Content-Type: application/json
```

```json
{
  "numeroCuenta": "100001",
  "monto": 100,
  "descripcion": "Retiro en efectivo"
}
```

Respuesta `201`: misma estructura que el depósito, con `"tipo": "RETIRO"` y `"direccion": "SALIDA"`.

Error por saldo insuficiente (`400`):

```json
{
  "ok": false,
  "mensaje": "Saldo insuficiente para realizar el retiro."
}
```

### 9.6 Transferencia

```http
POST /api/cuenta/transferencia
Content-Type: application/json
```

```json
{
  "cuentaOrigen": "100001",
  "cuentaDestino": "100002",
  "monto": 500,
  "descripcion": "Pago de alquiler",
  "idempotencyKey": "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
}
```

Respuesta `201`:

```json
{
  "ok": true,
  "data": {
    "cuentaOrigen": {
      "numeroCuenta": "100001",
      "titular": "Ana Torres",
      "saldo": 4500,
      "moneda": "PEN",
      "estado": "ACTIVA"
    },
    "cuentaDestino": {
      "numeroCuenta": "100002",
      "titular": "Carlos Pérez",
      "saldo": 3500,
      "moneda": "PEN",
      "estado": "ACTIVA"
    },
    "transaccion": {
      "id": "672f1a2b3c4d5e6f7890abcf",
      "tipo": "TRANSFERENCIA",
      "monto": 500,
      "descripcion": "Pago de alquiler",
      "fecha": "2026-11-09T15:20:00.000Z",
      "cuentaOrigen": { "numeroCuenta": "100001", "titular": "Ana Torres" },
      "cuentaDestino": { "numeroCuenta": "100002", "titular": "Carlos Pérez" },
      "direccion": "SALIDA"
    }
  },
  "mensaje": "Transferencia de S/ 500.00 realizada correctamente."
}
```

Si se repite la petición con la **misma `idempotencyKey`**, la API responde `200`, devuelve la transferencia existente y **no vuelve a cobrar**:

```json
{
  "ok": true,
  "data": { "...": "la transferencia original" },
  "mensaje": "La transferencia ya había sido procesada con esta clave de idempotencia. No se realizó un nuevo cobro."
}
```

La `idempotencyKey` es opcional, pero el frontend siempre la genera con `crypto.randomUUID()`.

### 9.7 Historial

```http
GET /api/cuenta/100001/historial
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "672f1a2b3c4d5e6f7890abcf",
      "tipo": "TRANSFERENCIA",
      "monto": 500,
      "descripcion": "Pago de alquiler",
      "fecha": "2026-11-09T15:20:00.000Z",
      "cuentaOrigen": { "numeroCuenta": "100001", "titular": "Ana Torres" },
      "cuentaDestino": { "numeroCuenta": "100002", "titular": "Carlos Pérez" },
      "direccion": "SALIDA"
    }
  ],
  "mensaje": "Historial obtenido correctamente."
}
```

`direccion` se calcula respecto de la cuenta consultada: `ENTRADA` para depósitos y transferencias recibidas; `SALIDA` para retiros y transferencias enviadas.

### 9.8 Códigos HTTP

| Código | Uso |
| --- | --- |
| `200` | Consulta exitosa o transferencia idempotente repetida |
| `201` | Depósito, retiro o transferencia creada |
| `400` | Datos inválidos, saldo insuficiente, misma cuenta o cuenta inactiva |
| `404` | Cuenta no encontrada o ruta inexistente |
| `500` | Error interno del servidor |

---

## 10. Cuentas de prueba

| N° cuenta | Titular | Saldo inicial |
| --- | --- | --- |
| `100001` | Ana Torres | S/ 5,000.00 |
| `100002` | Carlos Pérez | S/ 3,000.00 |
| `100003` | María López | S/ 1,500.00 |

---

## 11. Guion de demostración paso a paso

1. **Preparar datos:** en `server/`, ejecuta `npm run seed:reset` para dejar saldos y movimientos limpios.
2. **Arrancar backend:** `npm run dev`. Verifica en consola la conexión a MongoDB y el mensaje de replica set.
3. **Arrancar frontend:** en `client/`, `npm run dev` y abre <http://localhost:5173>.
4. **Seleccionar cuenta:** en la barra superior elige `100001 · Ana Torres`. Observa el saldo y el historial vacío.
5. **Depósito:** pestaña *Depósito*, monto `250.50`, descripción `Depósito de demostración`. Confirma. Se muestra el mensaje de éxito, el saldo sube a **S/ 5,250.50** y aparece el movimiento en verde.
6. **Retiro:** pestaña *Retiro*, monto `100`, descripción `Retiro de demostración`. El saldo baja a **S/ 5,150.50** y aparece un movimiento en rojo.
7. **Transferencia:** pestaña *Transferencia*, monto `500`, cuenta destino `100002 · Carlos Pérez`. Confirma. Verifica que el saldo de Ana baja y que la transferencia aparece como **salida** en su historial.
8. **Ver la otra cara:** cambia a la cuenta `100002` en el selector. El saldo de Carlos subió y la transferencia aparece como **entrada** en su historial.
9. **Validaciones:** intenta retirar `999999`. La API responde error de saldo insuficiente y el saldo no cambia.
10. **Misma cuenta:** intenta transferir de `100001` a `100001`. El formulario y la API rechazan la operación.
11. **Idempotencia:** con la misma `idempotencyKey` de una transferencia ya realizada, repite la petición (por ejemplo, desde Postman o `curl`). La API responde `200` con el movimiento existente y no descuenta dos veces.
12. **Doble envío:** durante una operación, el botón queda deshabilitado con un spinner, evitando envíos duplicados desde la interfaz.
13. **Reset final:** ejecuta `npm run seed:reset` para dejar la demo lista para otra presentación.

### Ejemplo de reintento idempotente con curl

```bash
curl -X POST http://localhost:5000/api/cuenta/transferencia \
  -H "Content-Type: application/json" \
  -d "{\"cuentaOrigen\":\"100001\",\"cuentaDestino\":\"100002\",\"monto\":10,\"idempotencyKey\":\"clave-demo-001\"}"

# Ejecuta exactamente el mismo comando otra vez:
# la primera vez responde 201; la segunda, 200 sin volver a cobrar.
```

---

## 12. Pruebas automatizadas

```bash
cd server
npm test
```

Las pruebas usan `server/tests/api.test.js` con `node:test` + `supertest` y cubren:

- Depósito válido, negativo y cero.
- Retiro válido, mayor al saldo y negativo.
- Transferencia válida, destino inexistente, origen inexistente, misma cuenta, saldo insuficiente y reintento con la misma `idempotencyKey`.
- Operación fallida sin cambios en los saldos.
- Consulta de cuenta existente e inexistente (`404`).
- Historial con movimientos y sin movimientos.
- Cuenta inactiva.

### Base de datos de pruebas

Siempre se usa una base separada con sufijo **`_test`**:

1. Si existe `MONGODB_URI_TEST`, se usa esa cadena.
2. Si no, se deriva de `MONGODB_URI` cambiando el nombre de la base por `banco_test`.
3. Si no hay ninguna cadena configurada, se inicia automáticamente un **MongoDB real en memoria con replica set** mediante `mongodb-memory-server` y base `banco_test`. Esto permite ejecutar las pruebas sin Atlas, manteniendo transacciones reales.

Al finalizar, la base de pruebas se elimina. Las pruebas nunca tocan la base `banco` de producción.

> La primera ejecución con `mongodb-memory-server` puede tardar más porque descarga el binario de MongoDB. Si tu red lo bloquea, configura `MONGODB_URI_TEST` apuntando a Atlas o a un MongoDB local con replica set.

---

## 13. Alternativa con MongoDB local (replica set)

El código funciona **sin cambios** si cambias `MONGODB_URI` por:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/banco?replicaSet=rs0
```

Las transacciones multidocumento **no funcionan en un MongoDB standalone**. Debes iniciar MongoDB como replica set.

### Windows

```powershell
# Crear la carpeta de datos (una sola vez)
New-Item -ItemType Directory -Force C:\data\db

# Iniciar MongoDB como replica set
mongod --replSet rs0 --dbpath C:\data\db --port 27017
```

En otra terminal, inicializar el replica set:

```bash
mongosh --eval "rs.initiate()"
```

Verificar:

```bash
mongosh --eval "rs.status()"
```

### Linux / macOS

```bash
mkdir -p ~/data/db
mongod --replSet rs0 --dbpath ~/data/db --port 27017
```

```bash
mongosh --eval "rs.initiate()"
```

Luego ejecuta `npm run seed` y `npm run dev` normalmente.

---

## 14. Solución de errores frecuentes

| Error / síntoma | Causa probable | Solución |
| --- | --- | --- |
| `MONGODB_URI está vacía` | No completaste `server/.env` | Copia `.env.example` a `.env` y coloca la cadena real |
| `querySrv ENOTFOUND` | Host del clúster incorrecto o problema de DNS | Copia de nuevo la cadena desde Atlas y revisa tu red/DNS |
| `bad auth: Authentication failed` | Usuario o contraseña incorrectos | Revisa Database Access y codifica caracteres especiales de la contraseña (`@` → `%40`) |
| `Could not connect to any servers` / timeout | IP no autorizada en Atlas | En Network Access agrega `0.0.0.0/0` para la demo y espera unos minutos |
| `Transaction numbers are only allowed on a replica set member or mongos` | MongoDB local standalone | Inicia MongoDB con `--replSet rs0` y ejecuta `rs.initiate()` |
| `ECONNREFUSED` en el frontend | Backend apagado o URL incorrecta | Ejecuta `npm run dev` en `server/` y revisa `VITE_API_URL` |
| Error de CORS | `CLIENT_URL` no coincide con el origen del frontend | Usa `CLIENT_URL=http://localhost:5173` o el origen correcto |
| `EADDRINUSE` en el puerto 5000 | Otro proceso usa el puerto | Cambia `PORT` en `server/.env` y `VITE_API_URL` en `client/.env` |
| Tailwind no aplica estilos | Dependencias o configuración incompletas | Ejecuta `npm install` en `client/`, verifica `tailwind.config.js` y reinicia Vite |
| `crypto.randomUUID is not a function` | Navegador antiguo o contexto no seguro | Usa `localhost`/HTTPS y un navegador moderno; el código incluye un respaldo |
| `npm test` falla al descargar MongoDB | Red bloqueada para `mongodb-memory-server` | Configura `MONGODB_URI_TEST` con Atlas o MongoDB local |
| El seed falla con `MONGODB_URI no está definida` | `.env` incompleto | Completa `server/.env` antes de ejecutar `npm run seed` |
| El saldo no cambia tras una operación | La operación falló o se consultó otra cuenta | Revisa el mensaje de alerta y la cuenta seleccionada |

---

## 15. Scripts disponibles

### Backend (`server/`)

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia la API con nodemon |
| `npm start` | Inicia la API con Node |
| `npm run seed` | Crea/actualiza las cuentas de prueba sin duplicarlas |
| `npm run seed:reset` | Reinicia saldos y borra todos los movimientos |
| `npm test` | Ejecuta las pruebas automatizadas |

### Frontend (`client/`)

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Vite en el puerto 5173 |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |

---

## 16. Decisiones técnicas relevantes

- **Dinero en céntimos:** todos los saldos y montos se guardan como enteros (`saldoCentimos`, `montoCentimos`). La API recibe y devuelve soles; la conversión se hace en `utils/dinero.js`.
- **Transacciones:** depósitos, retiros y transferencias se ejecutan dentro de `session.withTransaction()`. Si algo falla, MongoDB revierte todos los cambios.
- **Condición de saldo:** los retiros y transferencias usan un filtro atómico `saldoCentimos: { $gte: montoCentimos }`, por lo que el saldo nunca puede quedar negativo aunque haya peticiones concurrentes.
- **Idempotencia:** `idempotencyKey` tiene índice único y se valida antes y después de la transacción. Una transferencia repetida devuelve el registro existente sin cobrar de nuevo.
- **Validación doble:** el frontend valida para dar feedback rápido; el backend valida siempre porque es la fuente de verdad.
- **Errores centralizados:** todos los errores pasan por `middleware/errorHandler.js` y mantienen el formato `{ ok: false, mensaje }`.

---

## 17. Notas de seguridad y alcance

Este proyecto es académico y no implementa autenticación de usuarios, sesiones, cifrado de datos en reposo ni auditoría avanzada. Para un entorno real se requeriría:

- Autenticación y autorización (JWT/OAuth, roles).
- HTTPS obligatorio.
- Rate limiting y protección contra ataques.
- Validación de propiedad de la cuenta (que el usuario solo opere sus cuentas).
- Registro de auditoría inmutable.
- Gestión de secretos con un vault.

La configuración `0.0.0.0/0` en Atlas y el rol amplio de base de datos son aceptables únicamente para la demostración de la asignatura.

---

## 18. Autoría

Proyecto desarrollado como entrega de la asignatura **Ingeniería Web – Unidad de Desarrollo Full-Stack**.

Siéntete libre de adaptar nombres, colores y datos de prueba para tu presentación.
