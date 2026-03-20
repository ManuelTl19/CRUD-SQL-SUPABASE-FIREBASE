// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const router = express.Router();
const controller = require("../controllers/shippers.controller");

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;