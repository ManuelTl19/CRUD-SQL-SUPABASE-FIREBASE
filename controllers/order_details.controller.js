const db = require("../config/db");
const orderDetailsModel = require("../modelos/order_details.model");
const { sendDbError } = require("./_dbErrors");

// GET ALL
exports.getAllOrderDetails = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM order_details");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET BY ID (compuesto)
exports.getOrderDetailById = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM order_details WHERE OrderID = ? AND ProductID = ?",
      [orderId, productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Detalle de orden no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// CREATE
exports.createOrderDetail = async (req, res) => {
  try {
    const payload = orderDetailsModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO order_details SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// UPDATE
exports.updateOrderDetail = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const payload = orderDetailsModel.updateData(req.body);

    const [result] = await db.query(
      "UPDATE order_details SET ? WHERE OrderID = ? AND ProductID = ?",
      [payload, orderId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Detalle de orden no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// DELETE
exports.deleteOrderDetail = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const [result] = await db.query(
      "DELETE FROM order_details WHERE OrderID = ? AND ProductID = ?",
      [orderId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Detalle de orden no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};