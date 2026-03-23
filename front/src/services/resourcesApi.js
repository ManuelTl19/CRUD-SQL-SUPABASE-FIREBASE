// Servicio frontend: centraliza comunicacion HTTP y acceso a fuentes de datos.
import { API_BASE_URL } from '../config/env'
import { RESOURCES } from '../config/resources'
import { request } from './httpClient'
import { getDataSource } from './dataSource'
import { supabase } from './supabaseClient'

const RESOURCE_TABLE_CANDIDATES = {
  'order-details': ['order_details', 'orderdetails'],
  'customer-customer-demo': [
    'customer_customer_demo',
    'customercustomerdemo',
    'customer_customerdemo',
  ],
  'employee-territories': [
    'employee_territories',
    'employeeterritories',
    'employee_territory',
  ],
  customerdemographics: [
    'customer_demographics',
    'customerdemographics',
    'customer_demographic',
  ],
}

function getResourceMeta(resourceKey) {
  return RESOURCES.find((entry) => entry.key === resourceKey) || null
}

function normalizeLoose(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, '')
}

function toDbFieldName(fieldName) {
  return String(fieldName || '').replace(/_/g, '').toLowerCase()
}

function toSnakeCaseName(fieldName) {
  return String(fieldName || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function getTableCandidates(resourceKey) {
  const configured = RESOURCE_TABLE_CANDIDATES[resourceKey]
  if (Array.isArray(configured) && configured.length > 0) {
    return configured
  }
  return [resourceKey]
}

function isMissingTableError(error) {
  const code = String(error?.code || '')
  const message = String(error?.message || '').toLowerCase()

  if (code === 'PGRST205' || code === '42P01') {
    return true
  }

  return (
    message.includes('could not find the table') ||
    (message.includes('relation') && message.includes('does not exist'))
  )
}

async function runSupabaseWithTableFallback(resourceKey, operation) {
  const candidates = Array.from(new Set(getTableCandidates(resourceKey)))
  let lastMissingTableError = null

  for (const table of candidates) {
    const result = await operation(table)
    if (!result?.error) {
      return { ...result, table }
    }

    if (isMissingTableError(result.error)) {
      lastMissingTableError = result.error
      continue
    }

    throw createSupabaseError(`No se pudo operar ${resourceKey}`, result.error)
  }

  throw createSupabaseError(
    `No se encontro una tabla valida para ${resourceKey}`,
    lastMissingTableError
  )
}

function findRowValueByField(row, fieldName) {
  if (!row || typeof row !== 'object') {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(row, fieldName)) {
    return row[fieldName]
  }

  const desired = normalizeLoose(fieldName)
  const rowKeys = Object.keys(row)

  const exactLooseMatch = rowKeys.find((key) => normalizeLoose(key) === desired)
  if (exactLooseMatch) {
    return row[exactLooseMatch]
  }

  const snakeCandidate = toSnakeCaseName(fieldName)
  if (Object.prototype.hasOwnProperty.call(row, snakeCandidate)) {
    return row[snakeCandidate]
  }

  const compactCandidate = toDbFieldName(fieldName)
  if (Object.prototype.hasOwnProperty.call(row, compactCandidate)) {
    return row[compactCandidate]
  }

  return undefined
}

function toAppRow(resourceKey, row) {
  const resource = getResourceMeta(resourceKey)
  if (!resource || !row || typeof row !== 'object') {
    return row
  }

  const wantedFields = Array.from(
    new Set([...(resource.formFields || []), ...(resource.idKeys || [])])
  )

  const mapped = {}

  wantedFields.forEach((field) => {
    const value = findRowValueByField(row, field)
    if (value !== undefined) {
      mapped[field] = value
    }
  })

  Object.keys(row).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(mapped, key)) {
      mapped[key] = row[key]
    }
  })

  return mapped
}

function toDbPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [toDbFieldName(key), value])
  )
}

function parseResourceIdPath(resourceIdPath) {
  const normalized = String(resourceIdPath || '').replace(/^\/+/, '')
  const parts = normalized.split('/').filter(Boolean)
  const [resourceKey, ...idValuesRaw] = parts

  return {
    resourceKey,
    idValues: idValuesRaw.map((value) => decodeURIComponent(value)),
  }
}

function applyIdFilters(query, resource, idValues) {
  return resource.idKeys.reduce((current, idField, index) => {
    return current.eq(toDbFieldName(idField), idValues[index])
  }, query)
}

