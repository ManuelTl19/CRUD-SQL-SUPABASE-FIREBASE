const db = require("../config/db");
const productsModel = require("../modelos/products.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
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