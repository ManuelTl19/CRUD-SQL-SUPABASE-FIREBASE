// Configuracion de infraestructura para la API (DB, OpenAPI, registro y bootstrap).
require("dotenv").config();
const mysql = require("mysql2");

// Flujo de conexion:
// 1) dotenv carga variables desde .env.
// 2) createPool crea un pool reutilizable para todas las peticiones.
// 3) Cada controlador usa db.query(...) sin abrir/cerrar conexion manual por request.
// 4) pool.promise() permite trabajar con async/await en toda la capa de controladores.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Se exporta una unica instancia compartida para centralizar acceso a MySQL.
module.exports = pool.promise();