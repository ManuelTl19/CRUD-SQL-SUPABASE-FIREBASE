// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const db = require("../config/db");
const regionModel = require("../modelos/region.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM region");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error);
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    const payload = regionModel.createData(req.body);
    const [result] = await db.query(
      "INSERT INTO region SET ?",
      payload
    );
    res.status(201).json({ message: "Región creada", id: result.insertId });
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar la region porque tiene territorios asociados",
    });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const payload = regionModel.updateData(req.body);
    const [result] = await db.query(
      "UPDATE region SET ? WHERE RegionID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Región no encontrada" });
    }
    res.json({ message: "Región actualizada" });
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error);
  }
};