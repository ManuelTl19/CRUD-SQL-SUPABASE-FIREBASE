// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const router = express.Router();
const controller = require("../controllers/order_details.controller");

router.get("/", controller.getAllOrderDetails);
router.get("/:orderId/:productId", controller.getOrderDetailById);
router.post("/", controller.createOrderDetail);
router.put("/:orderId/:productId", controller.updateOrderDetail);
router.delete("/:orderId/:productId", controller.deleteOrderDetail);

module.exports = router;