function createSupabaseError(message, error) {
  const detail = error?.message ? `: ${error.message}` : ''
  return new Error(`${message}${detail}`)
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getFirstValue(row, candidates) {
  for (const field of candidates) {
    const value = findRowValueByField(row, field)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return undefined
}

function getOrderId(row) {
  return toFiniteNumber(getFirstValue(row, ['OrderID', 'orderid']))
}

function getProductId(row) {
  return toFiniteNumber(getFirstValue(row, ['ProductID', 'productid']))
}

function getSupplierId(row) {
  return toFiniteNumber(getFirstValue(row, ['SupplierID', 'supplierid']))
}

function getProductName(row) {
  return String(getFirstValue(row, ['ProductName', 'productname']) || 'Producto')
}

function getQuantity(row) {
  return toFiniteNumber(getFirstValue(row, ['Quantity', 'quantity']), 0)
}

function getUnitPrice(row) {
  return toFiniteNumber(getFirstValue(row, ['UnitPrice', 'unitprice']), 0)
}

function getDiscountRatio(row) {
  return toFiniteNumber(getFirstValue(row, ['Discount', 'discount']), 0)
}

function getStockFieldName(row) {
  if (findRowValueByField(row, 'stock') !== undefined) {
    return 'stock'
  }
  if (findRowValueByField(row, 'UnitsInStock') !== undefined) {
    return 'UnitsInStock'
  }
  if (findRowValueByField(row, 'unitsinstock') !== undefined) {
    return 'UnitsInStock'
  }
  return 'stock'
}

function getStockValue(row) {
  return toFiniteNumber(getFirstValue(row, ['stock', 'UnitsInStock', 'unitsinstock']), 0)
}

function getReorderLevel(row) {
  return toFiniteNumber(getFirstValue(row, ['ReorderLevel', 'reorderlevel']), 0)
}

function isOrderSoldRow(row) {
  return String(
    getFirstValue(row, [
      'status',
      'Status',
      'orderstatus',
      'OrderStatus',
      'estado',
      'Estado',
    ]) || ''
  )
    .toLowerCase()
    .trim() === 'vendido'
}

function getOrderStatusFieldName(row) {
  if (findRowValueByField(row, 'status') !== undefined) {
    return 'status'
  }
  if (findRowValueByField(row, 'Status') !== undefined) {
    return 'Status'
  }
  if (findRowValueByField(row, 'orderstatus') !== undefined) {
    return 'orderstatus'
  }
  if (findRowValueByField(row, 'OrderStatus') !== undefined) {
    return 'OrderStatus'
  }
  if (findRowValueByField(row, 'estado') !== undefined) {
    return 'estado'
  }
  if (findRowValueByField(row, 'Estado') !== undefined) {
    return 'Estado'
  }
  return null
}

function toMoney(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

function buildFullName(firstName, lastName) {
  return String(`${firstName || ''} ${lastName || ''}`)
    .trim()
}

async function supabaseBuildOrderContext(orderId) {
  const numericOrderId = toFiniteNumber(orderId)
  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    throw new Error('Pedido invalido')
  }

  const [orders, details, products] = await Promise.all([
    supabaseList('orders'),
    supabaseList('order-details'),
    supabaseList('products'),
  ])

  const order = orders.find((row) => getOrderId(row) === numericOrderId)
  if (!order) {
    throw new Error(`No existe el pedido ${numericOrderId}`)
  }

  const orderDetails = details.filter((row) => getOrderId(row) === numericOrderId)
  if (orderDetails.length === 0) {
    throw new Error(`El pedido ${numericOrderId} no tiene detalle`) 
  }

  const productsById = new Map(
    products
      .map((row) => [getProductId(row), row])
      .filter(([id]) => Number.isInteger(id) && id > 0)
  )

  return {
    orderId: numericOrderId,
    order,
    orderDetails,
    productsById,
  }
}

async function supabaseConfirmSale(orderId) {
  const context = await supabaseBuildOrderContext(orderId)

  if (isOrderSoldRow(context.order)) {
    return { message: 'La venta ya estaba confirmada' }
  }

  const shortages = []

  context.orderDetails.forEach((detail) => {
    const productId = getProductId(detail)
    const quantity = getQuantity(detail)
    const product = context.productsById.get(productId)
    const stock = getStockValue(product)

    if (!product || stock < quantity) {
      shortages.push({
        productId,
        productName: product ? getProductName(product) : `Producto ${productId}`,
      })
    }
  })

  if (shortages.length > 0) {
    throw new Error('No hay stock suficiente para confirmar esta venta')
  }

  const groupedByProduct = new Map()
  context.orderDetails.forEach((detail) => {
    const productId = getProductId(detail)
    const current = groupedByProduct.get(productId) || 0
    groupedByProduct.set(productId, current + getQuantity(detail))
  })

  for (const [productId, totalQty] of groupedByProduct.entries()) {
    const currentProduct = context.productsById.get(productId)
    const stockBefore = getStockValue(currentProduct)
    const stockAfter = stockBefore - totalQty
    const stockField = getStockFieldName(currentProduct)
    const reorderLevel = getReorderLevel(currentProduct)

    const payload = {
      [stockField]: stockAfter,
    }

    if (findRowValueByField(currentProduct, 'isLowStock') !== undefined) {
      payload.isLowStock = stockAfter <= reorderLevel
    }

    await supabaseUpdateByPath(`/products/${productId}`, payload)
  }

  const statusField = getOrderStatusFieldName(context.order)
  if (statusField) {
    await supabaseUpdateByPath(
      `/orders/${context.orderId}`,
      {
        [statusField]: 'vendido',
      },
      { skipOrderSaleHook: true }
    )
  }

  return { message: 'Venta confirmada' }
}

async function supabaseRegisterStockOutput(productId, payload) {
  const numericProductId = toFiniteNumber(productId)
  const quantity = toFiniteNumber(payload?.quantity)

  if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
    throw new Error('Producto invalido')
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Cantidad invalida')
  }

  const product = await supabaseGetByPath(`/products/${numericProductId}`)
  if (!product) {
    throw new Error(`No existe el producto ${numericProductId}`)
  }

  const stockBefore = getStockValue(product)
  if (stockBefore < quantity) {
    throw new Error('No hay stock suficiente para registrar la salida')
  }

  const stockAfter = stockBefore - quantity
  const stockField = getStockFieldName(product)
  const reorderLevel = getReorderLevel(product)

  const updatePayload = {
    [stockField]: stockAfter,
  }

  if (findRowValueByField(product, 'isLowStock') !== undefined) {
    updatePayload.isLowStock = stockAfter <= reorderLevel
  }

  await supabaseUpdateByPath(`/products/${numericProductId}`, updatePayload)

  return {
    productName: getProductName(product),
    stockAnterior: stockBefore,
    stockActual: stockAfter,
  }
}

async function supabaseDownloadSaleNotePdf(orderId) {
  const context = await supabaseBuildOrderContext(orderId)

  const [customers, employees] = await Promise.all([
    supabaseList('customers'),
    supabaseList('employees'),
  ])

  const customerId = String(getFirstValue(context.order, ['CustomerID', 'customerid']) || '')
  const employeeId = toFiniteNumber(getFirstValue(context.order, ['EmployeeID', 'employeeid']))

  const customer = customers.find(
    (row) => String(getFirstValue(row, ['CustomerID', 'customerid']) || '') === customerId
  )

  const employee = employees.find(
    (row) => toFiniteNumber(getFirstValue(row, ['EmployeeID', 'employeeid'])) === employeeId
  )

  let productSubtotal = 0
  let discountTotal = 0

  const items = context.orderDetails.map((detail) => {
    const product = context.productsById.get(getProductId(detail))
    const quantity = getQuantity(detail)
    const unitPrice = getUnitPrice(detail)
    const discount = getDiscountRatio(detail)
    const grossLineTotal = quantity * unitPrice
    const discountAmount = grossLineTotal * discount
    const lineTotal = grossLineTotal - discountAmount

    productSubtotal += grossLineTotal
    discountTotal += discountAmount

    return {
      name: product ? getProductName(product) : `Producto ${getProductId(detail)}`,
      qty: String(quantity),
      price: toMoney(unitPrice),
      total: toMoney(lineTotal),
    }
  })

  const shipping = toFiniteNumber(getFirstValue(context.order, ['Freight', 'freight']), 0)
  const finalTotal = productSubtotal - discountTotal + shipping
  const saleDate = String(
    getFirstValue(context.order, ['ShippedDate', 'shippeddate']) ||
      getFirstValue(context.order, ['OrderDate', 'orderdate']) ||
      new Date().toISOString()
  )

  const payload = {
    layout: 'sale-note-invoice',
    title: 'NOTA DE VENTA',
    brandName: 'Northwind',
    brandSubtitle: 'Punto de Venta',
    items,
    invoice: {
      customerName: String(
        getFirstValue(context.order, ['ShipName', 'shipname']) ||
          getFirstValue(customer, ['CompanyName', 'companyname']) ||
          customerId ||
          'Cliente N/A'
      ),
      sellerName:
        buildFullName(
          getFirstValue(employee, ['FirstName', 'firstname']),
          getFirstValue(employee, ['LastName', 'lastname'])
        ) || String(employeeId || 'Sin asignar'),
      orderCode: `NV-${String(context.orderId).padStart(5, '0')}`,
      requestDate: saleDate,
      shippingAddress: String(
        [
          getFirstValue(context.order, ['ShipAddress', 'shipaddress']),
          getFirstValue(context.order, ['ShipCity', 'shipcity']),
          getFirstValue(context.order, ['ShipRegion', 'shipregion']),
          getFirstValue(context.order, ['ShipPostalCode', 'shippostalcode']),
          getFirstValue(context.order, ['ShipCountry', 'shipcountry']),
        ]
          .filter(Boolean)
          .join(', ') || '-'
      ),
      status: String(getFirstValue(context.order, ['status', 'Status']) || 'vendido'),
    },
    totals: [
      { label: 'Subtotal productos', value: toMoney(productSubtotal) },
      { label: 'Costo de envio', value: toMoney(shipping) },
      { label: 'Descuento', value: toMoney(discountTotal), negative: true },
      { label: 'Total', value: toMoney(finalTotal), bold: true },
    ],
    invoiceNotes: 'Documento generado despues de confirmar la venta.',
    footerThanks: 'Gracias por su compra y preferencia.',
    footerCompany: 'Northwind Ventas',
  }

  return downloadPdf('/api/pdf/sale-note', `nota-venta-${context.orderId}.pdf`, {
    method: 'POST',
    body: payload,
  })
}

async function supabaseDownloadSupplierPurchaseRequestPdf(supplierId, payload) {
  const numericSupplierId = toFiniteNumber(supplierId)
  if (!Number.isInteger(numericSupplierId) || numericSupplierId <= 0) {
    throw new Error('Proveedor invalido')
  }

  const [suppliers, products] = await Promise.all([
    supabaseList('suppliers'),
    supabaseList('products'),
  ])

  const supplier = suppliers.find((row) => getSupplierId(row) === numericSupplierId)
  if (!supplier) {
    throw new Error(`No existe el proveedor ${numericSupplierId}`)
  }

  const supplierProducts = products.filter((row) => {
    const rowSupplierId = getSupplierId(row)
    const discontinued = toFiniteNumber(getFirstValue(row, ['Discontinued', 'discontinued']), 0)
    return rowSupplierId === numericSupplierId && discontinued !== 1
  })

  const productsById = new Map(
    supplierProducts
      .map((row) => [getProductId(row), row])
      .filter(([id]) => Number.isInteger(id) && id > 0)
  )

  const inputItems = Array.isArray(payload?.items) ? payload.items : []
  const normalizedItems = inputItems
    .map((line) => {
      const productId = toFiniteNumber(line?.productId)
      const quantity = toFiniteNumber(line?.quantity)
      if (!Number.isInteger(productId) || productId <= 0 || quantity <= 0) {
        return null
      }

      const product = productsById.get(productId)
      if (!product) {
        return null
      }

      return {
        productId,
        quantity,
        description: String(line?.description || '').trim(),
      }
    })
    .filter(Boolean)

  if (normalizedItems.length === 0) {
    throw new Error('No hay productos validos para generar la solicitud')
  }

  const groupedByProduct = new Map()
  normalizedItems.forEach((line) => {
    const current = groupedByProduct.get(line.productId) || {
      quantity: 0,
      descriptions: [],
    }
    current.quantity += line.quantity
    if (line.description) {
      current.descriptions.push(line.description)
    }
    groupedByProduct.set(line.productId, current)
  })

  for (const [productId, requestData] of groupedByProduct.entries()) {
    const product = productsById.get(productId)
    const stockBefore = getStockValue(product)
    const stockAfter = stockBefore + requestData.quantity
    const unitsBefore = toFiniteNumber(
      getFirstValue(product, ['UnitsInStock', 'unitsinstock']),
      stockBefore
    )
    const unitsAfter = unitsBefore + requestData.quantity
    const stockField = getStockFieldName(product)

    const updatePayload = {}

    // Mantener paridad con MySQL: si existe stock, se actualiza; si no, se usa UnitsInStock.
    updatePayload[stockField] = stockAfter

    if (findRowValueByField(product, 'UnitsInStock') !== undefined) {
      updatePayload.UnitsInStock = unitsAfter
    }

    if (findRowValueByField(product, 'isLowStock') !== undefined) {
      updatePayload.isLowStock = stockAfter < 10
    }

    await supabaseUpdateByPath(`/products/${productId}`, updatePayload)
  }

  const stockCursor = new Map(
    Array.from(groupedByProduct.keys()).map((productId) => {
      const product = productsById.get(productId)
      return [productId, getStockValue(product)]
    })
  )

  const items = normalizedItems
    .map((line) => {
      const product = productsById.get(line.productId)
      if (!product) {
        return null
      }

      const stockBeforeLine = Number(stockCursor.get(line.productId) || 0)
      const stockAfterLine = stockBeforeLine + line.quantity
      stockCursor.set(line.productId, stockAfterLine)
      const unitPrice = getUnitPrice(product)
      const descriptionSuffix = line.description ? ` - ${line.description}` : ''

      return {
        description: `${getProductName(product)}${descriptionSuffix} (Stock: ${stockBeforeLine} -> ${stockAfterLine})`,
        quantity: line.quantity,
        unitPrice,
        total: line.quantity * unitPrice,
      }
    })
    .filter(Boolean)

  const total = items.reduce((acc, item) => acc + toFiniteNumber(item.total), 0)

  const pdfPayload = {
    layout: 'supplier-invoice',
    title: 'SOLICITUD DE COMPRA',
    brandName: 'Northwind',
    brandSubtitle: 'Abastecimiento',
    invoice: {
      supplierName: String(getFirstValue(supplier, ['CompanyName', 'companyname']) || `Proveedor ${numericSupplierId}`),
      contactName: String(getFirstValue(supplier, ['ContactName', 'contactname']) || 'N/A'),
      folio: `SC-${numericSupplierId}-${Date.now().toString().slice(-6)}`,
      requestDate: new Date().toISOString(),
      requesterName: String(payload?.requesterName || 'Compras'),
      requesterArea: String(payload?.requesterArea || 'Area de Compras'),
      neededDate: String(payload?.neededDate || 'No especificada') || 'No especificada',
      notes: String(payload?.notes || ''),
    },
    items: items.map((item) => ({
      name: String(item.description || '-'),
      qty: String(item.quantity || 0),
      price: toMoney(item.unitPrice),
      total: toMoney(item.total),
    })),
    totals: [
      { label: 'Subtotal', value: toMoney(total) },
      { label: 'Total solicitado', value: toMoney(total), bold: true },
    ],
    footerThanks: 'Gracias por su atencion y pronta respuesta.',
    footerCompany: 'Northwind Suministros',
  }

  return downloadPdf(
    '/api/pdf/supplier-request',
    `solicitud-compra-proveedor-${numericSupplierId}.pdf`,
    {
      method: 'POST',
      body: pdfPayload,
    }
  )
}

async function supabaseList(resourceKey) {
  const resource = getResourceMeta(resourceKey)
  const primaryOrderField = resource?.idKeys?.[0]

  const { data } = await runSupabaseWithTableFallback(resourceKey, (table) => {
    let query = supabase.from(table).select('*')
    if (primaryOrderField) {
      query = query.order(toDbFieldName(primaryOrderField), { ascending: true })
    }
    return query
  })

  return Array.isArray(data) ? data.map((row) => toAppRow(resourceKey, row)) : []
}

async function supabaseGetByPath(resourceIdPath) {
  const { resourceKey, idValues } = parseResourceIdPath(resourceIdPath)
  const resource = getResourceMeta(resourceKey)

  if (!resource) {
    throw new Error(`Recurso no soportado: ${resourceKey}`)
  }

  const { data } = await runSupabaseWithTableFallback(resourceKey, (table) => {
    let query = supabase.from(table).select('*')
    query = applyIdFilters(query, resource, idValues)
    return query.limit(1).maybeSingle()
  })

  return data ? toAppRow(resourceKey, data) : null
}

async function supabaseCreate(resourceKey, payload) {
  const dbPayload = toDbPayload(payload)
  const { data } = await runSupabaseWithTableFallback(resourceKey, (table) => {
    return supabase.from(table).insert([dbPayload]).select('*').single()
  })

  return toAppRow(resourceKey, data)
}

async function supabaseUpdateByPath(resourceIdPath, payload, options = {}) {
  const { resourceKey, idValues } = parseResourceIdPath(resourceIdPath)
  const resource = getResourceMeta(resourceKey)

  if (!resource) {
    throw new Error(`Recurso no soportado: ${resourceKey}`)
  }

  const normalizedStatus = String(payload?.status || payload?.Status || '')
    .toLowerCase()
    .trim()

  if (
    !options.skipOrderSaleHook &&
    resourceKey === 'orders' &&
    normalizedStatus === 'vendido'
  ) {
    const restPayload = { ...(payload || {}) }
    delete restPayload.status
    delete restPayload.Status

    if (Object.keys(restPayload).length > 0) {
      await supabaseUpdateByPath(resourceIdPath, restPayload, {
        skipOrderSaleHook: true,
      })
    }

    const orderId = toFiniteNumber(idValues?.[0])
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new Error('ID de pedido invalido para confirmar venta')
    }

    await supabaseConfirmSale(orderId)
    return supabaseGetByPath(resourceIdPath)
  }

  const dbPayload = toDbPayload(payload)
  const { data } = await runSupabaseWithTableFallback(resourceKey, (table) => {
    let query = supabase.from(table).update(dbPayload)
    query = applyIdFilters(query, resource, idValues)
    return query.select('*').maybeSingle()
  })

  return data ? toAppRow(resourceKey, data) : null
}

