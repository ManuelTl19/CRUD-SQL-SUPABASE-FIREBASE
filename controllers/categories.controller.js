const db = require("../config/db");

// Obtener todas las categorías
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener categoría por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM categories WHERE CategoryID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear categoría
exports.create = async (req, res) => {
  try {
    const [result] = await db.query(
      "INSERT INTO categories SET ?",
      req.body
    );
    res.status(201).json({ message: "Categoría creada", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar categoría
exports.update = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE categories SET ? WHERE CategoryID = ?",
      [req.body, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar categoría
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM categories WHERE CategoryID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};