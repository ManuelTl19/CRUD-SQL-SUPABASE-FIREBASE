const { createTicketPdf } = require('./_pdfBuilder')

function normalizePayload(body, expectedLayout) {
  const payload = body && typeof body === 'object' ? body : {}
  return {
    ...payload,
    layout: expectedLayout,
  }
}

async function sendPdf(res, payload, filename) {
  const pdfBuffer = await createTicketPdf(payload)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  return res.send(pdfBuffer)
}

exports.createSaleNotePdf = async (req, res) => {
  try {
    const payload = normalizePayload(req.body, 'sale-note-invoice')
    return await sendPdf(res, payload, 'nota-venta.pdf')
  } catch (error) {
    return res.status(400).json({
      message: 'No se pudo generar PDF de nota de venta',
      detail: error?.message || 'Error inesperado',
    })
  }
}

exports.createSupplierRequestPdf = async (req, res) => {
  try {
    const payload = normalizePayload(req.body, 'supplier-invoice')
    return await sendPdf(res, payload, 'solicitud-compra.pdf')
  } catch (error) {
    return res.status(400).json({
      message: 'No se pudo generar PDF de solicitud de compra',
      detail: error?.message || 'Error inesperado',
    })
  }
}
