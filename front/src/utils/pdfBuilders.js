import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function asMoney(value) {
  const amount = Number(value) || 0
  return `$${amount.toFixed(2)}`
}

function asDate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString()
  }
  return date.toLocaleString()
}

export function generateSaleNotePdf(payload) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(30, 64, 175)
  doc.text('NOTA DE VENTA', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text(`Pedido: ${payload.orderId}`, 14, 30)
  doc.text(`Cliente: ${payload.customerName}`, 14, 36)
  doc.text(`Vendedor: ${payload.sellerName}`, 14, 42)
  doc.text(`Fecha: ${asDate(payload.date)}`, 14, 48)
  doc.text(`Estado: ${payload.status || 'pendiente'}`, 14, 54)

  doc.text(`Direccion: ${payload.shippingAddress || '-'}`, 120, 30, { maxWidth: 76 })

  autoTable(doc, {
    startY: 62,
    head: [['Descripcion', 'Cantidad', 'P. Unitario', 'Total']],
    body: (payload.items || []).map((item) => [
      String(item.description || '-'),
      String(item.quantity || 0),
      asMoney(item.unitPrice),
      asMoney(item.total),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
  })

  const finalY = (doc.lastAutoTable?.finalY || 72) + 10
  doc.text(`Subtotal: ${asMoney(payload.subtotal)}`, 132, finalY)
  doc.text(`Envio: ${asMoney(payload.shipping)}`, 132, finalY + 6)
  doc.setFont(undefined, 'bold')
  doc.text(`Total: ${asMoney(payload.total)}`, 132, finalY + 14)

  doc.save(`nota-venta-${payload.orderId}.pdf`)
}

export function generateSupplierRequestPdf(payload) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(6, 95, 70)
  doc.text('SOLICITUD DE COMPRA', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text(`Proveedor: ${payload.supplierName}`, 14, 30)
  doc.text(`Contacto: ${payload.supplierContact || '-'}`, 14, 36)
  doc.text(`Solicitante: ${payload.requesterName}`, 14, 42)
  doc.text(`Area: ${payload.requesterArea}`, 14, 48)
  doc.text(`Fecha solicitud: ${asDate(payload.requestDate)}`, 14, 54)

  if (payload.neededDate) {
    doc.text(`Fecha requerida: ${payload.neededDate}`, 120, 30)
  }

  if (payload.notes) {
    doc.text(`Notas: ${payload.notes}`, 120, 36, { maxWidth: 76 })
  }

  autoTable(doc, {
    startY: 62,
    head: [['Descripcion', 'Cantidad', 'P. Unitario', 'Total']],
    body: (payload.items || []).map((item) => [
      String(item.description || '-'),
      String(item.quantity || 0),
      asMoney(item.unitPrice),
      asMoney(item.total),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [6, 95, 70] },
  })

  const finalY = (doc.lastAutoTable?.finalY || 72) + 10
  doc.setFont(undefined, 'bold')
  doc.text(`Total solicitado: ${asMoney(payload.total)}`, 130, finalY)

  const suffix = String(payload.supplierName || 'proveedor').replace(/\s+/g, '-').toLowerCase()
  doc.save(`solicitud-compra-${suffix}.pdf`)
}
