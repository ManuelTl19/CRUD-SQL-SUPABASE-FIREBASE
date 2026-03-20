// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const router = express.Router();
const controller = require("../controllers/products.controller");

// Consultas de lectura.
router.get("/", controller.getAll);
router.get("/low-stock", controller.getLowStock);

// Operacion de inventario adicional al CRUD.
router.post("/:id/stock-output", controller.stockOutput);

// CRUD por identificador.
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;