// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const db = require("../config/db");
const shippersModel = require("../modelos/shippers.model");
const { sendDbError } = require("./_dbErrors");

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM shippers");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM shippers WHERE ShipperID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Shipper no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    const payload = shippersModel.createData(req.body);
    const [result] = await db.query(
      "INSERT INTO shippers SET ?",
      payload
    );
    res.status(201).json({ message: "Shipper creado", id: result.insertId });
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el transportista porque tiene pedidos asociados",
    });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const payload = shippersModel.updateData(req.body);
    const [result] = await db.query(
      "UPDATE shippers SET ? WHERE ShipperID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper no encontrado" });
    }
    res.json({ message: "Shipper actualizado" });
  } catch (error) {
    sendDbError(res, error);
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM shippers WHERE ShipperID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper no encontrado" });
    }
    res.json({ message: "Shipper eliminado" });
  } catch (error) {
    sendDbError(res, error);
  }
};