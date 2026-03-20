// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const router = express.Router();
const territoriesController = require("../controllers/territories.controller");

router.get("/", territoriesController.getAllTerritories);
router.get("/:id", territoriesController.getTerritoryById);
router.post("/", territoriesController.createTerritory);
router.put("/:id", territoriesController.updateTerritory);
router.delete("/:id", territoriesController.deleteTerritory);

module.exports = router;