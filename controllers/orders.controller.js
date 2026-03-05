const db = require("../config/db");
const ordersModel = require("../modelos/orders.model");
const { sendDbError } = require("./_dbErrors");

// GET ALL
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM orders");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET BY ID
exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE OrderID = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// CREATE
exports.createOrder = async (req, res) => {
  try {
    const payload = ordersModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO orders SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar la orden porque tiene detalles asociados",
    });
  }
};

// UPDATE
exports.updateOrder = async (req, res) => {
  try {
    const payload = ordersModel.updateData(req.body);

    const [result] = await db.query(
      "UPDATE orders SET ? WHERE OrderID = ?",
      [payload, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// DELETE
exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM orders WHERE OrderID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};