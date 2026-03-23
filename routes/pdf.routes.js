const express = require('express')
const controller = require('../controllers/pdf.controller')

const router = express.Router()

router.post('/sale-note', controller.createSaleNotePdf)
router.post('/supplier-request', controller.createSupplierRequestPdf)

module.exports = router
