const db = require("../config/db");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customerdemographics");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customerdemographics WHERE CustomerTypeID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tipo de cliente no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    await db.query(
      "INSERT INTO customerdemographics SET ?",
      req.body
    );
    res.status(201).json({ message: "Tipo de cliente creado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE customerdemographics SET ? WHERE CustomerTypeID = ?",
      [req.body, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de cliente no encontrado" });
    }
    res.json({ message: "Tipo de cliente actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM customerdemographics WHERE CustomerTypeID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de cliente no encontrado" });
    }
    res.json({ message: "Tipo de cliente eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};