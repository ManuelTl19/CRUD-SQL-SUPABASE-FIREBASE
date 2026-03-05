const db = require("../config/db");
const customerDemographicsModel = require("../modelos/customerdemographics.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customerdemographics");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error);
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    const payload = customerDemographicsModel.createData(req.body);
    await db.query(
      "INSERT INTO customerdemographics SET ?",
      payload
    );
    res.status(201).json({ message: "Tipo de cliente creado" });
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el tipo de cliente porque tiene relaciones asociadas",
    });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const payload = customerDemographicsModel.updateData(req.body);
    const [result] = await db.query(
      "UPDATE customerdemographics SET ? WHERE CustomerTypeID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de cliente no encontrado" });
    }
    res.json({ message: "Tipo de cliente actualizado" });
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error);
  }
};