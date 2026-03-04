const db = require("../config/db");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM region");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM region WHERE RegionID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Región no encontrada" });
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
      "INSERT INTO region SET ?",
      req.body
    );
    res.status(201).json({ message: "Región creada", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE region SET ? WHERE RegionID = ?",
      [req.body, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Región no encontrada" });
    }
    res.json({ message: "Región actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM region WHERE RegionID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Región no encontrada" });
    }
    res.json({ message: "Región eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};