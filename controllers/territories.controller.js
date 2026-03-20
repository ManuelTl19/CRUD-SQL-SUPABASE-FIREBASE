// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const db = require("../config/db");
const territoriesModel = require("../modelos/territories.model");
const { sendDbError } = require("./_dbErrors");

// GET ALL
exports.getAllTerritories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM territories");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET BY ID
exports.getTerritoryById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM territories WHERE TerritoryID = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Territorio no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// CREATE
exports.createTerritory = async (req, res) => {
  try {
    const payload = territoriesModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO territories SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el territorio porque tiene empleados asociados",
    });
  }
};

// UPDATE
exports.updateTerritory = async (req, res) => {
  try {
    const payload = territoriesModel.updateData(req.body);

    const [result] = await db.query(
      "UPDATE territories SET ? WHERE TerritoryID = ?",
      [payload, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Territorio no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// DELETE
exports.deleteTerritory = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM territories WHERE TerritoryID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Territorio no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};