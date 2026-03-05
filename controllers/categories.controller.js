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
    const payload = { ...req.body };

    const hasCategoryId =
      payload.CategoryID !== undefined &&
      payload.CategoryID !== null &&
      String(payload.CategoryID).trim() !== "";

    // Fallback for schemas where CategoryID is not AUTO_INCREMENT.
    if (!hasCategoryId) {
      const [maxRows] = await db.query(
        "SELECT COALESCE(MAX(CategoryID), -1) AS maxId FROM categories"
      );
      payload.CategoryID = Number(maxRows?.[0]?.maxId ?? -1) + 1;
    }

    const [result] = await db.query("INSERT INTO categories SET ?", payload);
    const createdId = payload.CategoryID ?? result.insertId;

    res.status(201).json({ message: "Categoría creada", id: createdId });
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
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "No se puede eliminar la categoría porque tiene productos asociados",
      });
    }
    res.status(500).json({ error: error.message });
  }
};