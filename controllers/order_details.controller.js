const db = require("../config/db");

// GET ALL
exports.getAllOrderDetails = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM order_details");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createOrderDetail = async (req, res) => {
  try {
    const { OrderID, ProductID, UnitPrice, Quantity, Discount } = req.body;

    const [result] = await db.query(
      `INSERT INTO order_details 
      (OrderID, ProductID, UnitPrice, Quantity, Discount)
      VALUES (?, ?, ?, ?, ?)`,
      [OrderID, ProductID, UnitPrice, Quantity, Discount]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateOrderDetail = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { UnitPrice, Quantity, Discount } = req.body;

    const [result] = await db.query(
      `UPDATE order_details SET
        UnitPrice = ?,
        Quantity = ?,
        Discount = ?
      WHERE OrderID = ? AND ProductID = ?`,
      [UnitPrice, Quantity, Discount, orderId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Detalle de orden no encontrado" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};