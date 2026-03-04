const db = require("../config/db");

// GET ALL
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employees");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID
exports.getEmployeeById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE EmployeeID = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE
exports.createEmployee = async (req, res) => {
  try {
    const {
      LastName,
      FirstName,
      Title,
      TitleOfCourtesy,
      BirthDate,
      HireDate,
      Address,
      City,
      Region,
      PostalCode,
      Country,
      HomePhone,
      Extension,
      Photo,
      Notes,
      ReportsTo,
      PhotoPath
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO employees 
      (LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate,
       Address, City, Region, PostalCode, Country, HomePhone,
       Extension, Photo, Notes, ReportsTo, PhotoPath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        LastName,
        FirstName,
        Title,
        TitleOfCourtesy,
        BirthDate,
        HireDate,
        Address,
        City,
        Region,
        PostalCode,
        Country,
        HomePhone,
        Extension,
        Photo,
        Notes,
        ReportsTo,
        PhotoPath
      ]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateEmployee = async (req, res) => {
  try {
    const {
      LastName,
      FirstName,
      Title,
      TitleOfCourtesy,
      BirthDate,
      HireDate,
      Address,
      City,
      Region,
      PostalCode,
      Country,
      HomePhone,
      Extension,
      Photo,
      Notes,
      ReportsTo,
      PhotoPath
    } = req.body;

    const [result] = await db.query(
      `UPDATE employees SET
        LastName = ?, 
        FirstName = ?, 
        Title = ?, 
        TitleOfCourtesy = ?, 
        BirthDate = ?, 
        HireDate = ?, 
        Address = ?, 
        City = ?, 
        Region = ?, 
        PostalCode = ?, 
        Country = ?, 
        HomePhone = ?, 
        Extension = ?, 
        Photo = ?, 
        Notes = ?, 
        ReportsTo = ?, 
        PhotoPath = ?
      WHERE EmployeeID = ?`,
      [
        LastName,
        FirstName,
        Title,
        TitleOfCourtesy,
        BirthDate,
        HireDate,
        Address,
        City,
        Region,
        PostalCode,
        Country,
        HomePhone,
        Extension,
        Photo,
        Notes,
        ReportsTo,
        PhotoPath,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
exports.deleteEmployee = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM employees WHERE EmployeeID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};