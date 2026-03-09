import { API_BASE_URL } from '../config/env'
import { request } from './httpClient'

async function downloadPdf(path, filename, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`No se pudo descargar PDF (${response.status})`)
  }

  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export const resourcesApi = {
  list(resourceKey) {
    return request(`/api/${resourceKey}`)
  },

  getByPath(resourceIdPath) {
    return request(`/api${resourceIdPath}`)
  },

  create(resourceKey, body) {
    return request(`/api/${resourceKey}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateByPath(resourceIdPath, body) {
    return request(`/api${resourceIdPath}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  deleteByPath(resourceIdPath) {
    return request(`/api${resourceIdPath}`, {
      method: 'DELETE',
    })
  },

  confirmSale(orderId) {
    return request(`/api/orders/${orderId}/confirm-sale`, {
      method: 'POST',
    })
  },

  registerStockOutput(productId, payload) {
    return request(`/api/products/${productId}/stock-output`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  downloadSaleNotePdf(orderId) {
    return downloadPdf(`/api/orders/${orderId}/sale-note-pdf`, `nota-venta-${orderId}.pdf`)
  },

  downloadSupplierPurchaseRequestPdf(supplierId, payload) {
    return downloadPdf(
      `/api/suppliers/${supplierId}/purchase-request-pdf`,
      `solicitud-compra-proveedor-${supplierId}.pdf`,
      {
        method: 'POST',
        body: payload,
      }
    )
  },
}
