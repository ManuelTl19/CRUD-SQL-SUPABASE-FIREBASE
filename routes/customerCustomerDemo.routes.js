const express = require("express");
const router = express.Router();
const controller = require("../controllers/customerCustomerDemo.controller");

router.get("/", controller.getAllCustomerCustomerDemo);
router.get("/:customerId/:customerTypeId", controller.getCustomerCustomerDemoById);
router.post("/", controller.createCustomerCustomerDemo);
router.delete("/:customerId/:customerTypeId", controller.deleteCustomerCustomerDemo);

module.exports = router;