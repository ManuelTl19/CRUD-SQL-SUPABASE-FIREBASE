const db = require("./db");

async function runStartupMigrations() {
  // Inventario
  await db.query(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT NULL"
  );
  await db.query(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS isLowStock TINYINT(1) NOT NULL DEFAULT 0"
  );

  // Ventas por pedido
  await db.query(
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pendiente'"
  );

  // Normaliza stock inicial para que no quede null
  await db.query(
    "UPDATE products SET stock = COALESCE(stock, UnitsInStock, 0)"
  );

  // Marca stock bajo segun regla escolar
  await db.query(
    "UPDATE products SET isLowStock = CASE WHEN COALESCE(stock, 0) < 10 THEN 1 ELSE 0 END"
  );
}

module.exports = { runStartupMigrations };
