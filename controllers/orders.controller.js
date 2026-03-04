const db = require("../config/db");

// GET ALL
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM orders");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createOrder = async (req, res) => {
  try {
    const {
      CustomerID,
      EmployeeID,
      OrderDate,
      RequiredDate,
      ShippedDate,
      ShipVia,
      Freight,
      ShipName,
      ShipAddress,
      ShipCity,
      ShipRegion,
      ShipPostalCode,
      ShipCountry
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO orders
      (CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate,
       ShipVia, Freight, ShipName, ShipAddress, ShipCity,
       ShipRegion, ShipPostalCode, ShipCountry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        CustomerID,
        EmployeeID,
        OrderDate,
        RequiredDate,
        ShippedDate,
        ShipVia,
        Freight,
        ShipName,
        ShipAddress,
        ShipCity,
        ShipRegion,
        ShipPostalCode,
        ShipCountry
      ]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateOrder = async (req, res) => {
  try {
    const {
      CustomerID,
      EmployeeID,
      OrderDate,
      RequiredDate,
      ShippedDate,
      ShipVia,
      Freight,
      ShipName,
      ShipAddress,
      ShipCity,
      ShipRegion,
      ShipPostalCode,
      ShipCountry
    } = req.body;

    const [result] = await db.query(
      `UPDATE orders SET
        CustomerID = ?,
        EmployeeID = ?,
        OrderDate = ?,
        RequiredDate = ?,
        ShippedDate = ?,
        ShipVia = ?,
        Freight = ?,
        ShipName = ?,
        ShipAddress = ?,
        ShipCity = ?,
        ShipRegion = ?,
        ShipPostalCode = ?,
        ShipCountry = ?
      WHERE OrderID = ?`,
      [
        CustomerID,
        EmployeeID,
        OrderDate,
        RequiredDate,
        ShippedDate,
        ShipVia,
        Freight,
        ShipName,
        ShipAddress,
        ShipCity,
        ShipRegion,
        ShipPostalCode,
        ShipCountry,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};