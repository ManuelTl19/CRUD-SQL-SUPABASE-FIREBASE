const db = require("../config/db");
const employeesModel = require("../modelos/employees.model");
const { sendDbError } = require("./_dbErrors");

// GET ALL
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employees");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error);
  }
};

// CREATE
exports.createEmployee = async (req, res) => {
  try {
    const payload = employeesModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO employees SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el empleado porque tiene pedidos, subordinados o territorios asociados",
    });
  }
};

// UPDATE
exports.updateEmployee = async (req, res) => {
  try {
    const payload = employeesModel.updateData(req.body);

    const [result] = await db.query(
      "UPDATE employees SET ? WHERE EmployeeID = ?",
      [payload, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
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
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el empleado porque tiene pedidos, subordinados o territorios asociados",
    });
  }
};