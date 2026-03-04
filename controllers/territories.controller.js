const db = require("../config/db");

// GET ALL
exports.getAllTerritories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM territories");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createTerritory = async (req, res) => {
  try {
    const { TerritoryID, TerritoryDescription, RegionID } = req.body;

    const [result] = await db.query(
      "INSERT INTO territories (TerritoryID, TerritoryDescription, RegionID) VALUES (?, ?, ?)",
      [TerritoryID, TerritoryDescription, RegionID]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateTerritory = async (req, res) => {
  try {
    const { TerritoryDescription, RegionID } = req.body;

    const [result] = await db.query(
      "UPDATE territories SET TerritoryDescription = ?, RegionID = ? WHERE TerritoryID = ?",
      [TerritoryDescription, RegionID, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Territorio no encontrado" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};