const db = require("../config/db");

// GET ALL
exports.getAllEmployeeTerritories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employeeterritories");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID (compuesto)
exports.getEmployeeTerritoryById = async (req, res) => {
  try {
    const { employeeId, territoryId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM employeeterritories WHERE EmployeeID = ? AND TerritoryID = ?",
      [employeeId, territoryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Relación empleado-territorio no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createEmployeeTerritory = async (req, res) => {
  try {
    const { EmployeeID, TerritoryID } = req.body;

    const [result] = await db.query(
      "INSERT INTO employeeterritories (EmployeeID, TerritoryID) VALUES (?, ?)",
      [EmployeeID, TerritoryID]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
exports.deleteEmployeeTerritory = async (req, res) => {
  try {
    const { employeeId, territoryId } = req.params;

    const [result] = await db.query(
      "DELETE FROM employeeterritories WHERE EmployeeID = ? AND TerritoryID = ?",
      [employeeId, territoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Relación empleado-territorio no encontrada" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};