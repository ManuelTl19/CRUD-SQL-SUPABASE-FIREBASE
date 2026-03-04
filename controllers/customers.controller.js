const db = require("../config/db");

// GET ALL
exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createCustomer = async (req, res) => {
  try {
    const {
      CustomerID,
      CompanyName,
      ContactName,
      ContactTitle,
      Address,
      City,
      Region,
      PostalCode,
      Country,
      Phone,
      Fax
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO customers 
      (CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        CustomerID,
        CompanyName,
        ContactName,
        ContactTitle,
        Address,
        City,
        Region,
        PostalCode,
        Country,
        Phone,
        Fax
      ]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateCustomer = async (req, res) => {
  try {
    const {
      CompanyName,
      ContactName,
      ContactTitle,
      Address,
      City,
      Region,
      PostalCode,
      Country,
      Phone,
      Fax
    } = req.body;

    const [result] = await db.query(
      `UPDATE customers SET 
        CompanyName = ?, 
        ContactName = ?, 
        ContactTitle = ?, 
        Address = ?, 
        City = ?, 
        Region = ?, 
        PostalCode = ?, 
        Country = ?, 
        Phone = ?, 
        Fax = ?
      WHERE CustomerID = ?`,
      [
        CompanyName,
        ContactName,
        ContactTitle,
        Address,
        City,
        Region,
        PostalCode,
        Country,
        Phone,
        Fax,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};