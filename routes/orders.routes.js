const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");

router.get("/", ordersController.getAllOrders);
router.get("/:id", ordersController.getOrderById);
router.post("/", ordersController.createOrder);
router.put("/:id", ordersController.updateOrder);
router.delete("/:id", ordersController.deleteOrder);

module.exports = router;