# CRUD SQL SUPABASE FIREBASE (Northwind API)

API REST construida con **Node.js + Express + MySQL** para operar datos de Northwind mediante endpoints CRUD.

## 1) ¿Qué incluye este backend?

- API REST con rutas por recurso (`/api/...`).
- Conexión a base de datos MySQL usando `mysql2`.
- Documentación OpenAPI/Swagger embebida.
- CORS habilitado.
- Parseo de JSON en body (`express.json()`).

## 2) Stack técnico

- Node.js (CommonJS)
- Express `5.x`
- MySQL2
- Dotenv
- Swagger UI Express
- Nodemon (desarrollo)

## 3) Estructura del proyecto

```text
config/
  db.js            # pool de conexión a MySQL
  openapi.js       # especificación OpenAPI 3.0.3
controllers/       # lógica de negocio por recurso
routes/            # definición de endpoints
server.js          # arranque del servidor y middlewares
package.json
```

## 4) Requisitos previos

- Node.js 18+ (recomendado).
- Base de datos MySQL con esquema Northwind (tablas usadas en esta API).
- npm.

## 5) Instalación

```bash
npm install
```

## 6) Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=northwind
```

### Variables utilizadas por el código

- `PORT` (opcional; default: `3000`)
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## 7) Ejecutar el servidor

### Desarrollo (auto-reload)

```bash
npm run dev
```

### Producción

```bash
npm start
```

## 8) Healthcheck y documentación

- Healthcheck: `GET /`
  - Respuesta: `{ "message": "API Northwind funcionando 🚀" }`
- OpenAPI JSON: `GET /api-docs.json`
- Swagger UI: `GET /api-docs`

URL local esperada:

- `http://localhost:3000/`
- `http://localhost:3000/api-docs`

## 9) Arquitectura de la API

Patrón general:

1. La ruta recibe request (`routes/*.routes.js`).
2. El controlador ejecuta query SQL (`controllers/*.controller.js`).
3. Se responde JSON con datos/resultados.

Manejo de errores:

- `500` cuando ocurre error de SQL/servidor: `{ error: error.message }`
- `404` cuando no existe registro buscado: `{ message: "... no encontrado" }`

## 10) Recursos expuestos

> Prefijo base: `/api`

### A) Recursos con ID simple (CRUD completo)

Cada uno expone:

- `GET /recurso`
- `GET /recurso/:id`
- `POST /recurso`
- `PUT /recurso/:id`
- `DELETE /recurso/:id`

| Recurso | Base path | PK usada en SQL |
|---|---|---|
| Categories | `/categories` | `CategoryID` |
| Suppliers | `/suppliers` | `SupplierID` |
| Shippers | `/shippers` | `ShipperID` |
| Region | `/region` | `RegionID` |
| CustomerDemographics | `/customerdemographics` | `CustomerTypeID` |
| Products | `/products` | `ProductID` |
| Territories | `/territories` | `TerritoryID` |
| Customers | `/customers` | `CustomerID` |
| Employees | `/employees` | `EmployeeID` |
| Orders | `/orders` | `OrderID` |

### B) Recursos con clave compuesta

#### `OrderDetails` (`/order-details`) — CRUD completo compuesto

- `GET /order-details`
- `GET /order-details/:orderId/:productId`
- `POST /order-details`
- `PUT /order-details/:orderId/:productId`
- `DELETE /order-details/:orderId/:productId`

PK compuesta en SQL:

- `OrderID`
- `ProductID`

#### `CustomerCustomerDemo` (`/customer-customer-demo`) — sin `PUT`

- `GET /customer-customer-demo`
- `GET /customer-customer-demo/:customerId/:customerTypeId`
- `POST /customer-customer-demo`
- `DELETE /customer-customer-demo/:customerId/:customerTypeId`

PK compuesta en SQL:

- `CustomerID`
- `CustomerTypeID`

#### `EmployeeTerritories` (`/employee-territories`) — sin `PUT`

- `GET /employee-territories`
- `GET /employee-territories/:employeeId/:territoryId`
- `POST /employee-territories`
- `DELETE /employee-territories/:employeeId/:territoryId`

PK compuesta en SQL:

- `EmployeeID`
- `TerritoryID`

## 11) Formato de respuestas (comportamiento real)

Dependiendo del controlador, las respuestas de escritura varían:

- Algunos recursos devuelven mensaje amigable:
  - Ejemplo: `{ "message": "Producto creado", "id": 78 }`
- Otros devuelven directamente el resultado MySQL:
  - Ejemplo: `{ "affectedRows": 1, "insertId": 11078, ... }`

Esto es normal en este proyecto, porque no todos los controladores usan el mismo formato de salida.

## 12) Ejemplos rápidos con cURL

### Listar categorías

```bash
curl http://localhost:3000/api/categories
```

### Obtener producto por ID

```bash
curl http://localhost:3000/api/products/1
```

