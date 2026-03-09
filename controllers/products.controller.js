const db = require("../config/db");
const productsModel = require("../modelos/products.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *, COALESCE(stock, UnitsInStock, 0) AS stock,
              CASE WHEN COALESCE(stock, UnitsInStock, 0) < 10 THEN 1 ELSE 0 END AS isLowStock
       FROM products`
    );
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ProductID, ProductName, SupplierID,
              COALESCE(stock, UnitsInStock, 0) AS stock,
              COALESCE(ReorderLevel, 0) AS ReorderLevel,
              CASE WHEN COALESCE(stock, UnitsInStock, 0) < 10 THEN 1 ELSE 0 END AS isLowStock
       FROM products
       WHERE COALESCE(stock, UnitsInStock, 0) < 10
       ORDER BY stock ASC`
    );
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE ProductID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    const payload = productsModel.createData(req.body);
    if (payload.stock === undefined || payload.stock === null || payload.stock === "") {
      payload.stock = Number(payload.UnitsInStock || 0);
    }
    payload.isLowStock = Number(payload.stock || 0) < 10 ? 1 : 0;

    const [result] = await db.query(
      "INSERT INTO products SET ?",
      payload
    );
    res.status(201).json({ message: "Producto creado", id: result.insertId });
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el producto porque tiene detalles de pedido asociados",
    });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const payload = productsModel.updateData(req.body);

    if (payload.stock === undefined && payload.UnitsInStock !== undefined) {
      payload.stock = Number(payload.UnitsInStock || 0);
    }

    if (payload.stock !== undefined) {
      payload.isLowStock = Number(payload.stock || 0) < 10 ? 1 : 0;
    }

    const [result] = await db.query(
      "UPDATE products SET ? WHERE ProductID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    sendDbError(res, error);
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM products WHERE ProductID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    sendDbError(res, error);
  }
};

// POST /products/:id/stock-output
exports.stockOutput = async (req, res) => {
  const productId = Number(req.params.id);
  const quantity = Number(req.body?.quantity);
  const reason = String(req.body?.reason || "Salida manual").trim() || "Salida manual";

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "ID de producto invalido" });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "Cantidad invalida" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT ProductID, ProductName,
              COALESCE(stock, UnitsInStock, 0) AS stock,
              COALESCE(UnitsInStock, 0) AS UnitsInStock
       FROM products
       WHERE ProductID = ?
       FOR UPDATE`,
      [productId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const product = rows[0];
    const currentStock = Number(product.stock || 0);
    if (currentStock < quantity) {
      await connection.rollback();
      return res.status(409).json({
        message: "No hay stock suficiente para salida de almacen",
        productId,
        productName: product.ProductName,
        stockActual: currentStock,
        requested: quantity,
      });
    }

    const nextStock = currentStock - quantity;
    const nextUnitsInStock = Math.max(Number(product.UnitsInStock || 0) - quantity, 0);

    await connection.query(
      `UPDATE products
       SET stock = ?, UnitsInStock = ?, isLowStock = ?
       WHERE ProductID = ?`,
      [nextStock, nextUnitsInStock, nextStock < 10 ? 1 : 0, productId]
    );

    await connection.commit();
    return res.json({
      message: "Salida de almacen registrada",
      productId,
      productName: product.ProductName,
      quantity,
      reason,
      stockAnterior: currentStock,
      stockActual: nextStock,
    });
  } catch (error) {
    await connection.rollback();
    return sendDbError(res, error);
  } finally {
    connection.release();
  }
};