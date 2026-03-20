// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const db = require("../config/db");
const categoriesModel = require("../modelos/categories.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todas las categorías
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error, { onDuplicate: "Ya existe una categoria con ese identificador" });
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
    sendDbError(res, error);
  }
};

// Crear categoría
exports.create = async (req, res) => {
  try {
    const payload = categoriesModel.createData(req.body);

    if (!payload.CategoryID) {
      const [maxRows] = await db.query(
        "SELECT COALESCE(MAX(CategoryID), 0) AS maxId FROM categories"
      );
      payload.CategoryID = Number(maxRows?.[0]?.maxId || 0) + 1;
    }

    const [result] = await db.query(
      "INSERT INTO categories SET ?",
      payload
    );
    res.status(201).json({ message: "Categoría creada", id: payload.CategoryID || result.insertId });
  } catch (error) {
    sendDbError(res, error, { onDuplicate: "Ya existe una categoria con ese identificador" });
  }
};

// Actualizar categoría
exports.update = async (req, res) => {
  try {
    const payload = categoriesModel.updateData(req.body);
    const [result] = await db.query(
      "UPDATE categories SET ? WHERE CategoryID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría actualizada" });
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar la categoria porque tiene productos asociados",
    });
  }
};