async function supabaseDeleteByPath(resourceIdPath) {
  const { resourceKey, idValues } = parseResourceIdPath(resourceIdPath)
  const resource = getResourceMeta(resourceKey)

  if (!resource) {
    throw new Error(`Recurso no soportado: ${resourceKey}`)
  }

  await runSupabaseWithTableFallback(resourceKey, (table) => {
    let query = supabase.from(table).delete()
    query = applyIdFilters(query, resource, idValues)
    return query
  })

  return { success: true }
}

function isSupabaseMode() {
  return getDataSource() === 'supabase'
}

function getApiPrefix() {
  return getDataSource() === 'supabase' ? '/api-supabase' : '/api'
}

function ensureMysqlOnly(actionLabel) {
  if (getDataSource() === 'supabase') {
    throw new Error(`${actionLabel} aun no esta disponible en API Supabase`)
  }
}

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
    if (isSupabaseMode()) {
      return supabaseList(resourceKey)
    }
    return request(`${getApiPrefix()}/${resourceKey}`)
  },

  getByPath(resourceIdPath) {
    if (isSupabaseMode()) {
      return supabaseGetByPath(resourceIdPath)
    }
    return request(`${getApiPrefix()}${resourceIdPath}`)
  },

  create(resourceKey, body) {
    if (isSupabaseMode()) {
      return supabaseCreate(resourceKey, body)
    }
    return request(`${getApiPrefix()}/${resourceKey}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateByPath(resourceIdPath, body) {
    if (isSupabaseMode()) {
      return supabaseUpdateByPath(resourceIdPath, body)
    }
    return request(`${getApiPrefix()}${resourceIdPath}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  deleteByPath(resourceIdPath) {
    if (isSupabaseMode()) {
      return supabaseDeleteByPath(resourceIdPath)
    }
    return request(`${getApiPrefix()}${resourceIdPath}`, {
      method: 'DELETE',
    })
  },

  confirmSale(orderId) {
    if (isSupabaseMode()) {
      return supabaseConfirmSale(orderId)
    }
    ensureMysqlOnly('Confirmar venta')
    return request(`/api/orders/${orderId}/confirm-sale`, {
      method: 'POST',
    })
  },

  registerStockOutput(productId, payload) {
    if (isSupabaseMode()) {
      return supabaseRegisterStockOutput(productId, payload)
    }
    ensureMysqlOnly('Salida de almacen')
    return request(`/api/products/${productId}/stock-output`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  downloadSaleNotePdf(orderId) {
    if (isSupabaseMode()) {
      return supabaseDownloadSaleNotePdf(orderId)
    }
    ensureMysqlOnly('PDF nota de venta')
    return downloadPdf(`/api/orders/${orderId}/sale-note-pdf`, `nota-venta-${orderId}.pdf`)
  },

  downloadSupplierPurchaseRequestPdf(supplierId, payload) {
    if (isSupabaseMode()) {
      return supabaseDownloadSupplierPurchaseRequestPdf(supplierId, payload)
    }
    ensureMysqlOnly('PDF solicitud de compra')
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
