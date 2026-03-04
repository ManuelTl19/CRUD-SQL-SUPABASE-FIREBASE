const db = require("../config/db");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM suppliers");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE SupplierID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    const [result] = await db.query(
      "INSERT INTO suppliers SET ?",
      req.body
    );
    res.status(201).json({ message: "Proveedor creado", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE suppliers SET ? WHERE SupplierID = ?",
      [req.body, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM suppliers WHERE SupplierID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};