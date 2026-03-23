// Modulo del proyecto: archivo de soporte para la solucion CRUD.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./config/openapi");
const { runStartupMigrations } = require("./config/startupMigrations");

const app = express();

// Middlewares globales: CORS y parseo JSON para todas las rutas API.
// Flujo por request:
// 1) Entra la peticion a Express.
// 2) Pasa por middlewares globales (cors/json).
// 3) Se enruta a /api/... segun el recurso.
// 4) El controlador ejecuta SQL con config/db y devuelve respuesta HTTP.

app.use(cors());
app.use(express.json());

// Healthcheck basico para verificar que la API esta en linea.

app.get("/", (req, res) => {
  res.json({ message: "API Northwind funcionando 🚀" });
});

// Exposicion del contrato OpenAPI en crudo y UI de Swagger.
app.get("/api-docs.json", (req, res) => {
  res.json(openApiSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Registro de rutas CRUD y modulos complementarios.
app.use("/api/categories", require("./routes/categories.routes"));
app.use("/api/suppliers", require("./routes/suppliers.routes"));
app.use("/api/shippers", require("./routes/shippers.routes"));
app.use("/api/region", require("./routes/region.routes"));
app.use("/api/customerdemographics", require("./routes/customerdemographics.routes"));
app.use("/api/products", require("./routes/products.routes"));
app.use("/api/territories", require("./routes/territories.routes"));
app.use("/api/customers", require("./routes/customers.routes"));
app.use("/api/employees", require("./routes/employees.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/order-details", require("./routes/order_details.routes"));
app.use("/api/customer-customer-demo", require("./routes/customerCustomerDemo.routes"));
app.use("/api/employee-territories", require("./routes/employeeTerritories.routes"));
app.use("/api/pdf", require("./routes/pdf.routes"));
app.use(require("./routes/firebase.routes"));


const PORT = process.env.PORT || 3000;

// Arranque controlado: primero migraciones, luego levantar servidor.
async function bootstrap() {
  try {
    // Si las migraciones de inicio fallan, el servidor no arranca para evitar estado inconsistente.
    await runStartupMigrations();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Documentación API disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la app:", error.message);
    process.exit(1);
  }
}

bootstrap();