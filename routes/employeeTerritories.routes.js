const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeTerritories.controller");

router.get("/", controller.getAllEmployeeTerritories);
router.get("/:employeeId/:territoryId", controller.getEmployeeTerritoryById);
router.post("/", controller.createEmployeeTerritory);
router.delete("/:employeeId/:territoryId", controller.deleteEmployeeTerritory);

module.exports = router;