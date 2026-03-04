require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./config/openapi");

const app = express();

/* ======================
   MIDDLEWARES
====================== */

app.use(cors());
app.use(express.json());

/* ======================
   RUTA DE PRUEBA
====================== */

app.get("/", (req, res) => {
  res.json({ message: "API Northwind funcionando 🚀" });
});

app.get("/api-docs.json", (req, res) => {
  res.json(openApiSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});