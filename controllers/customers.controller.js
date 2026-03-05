const db = require("../config/db");
const customersModel = require("../modelos/customers.model");
const { sendDbError } = require("./_dbErrors");

// GET ALL
exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET BY ID
exports.getCustomerById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE CustomerID = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// CREATE
exports.createCustomer = async (req, res) => {
  try {
    const payload = customersModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO customers SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el cliente porque tiene pedidos o segmentos asociados",
    });
  }
};

// UPDATE
exports.updateCustomer = async (req, res) => {
  try {
    const payload = customersModel.updateData(req.body);

    const [result] = await db.query(
      "UPDATE customers SET ? WHERE CustomerID = ?",
      [payload, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// DELETE
exports.deleteCustomer = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM customers WHERE CustomerID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};