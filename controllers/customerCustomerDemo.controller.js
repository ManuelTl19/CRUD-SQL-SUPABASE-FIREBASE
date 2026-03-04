const db = require("../config/db");

// GET ALL
exports.getAllCustomerCustomerDemo = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customercustomerdemo");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID (compuesto)
exports.getCustomerCustomerDemoById = async (req, res) => {
  try {
    const { customerId, customerTypeId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM customercustomerdemo WHERE CustomerID = ? AND CustomerTypeID = ?",
      [customerId, customerTypeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Relación cliente-tipo no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createCustomerCustomerDemo = async (req, res) => {
  try {
    const { CustomerID, CustomerTypeID } = req.body;

    const [result] = await db.query(
      "INSERT INTO customercustomerdemo (CustomerID, CustomerTypeID) VALUES (?, ?)",
      [CustomerID, CustomerTypeID]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
exports.deleteCustomerCustomerDemo = async (req, res) => {
  try {
    const { customerId, customerTypeId } = req.params;

    const [result] = await db.query(
      "DELETE FROM customercustomerdemo WHERE CustomerID = ? AND CustomerTypeID = ?",
      [customerId, customerTypeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Relación cliente-tipo no encontrada" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};