### Crear categoría

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"CategoryName":"Bebidas","Description":"Refrescos"}'
```

### Actualizar order-detail (clave compuesta)

```bash
curl -X PUT http://localhost:3000/api/order-details/10248/11 \
  -H "Content-Type: application/json" \
  -d '{"UnitPrice":18,"Quantity":10,"Discount":0.1}'
```

### Eliminar relación employee-territory

```bash
curl -X DELETE http://localhost:3000/api/employee-territories/1/01581
```

## 13) OpenAPI/Swagger

La especificación se genera desde `config/openapi.js`:

- OpenAPI: `3.0.3`
- Título: `Northwind API`
- Versión: `1.0.0`
- Servidor documentado: `http://localhost:3000`

Incluye rutas genéricas para todos los recursos y detalles específicos para:

- `categories`
- `orders`
- `order-details`

## 14) Notas importantes para el equipo

- La API usa consultas parametrizadas (`?`) y `SET ?` para inserts/updates.
- No hay autenticación/autorización implementada.
- No hay capa de validación de esquema (Joi/Zod/Yup) en requests.
- No hay tests automáticos configurados actualmente.
- Si quieres homogeneizar respuestas, conviene crear una capa común de respuesta (ej. `success`, `error`, `data`).

## 15) Funcionalidades escolares (MySQL)

Se agrego soporte para inventario/ventas y PDFs usando Northwind actual:

- Migracion SQL: `tools/school-project-mysql.sql`
- Migracion automatica al iniciar: `config/startupMigrations.js`

Cambios de esquema:

- `products.stock` (INT)
- `products.isLowStock` (TINYINT)
- `orders.status` (VARCHAR) con default `pendiente`

Reglas aplicadas:

- Stock bajo cuando `stock < 10`.
- Al confirmar venta se descuenta stock por `order_details`.
- El pedido se marca `vendido`.

Endpoints nuevos:

- `GET /api/products/low-stock`
- `POST /api/products/:id/stock-output`
- `POST /api/orders/:id/confirm-sale`
- `GET /api/orders/:id/sale-note-pdf`
- `GET /api/suppliers/:id/purchase-request-pdf`
- `POST /api/suppliers/:id/purchase-request-pdf`

Interfaz:

- En `Pedidos`: botones `Confirmar venta` y `Generar nota venta (PDF)`.
- En `Proveedores`: boton `Solicitud compra (PDF)` + solicitud por tarjeta con picker.
- En `Productos`: campos `stock` e `isLowStock` visibles/editables + boton `Salida almacen` + boton por tarjeta `Solicitar a proveedor`.

## 17) Cumplimiento del objetivo del proyecto

Objetivo solicitado:

> Desarrollar aplicaciones web utilizando MySQL que integre acciones CRUD y acciones de gestion para inventario (salida de almacen), pedidos, ventas; generando archivos PDF para notas de venta y solicitud de compra a proveedores.

Matriz de cumplimiento:

- CRUD web + MySQL:
  - API REST CRUD para recursos Northwind (`/api/categories`, `/api/products`, `/api/orders`, etc.).
  - Frontend React con alta, edicion, eliminacion y consulta.
- Inventario (salida de almacen):
  - `POST /api/products/:id/stock-output` descuenta stock con validacion y actualiza `isLowStock`.
  - `GET /api/products/low-stock` para monitoreo de reposicion.
- Pedidos y ventas:
  - `POST /api/orders/:id/confirm-sale` confirma venta, marca pedido como `vendido` y descuenta stock por `order_details`.
  - `GET /api/orders/:id/sale-note-pdf` genera nota de venta PDF.
- Solicitud de compra a proveedores (PDF):
  - `POST /api/suppliers/:id/purchase-request-pdf` genera PDF de solicitud con multiples productos, cantidad y descripcion.
  - Flujo disponible desde vista `products` y `suppliers`.

Checklist de demo final (aceptacion):

1. CRUD: crear/editar/eliminar un producto y verificar en listado.
2. Salida de almacen: ejecutar `Salida almacen` y comprobar reduccion de stock.
3. Venta: confirmar un pedido y verificar cambio de estado + descuento de inventario.
4. PDF de venta: descargar `nota-venta-<OrderID>.pdf`.
5. PDF proveedor: generar solicitud con 2 productos del mismo proveedor y descargar PDF.

## 16) Troubleshooting

### Error de conexión a DB

Verifica `.env`:

- host/usuario/password/base de datos correctos
- puerto MySQL accesible

### `Table ... doesn't exist`

La API espera tablas de Northwind con estos nombres exactos (ejemplos):

- `categories`, `products`, `orders`, `order_details`, `customers`, `employees`, etc.

### Puerto ocupado

Cambia `PORT` en `.env`.

---

Si quieres, en el siguiente paso te puedo dejar un `README` aún más pro con:

- matriz completa de payloads esperados por recurso,
- colección Postman,
- y plan para estandarizar todas las respuestas JSON en una sola convención.
