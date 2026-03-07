-- Migracion escolar: inventario + ventas por estado

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS isLowStock TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pendiente';

UPDATE products
SET stock = COALESCE(stock, UnitsInStock, 0);

UPDATE products
SET isLowStock = CASE WHEN COALESCE(stock, 0) < 10 THEN 1 ELSE 0 END;
