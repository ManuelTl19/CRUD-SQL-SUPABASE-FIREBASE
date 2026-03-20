// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const router = express.Router();
const controller = require("../controllers/suppliers.controller");

// Flujo HTTP para este recurso:
// 1) Express recibe la solicitud en /api/suppliers.
// 2) Esta tabla de rutas decide que funcion del controlador ejecutar.
// 3) El controlador realiza validaciones y SQL con db.query(...).
// 4) El controlador responde JSON/PDF con codigo HTTP correspondiente.

// CRUD basico
router.get("/", controller.getAll);
router.get("/:id/purchase-request-pdf", controller.getPurchaseRequestPdf);
router.post("/:id/purchase-request-pdf", controller.getPurchaseRequestPdf);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;