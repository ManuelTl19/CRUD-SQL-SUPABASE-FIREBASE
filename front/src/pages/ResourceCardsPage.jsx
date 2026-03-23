// Pagina de aplicacion: compone secciones principales para una vista completa.
import {
  AtSign,
  ArrowDownAZ,
  ArrowUpZA,
  FileDown,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Truck,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { useParams } from 'react-router-dom'
import { RESOURCES } from '../config/resources'
import { useResourceCards } from '../hooks/useResourceCards'
import { resourcesApi } from '../services/resourcesApi'
import { getDataSource, setDataSource } from '../services/dataSource'

const getTitleField = (row) => {
  const keys = Object.keys(row)
  const preferred = ['Name', 'CompanyName', 'ProductName', 'CategoryName', 'CustomerID']
  for (const key of keys) {
    if (preferred.some((target) => key.toLowerCase().includes(target.toLowerCase()))) {
      return key
    }
  }
  return keys[0]
}

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'object') {
    return '[Dato no visible]'
  }

  return String(value)
}

export function ResourceCardsPage() {
  const params = useParams()
  const resource =
    RESOURCES.find((entry) => entry.key === params.resourceKey) || RESOURCES[0]

  const {
    paginatedRows,
    filteredRows,
    totalRows,
    pageSize,
    pageSizeOptions,
    setPageSize,
    currentPage,
    totalPages,
    visibleStart,
    visibleEnd,
    goToPage,
    sortFields,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    fields,
    visibleFields,
    query,
    setQuery,
    loading,
    list,
    formOpen,
    formMode,
    formData,
    setFormData,
    foreignKeyOptions,
    openCreateForm,
    openEditForm,
    closeForm,
    submitForm,
    remove,
  } = useResourceCards(resource)

  const fieldLabels = resource.fieldLabels || {}
  const fieldTypes = resource.fieldTypes || {}

  const cards = useMemo(() => {
    return paginatedRows.map((row, index) => {
      const titleField = getTitleField(row)
      const detailKeys = Object.keys(row).filter((key) => key !== titleField).slice(0, 4)

      return {
        id: `${titleField}-${index}`,
        row,
        titleField,
        detailKeys,
      }
    })
  }, [paginatedRows])

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    const items = []
    for (let page = start; page <= end; page += 1) {
      items.push(page)
    }
    return items
  }, [currentPage, totalPages])

  const loadingSkeleton = loading && cards.length === 0
  const isOrdersResource = resource.key === 'orders'
  const isSuppliersResource = resource.key === 'suppliers'
  const isProductsResource = resource.key === 'products'
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [orderDetailsRows, setOrderDetailsRows] = useState([])
  const [productRows, setProductRows] = useState([])

  const [supplierRequestOpen, setSupplierRequestOpen] = useState(false)
  const [requestSupplier, setRequestSupplier] = useState(null)
  const [requestProducts, setRequestProducts] = useState([])
  const [requestLines, setRequestLines] = useState([])
  const [requesterName, setRequesterName] = useState('Compras')
  const [requesterArea, setRequesterArea] = useState('Area de Compras')
  const [neededDate, setNeededDate] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [locallySoldOrderIds, setLocallySoldOrderIds] = useState(() => new Set())
  const [dataSource, setDataSourceState] = useState(() => getDataSource())
  const [viewMode, setViewMode] = useState('cards')
  const isSupabaseMode = dataSource === 'supabase'
  const sourceLabel = isSupabaseMode ? 'Supabase API' : 'MySQL API'

  const getOrderStatusText = (row) => {
    const candidates = [
      row?.status,
      row?.Status,
      row?.orderstatus,
      row?.OrderStatus,
      row?.estado,
      row?.Estado,
    ]
    const found = candidates.find((value) => value !== null && value !== undefined && value !== '')
    return String(found || '').toLowerCase().trim()
  }

  const isOrderSold = (row) => {
    const orderId = Number(row?.OrderID ?? row?.orderid)
    if (Number.isInteger(orderId) && locallySoldOrderIds.has(orderId)) {
      return true
    }
    return getOrderStatusText(row) === 'vendido'
  }

  useEffect(() => {
    if (!isOrdersResource) {
      setOrderDetailsRows([])
      setProductRows([])
      setOrdersFilter('all')
      return
    }

    Promise.all([resourcesApi.list('order-details'), resourcesApi.list('products')])
      .then(([details, products]) => {
        setOrderDetailsRows(Array.isArray(details) ? details : [])
        setProductRows(Array.isArray(products) ? products : [])
      })
      .catch(() => {
        setOrderDetailsRows([])
        setProductRows([])
      })
  }, [isOrdersResource, totalRows])

  const productStockMap = useMemo(() => {
    const map = new Map()
    productRows.forEach((product) => {
      const stock = Number(product?.stock ?? product?.UnitsInStock ?? 0)
      map.set(Number(product?.ProductID), Number.isFinite(stock) ? stock : 0)
    })
    return map
  }, [productRows])

  const detailsByOrderMap = useMemo(() => {
    const map = new Map()
    orderDetailsRows.forEach((detail) => {
      const orderId = Number(detail?.OrderID)
      if (!Number.isInteger(orderId)) {
        return
      }

      if (!map.has(orderId)) {
        map.set(orderId, [])
      }
      map.get(orderId).push(detail)
    })
    return map
  }, [orderDetailsRows])

  const orderAvailabilityMap = useMemo(() => {
    if (!isOrdersResource) {
      return new Map()
    }

    const map = new Map()
    filteredRows.forEach((row) => {
      const orderId = Number(row?.OrderID)
      const isSold = isOrderSold(row)
      const details = detailsByOrderMap.get(orderId) || []

      if (isSold) {
        map.set(orderId, {
          isSold: true,
          canConfirm: false,
          hasShortage: false,
          shortageCount: 0,
          hasDetails: details.length > 0,
        })
        return
      }

      if (details.length === 0) {
        map.set(orderId, {
          isSold: false,
          canConfirm: false,
          hasShortage: false,
          shortageCount: 0,
          hasDetails: false,
        })
        return
      }

      const shortageCount = details.reduce((acc, detail) => {
        const productId = Number(detail?.ProductID)
        const quantity = Number(detail?.Quantity || 0)
        const stock = Number(productStockMap.get(productId) || 0)
        return stock < quantity ? acc + 1 : acc
      }, 0)

      map.set(orderId, {
        isSold: false,
        canConfirm: shortageCount === 0,
        hasShortage: shortageCount > 0,
        shortageCount,
        hasDetails: true,
      })
    })
    return map
  }, [
    isOrdersResource,
    filteredRows,
    detailsByOrderMap,
    productStockMap,
    locallySoldOrderIds,
  ])

  const visibleCards = useMemo(() => {
    if (!isOrdersResource) {
      return cards
    }

    const withAvailability = cards.map((card) => ({
      ...card,
      orderAvailability: orderAvailabilityMap.get(Number(card?.row?.OrderID)) || null,
    }))

    const filtered = withAvailability.filter((card) => {
      const availability = card.orderAvailability
      switch (ordersFilter) {
        case 'ready':
          return Boolean(availability?.canConfirm)
        case 'sold':
          return Boolean(availability?.isSold)
        case 'shortage':
          return Boolean(availability?.hasShortage)
        default:
          return true
      }
    })

    const priority = (availability) => {
      if (!availability) return 4
      if (availability.canConfirm) return 1
      if (availability.isSold) return 2
      if (availability.hasShortage) return 3
      return 4
    }

    return [...filtered].sort((a, b) => priority(a.orderAvailability) - priority(b.orderAvailability))
  }, [isOrdersResource, cards, orderAvailabilityMap, ordersFilter])

  const confirmSale = async (orderId) => {
    if (!orderId) {
      return
    }

    try {
      await resourcesApi.confirmSale(orderId)
      setLocallySoldOrderIds((prev) => {
        const next = new Set(prev)
        next.add(Number(orderId))
        return next
      })
      await Swal.fire({
        title: 'Venta confirmada',
        text: `Pedido ${orderId} marcado como vendido`,
        icon: 'success',
      })
      await list()
    } catch (error) {
      await Swal.fire({
        title: 'No se pudo confirmar',
        text: error instanceof Error ? error.message : 'Error inesperado',
        icon: 'error',
      })
    }
  }

  const downloadSaleNote = async (orderId) => {
    if (!orderId) {
      return
    }

    try {
      await resourcesApi.downloadSaleNotePdf(orderId)
    } catch (error) {
      await Swal.fire({
        title: 'No se pudo descargar',
        text: error instanceof Error ? error.message : 'Error inesperado',
        icon: 'error',
      })
    }
  }

  const registerStockOutput = async () => {
    const formResponse = await Swal.fire({
      title: 'Salida de almacen',
      html: `
        <input id="stock-product-id" class="swal2-input" type="number" min="1" placeholder="ID de producto" />
        <input id="stock-qty" class="swal2-input" type="number" min="1" placeholder="Cantidad a retirar" />
        <input id="stock-reason" class="swal2-input" placeholder="Motivo" value="Salida manual" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar salida',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const productId = Number(document.getElementById('stock-product-id')?.value)
        const quantity = Number(document.getElementById('stock-qty')?.value)
        const reason = document.getElementById('stock-reason')?.value?.trim()

        if (!Number.isInteger(productId) || productId <= 0) {
          Swal.showValidationMessage('Ingresa un ID de producto valido')
          return null
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
          Swal.showValidationMessage('Ingresa una cantidad valida')
          return null
        }

        return {
          productId,
          quantity,
          reason: reason || 'Salida manual',
        }
      },
    })

    if (!formResponse.isConfirmed || !formResponse.value) {
      return
    }

    try {
      const result = await resourcesApi.registerStockOutput(formResponse.value.productId, {
        quantity: formResponse.value.quantity,
        reason: formResponse.value.reason,
      })
      await Swal.fire({
        title: 'Salida registrada',
        text: `${result.productName}: stock ${result.stockAnterior} -> ${result.stockActual}`,
        icon: 'success',
      })
      await list()
    } catch (error) {
      await Swal.fire({
        title: 'No se pudo registrar',
        text: error instanceof Error ? error.message : 'Error inesperado',
        icon: 'error',
      })
    }
  }

  const closeSupplierRequestModal = () => {
    setSupplierRequestOpen(false)
    setRequestSupplier(null)
    setRequestProducts([])
    setRequestLines([])
    setRequesterName('Compras')
    setRequesterArea('Area de Compras')
    setNeededDate('')
    setRequestNotes('')
    setRequestLoading(false)
  }

  const openSupplierRequestModal = async ({ supplierId, initialProductId }) => {
    const parsedSupplierId = Number(supplierId)
    if (!Number.isInteger(parsedSupplierId) || parsedSupplierId <= 0) {
      await Swal.fire({
        title: 'Proveedor invalido',
        text: 'El producto no tiene un proveedor valido',
        icon: 'warning',
      })
      return
    }

    try {
      const [suppliers, products] = await Promise.all([
        resourcesApi.list('suppliers'),
        resourcesApi.list('products'),
      ])

      const supplier = Array.isArray(suppliers)
        ? suppliers.find((item) => Number(item.SupplierID) === parsedSupplierId)
        : null

      if (!supplier) {
        await Swal.fire({
          title: 'Proveedor no encontrado',
          text: `No existe el proveedor ${parsedSupplierId}`,
          icon: 'error',
        })
        return
      }

      const supplierProducts = (Array.isArray(products) ? products : [])
        .filter((item) => Number(item.SupplierID) === parsedSupplierId)
        .filter((item) => Number(item.Discontinued || 0) !== 1)

      if (supplierProducts.length === 0) {
        await Swal.fire({
          title: 'Sin productos disponibles',
          text: 'Este proveedor no tiene productos activos para solicitar',
          icon: 'warning',
        })
        return
      }

      const preferredProduct = supplierProducts.find(
        (item) => Number(item.ProductID) === Number(initialProductId)
      )

      setRequestSupplier(supplier)
      setRequestProducts(supplierProducts)
      setRequestLines([
        {
          productId: String(preferredProduct?.ProductID || supplierProducts[0].ProductID),
          quantity: '1',
          description: '',
        },
      ])
      setSupplierRequestOpen(true)
    } catch (error) {
      await Swal.fire({
        title: 'No se pudo preparar la solicitud',
        text: error instanceof Error ? error.message : 'Error inesperado',
        icon: 'error',
      })
    }
  }

  const openSupplierPickerRequest = async () => {
    let supplierRows = filteredRows

    if (!Array.isArray(supplierRows) || supplierRows.length === 0) {
      supplierRows = await resourcesApi.list('suppliers')
    }

    const options = Object.fromEntries(
      (Array.isArray(supplierRows) ? supplierRows : []).map((supplier) => [
        String(supplier.SupplierID),
        `${supplier.SupplierID} - ${supplier.CompanyName}`,
      ])
    )

    const selection = await Swal.fire({
      title: 'Selecciona proveedor',
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Elige un proveedor',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Selecciona un proveedor'
        }
        return undefined
      },
    })

    if (!selection.isConfirmed || !selection.value) {
      return
    }

    await openSupplierRequestModal({ supplierId: Number(selection.value) })
  }

  const addRequestLine = () => {
    if (requestProducts.length === 0) {
      return
    }

    setRequestLines((prev) => [
      ...prev,
      {
        productId: String(requestProducts[0].ProductID),
        quantity: '1',
        description: '',
      },
    ])
  }

  const updateRequestLine = (index, field, value) => {
    setRequestLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    )
  }

  const removeRequestLine = (index) => {
    setRequestLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index))
  }

  const submitSupplierRequest = async () => {
    if (!requestSupplier?.SupplierID) {
      return
    }

    if (!requesterName.trim() || !requesterArea.trim()) {
      await Swal.fire({
        title: 'Datos incompletos',
        text: 'Solicitante y area son obligatorios',
        icon: 'warning',
      })
      return
    }

    const normalizedItems = requestLines
      .map((line) => ({
        productId: Number(line.productId),
        quantity: Number(line.quantity),
        description: String(line.description || '').trim(),
      }))
      .filter((line) => Number.isInteger(line.productId) && line.productId > 0)
      .filter((line) => Number.isFinite(line.quantity) && line.quantity > 0)

    if (normalizedItems.length === 0) {
      await Swal.fire({
        title: 'Sin productos validos',
        text: 'Agrega al menos un producto con cantidad mayor a 0',
        icon: 'warning',
      })
      return
    }

    setRequestLoading(true)
    try {
      await resourcesApi.downloadSupplierPurchaseRequestPdf(requestSupplier.SupplierID, {
        requesterName: requesterName.trim(),
        requesterArea: requesterArea.trim(),
        neededDate: neededDate.trim(),
        notes: requestNotes.trim(),
        items: normalizedItems,
      })
      closeSupplierRequestModal()
    } catch (error) {
      await Swal.fire({
        title: 'No se pudo generar solicitud',
        text: error instanceof Error ? error.message : 'Error inesperado',
        icon: 'error',
      })
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <main className={`content ${isSupabaseMode ? 'mode-supabase' : 'mode-mysql'}`}>
      <header className="header card">
        <div className="header-title-wrap">
          <div className="header-badge">
            <AtSign size={16} />
            <span>{isSupabaseMode ? 'Workspace Supabase' : 'Workspace MySQL'}</span>
          </div>
          <h1>{resource.label}</h1>
          <p className="header-subtitle">
            Gestion profesional con filtros, paginacion y formularios inteligentes.
          </p>
        </div>
        <div className="header-actions">
          <label className="control-inline">
            Base
            <select
              value={dataSource}
              onChange={(event) => {
                const next = setDataSource(event.target.value)
                setDataSourceState(next)
                void list()
              }}
            >
              <option value="mysql">MySQL API</option>
              <option value="supabase">Supabase API</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={list} disabled={loading}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </header>

      <section className="summary-strip card">
        <div className="summary-pill">
          <span>Total</span>
          <strong>{totalRows}</strong>
        </div>
        <div className="summary-pill">
          <span>Filtrados</span>
          <strong>{filteredRows.length}</strong>
        </div>
        <div className="summary-pill">
          <span>Mostrando</span>
          <strong>
            {visibleStart}-{visibleEnd}
          </strong>
        </div>
        <div className="summary-pill">
          <span>Modo</span>
          <strong>{isSupabaseMode ? sourceLabel : resource.canUpdate ? 'Edicion completa' : 'Solo alta/baja'}</strong>
        </div>
      </section>

      <section className="toolbar card">
        <div className="search-wrap">
          <span className="search-prefix">
            <AtSign size={15} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="@ buscar por cualquier dato"
          />
          <button className="btn btn-secondary" aria-label="Buscar registros">
            <Search size={15} />
            Buscar
          </button>
        </div>

        <div className="toolbar-controls">
          <div className="view-switch" role="group" aria-label="Cambiar vista">
            <button
              className={`view-switch-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              type="button"
            >
              <LayoutGrid size={14} />
              Tarjetas
            </button>
            <button
              className={`view-switch-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              type="button"
            >
              <List size={14} />
              Tabla
            </button>
          </div>

          <label className="control-inline">
            <SlidersHorizontal size={14} />
            Por pagina
            <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
              {pageSizeOptions.map((option) => (
                <option key={`page-size-${option}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="control-inline">
            Ordenar
            <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
              <option value="">Sin orden</option>
              {sortFields.map((field) => (
                <option key={`sort-${field}`} value={field}>
                  {fieldLabels[field] || field}
                </option>
              ))}
            </select>
          </label>

          <button
            className="btn btn-secondary"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            disabled={!sortField}
            title="Cambiar direccion"
          >
            {sortDirection === 'asc' ? <ArrowDownAZ size={15} /> : <ArrowUpZA size={15} />}
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </button>

          <button className="btn btn-success" onClick={openCreateForm}>
            <Plus size={16} />
            Nuevo
          </button>

          {isOrdersResource ? (
            <label className="control-inline">
              Estado pedido
              <select value={ordersFilter} onChange={(event) => setOrdersFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="ready">Aceptables (con stock)</option>
                <option value="sold">Ya aceptadas</option>
                <option value="shortage">Sin stock suficiente</option>
              </select>
            </label>
          ) : null}

          {isProductsResource ? (
            <button className="btn btn-secondary" onClick={registerStockOutput}>
              <Truck size={16} />
              Salida almacen
            </button>
          ) : null}

          {isSuppliersResource ? (
            <button className="btn btn-secondary" onClick={openSupplierPickerRequest}>
              <FileDown size={16} />
              Solicitud compra (PDF)
            </button>
          ) : null}
        </div>
      </section>

      {viewMode === 'cards' ? (
        <section className="cards-grid" aria-live="polite">
          {loadingSkeleton
            ? Array.from({ length: Math.min(pageSize, 8) }).map((_, index) => (
                <article key={`skeleton-${index}`} className="data-card skeleton-card">
                  <div className="skeleton-line w60" />
                  <div className="skeleton-line w40" />
                  <div className="skeleton-line w80" />
                  <div className="skeleton-line w70" />
                </article>
              ))
            : null}

          {!loadingSkeleton
            ? visibleCards.map((card) => {
                const availability = card.orderAvailability
                const cardClassName = isOrdersResource
                  ? `data-card ${
                      availability?.isSold
                        ? 'order-card-sold'
                        : availability?.canConfirm
                          ? 'order-card-ready'
                          : availability?.hasShortage
                            ? 'order-card-shortage'
                            : 'order-card-pending'
                    }`
                  : 'data-card'

                return (
                  <article key={card.id} className={cardClassName}>
                    <div className="data-card-header">
                      <h3>{String(card.row[card.titleField] ?? 'Sin titulo')}</h3>
                      <div className="card-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEditForm(card.row)}
                          disabled={!resource.canUpdate}
                          title={resource.canUpdate ? 'Editar' : 'No editable'}
                        >
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => remove(card.row)} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="card-title-key">{fieldLabels[card.titleField] || card.titleField}</p>

                    {isProductsResource ? (
                      <div className="stock-highlight">
                        <span>Stock disponible</span>
                        <strong>{Number(card.row?.stock ?? card.row?.UnitsInStock ?? 0)}</strong>
                      </div>
                    ) : null}

                    <div className="kv-list">
                      {card.detailKeys.map((key) => (
                        <div key={key} className="kv-item">
                          <span>{fieldLabels[key] || key}</span>
                          <strong>{formatValue(card.row[key])}</strong>
                        </div>
                      ))}
                    </div>

                    {isProductsResource ? (
                      <button
                        className="btn btn-secondary card-inline-action"
                        onClick={() =>
                          openSupplierRequestModal({
                            supplierId: Number(card.row.SupplierID),
                            initialProductId: Number(card.row.ProductID),
                          })
                        }
                      >
                        <FileDown size={15} />
                        Solicitar a proveedor
                      </button>
                    ) : null}

                    {isSuppliersResource ? (
                      <button
                        className="btn btn-secondary card-inline-action"
                        onClick={() =>
                          openSupplierRequestModal({
                            supplierId: Number(card.row.SupplierID),
                          })
                        }
                      >
                        <FileDown size={15} />
                        Solicitar productos
                      </button>
                    ) : null}

                    {isOrdersResource ? (
                      <>
                        <p className="order-status-badge">
                          {availability?.isSold
                            ? 'Aceptada (vendida)'
                            : availability?.canConfirm
                              ? 'Lista para aceptar'
                              : availability?.hasShortage
                                ? `Sin stock suficiente (${availability.shortageCount})`
                                : 'Sin detalle de pedido'}
                        </p>
                        <button
                          className="btn btn-secondary card-inline-action"
                          onClick={() => confirmSale(Number(card.row.OrderID))}
                          disabled={
                            isOrderSold(card.row) ||
                            Boolean(availability?.hasShortage) ||
                            !availability?.hasDetails
                          }
                          title={
                            isOrderSold(card.row)
                                ? 'La venta ya fue confirmada'
                                : availability?.hasShortage
                                  ? 'No hay stock suficiente para confirmar'
                                  : !availability?.hasDetails
                                    ? 'El pedido no tiene detalle'
                                    : 'Confirmar venta'
                          }
                        >
                          <Truck size={15} />
                          {isOrderSold(card.row) ? 'Venta confirmada' : 'Confirmar venta'}
                        </button>
                        <button
                          className="btn btn-secondary card-inline-action"
                          onClick={() => downloadSaleNote(Number(card.row.OrderID))}
                          disabled={!isOrderSold(card.row)}
                          title={
                            isOrderSold(card.row)
                                ? 'Generar nota de venta'
                                : 'Debes confirmar la venta primero'
                          }
                        >
                          <FileDown size={15} />
                          Generar nota venta (PDF)
                        </button>
                      </>
                    ) : null}
                  </article>
                )
              })
            : null}

          {!loadingSkeleton && visibleCards.length === 0 ? (
            <article className="empty-card">
              <p>No hay resultados para mostrar.</p>
              <button className="btn btn-success" onClick={openCreateForm}>
                <Plus size={16} />
                Crear primer registro
              </button>
            </article>
          ) : null}
        </section>
      ) : (
        <section className="card table-panel" aria-live="polite">
          <div className="table-wrap modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  {(visibleFields.length ? visibleFields : fields).slice(0, 7).map((field) => (
                    <th key={`th-${field}`}>{fieldLabels[field] || field}</th>
                  ))}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty-cell">
                      No hay registros para mostrar
                    </td>
                  </tr>
                ) : (
                  visibleCards.map((card) => {
                    const tableFields = (visibleFields.length ? visibleFields : fields).slice(0, 7)
                    const availability = card.orderAvailability
                    return (
                      <tr key={`table-row-${card.id}`}>
                        {tableFields.map((field) => {
                          const isStockField =
                            isProductsResource &&
                            (field === 'stock' || field === 'UnitsInStock' || field === 'isLowStock')

                          if (isStockField) {
                            return (
                              <td key={`td-${card.id}-${field}`}>
                                <span className="table-stock-pill">{formatValue(card.row[field])}</span>
                              </td>
                            )
                          }

                          return <td key={`td-${card.id}-${field}`}>{formatValue(card.row[field])}</td>
                        })}
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn"
                              onClick={() => openEditForm(card.row)}
                              disabled={!resource.canUpdate}
                              title={resource.canUpdate ? 'Editar' : 'No editable'}
                            >
                              <Pencil size={14} />
                            </button>
                            <button className="icon-btn danger" onClick={() => remove(card.row)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>

                            {isOrdersResource ? (
                              <button
                                className="btn btn-secondary btn-inline"
                                onClick={() => confirmSale(Number(card.row.OrderID))}
                                disabled={
                                  isOrderSold(card.row) ||
                                  Boolean(availability?.hasShortage) ||
                                  !availability?.hasDetails
                                }
                              >
                                <Truck size={14} />
                                Confirmar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {filteredRows.length > pageSize ? (
        <section className="pagination-wrap card">
          <button
            className="btn btn-secondary"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="pagination-text">
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="pagination-tabs">
            {pageNumbers.map((page) => (
              <button
                key={`page-${page}`}
                className={`pagination-tab ${page === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </section>
      ) : null}

      {formOpen ? (
        <section className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>{formMode === 'create' ? 'Crear registro' : 'Editar registro'}</h3>
              <button className="icon-btn" onClick={closeForm}>
                <X size={15} />
              </button>
            </div>

            <div className="form-grid">
              {(visibleFields.length ? visibleFields : fields).map((field) => (
                <label key={field}>
                  {fieldLabels[field] || field}
                  {Array.isArray(foreignKeyOptions[field]) ? (
                    <select
                      value={formData[field] ?? ''}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      disabled={formMode === 'edit' && resource.idKeys.includes(field)}
                    >
                      <option value="">Selecciona {fieldLabels[field] || field}</option>
                      {foreignKeyOptions[field].map((option) => (
                        <option key={`${field}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : fieldTypes[field] === 'textarea' ? (
                    <textarea
                      value={formData[field] ?? ''}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      placeholder={`Valor para ${fieldLabels[field] || field}`}
                      disabled={formMode === 'edit' && resource.idKeys.includes(field)}
                    />
                  ) : fieldTypes[field] === 'checkbox' ? (
                    <select
                      value={String(formData[field] ?? '')}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      disabled={formMode === 'edit' && resource.idKeys.includes(field)}
                    >
                      <option value="">Selecciona una opcion</option>
                      <option value="1">Si</option>
                      <option value="0">No</option>
                    </select>
                  ) : (
                    <input
                      type={fieldTypes[field] || 'text'}
                      value={formData[field] ?? ''}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      placeholder={`Valor para ${fieldLabels[field] || field}`}
                      disabled={formMode === 'edit' && resource.idKeys.includes(field)}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeForm}>
                <X size={15} />
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={submitForm} disabled={loading}>
                <Save size={15} />
                Guardar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {supplierRequestOpen ? (
        <section className="modal-backdrop">
          <div className="modal-card request-modal">
            <div className="modal-head">
              <h3>
                Solicitud a proveedor: {requestSupplier?.CompanyName || 'N/A'}
              </h3>
              <button className="icon-btn" onClick={closeSupplierRequestModal}>
                <X size={15} />
              </button>
            </div>

            <div className="form-grid request-meta-grid">
              <label>
                Solicitante
                <input
                  value={requesterName}
                  onChange={(event) => setRequesterName(event.target.value)}
                  placeholder="Nombre de quien solicita"
                />
              </label>
              <label>
                Area
                <input
                  value={requesterArea}
                  onChange={(event) => setRequesterArea(event.target.value)}
                  placeholder="Area solicitante"
                />
              </label>
              <label>
                Fecha requerida
                <input
                  type="date"
                  value={neededDate}
                  onChange={(event) => setNeededDate(event.target.value)}
                />
              </label>
            </div>

            <label className="request-notes">
              Descripcion general
              <textarea
                value={requestNotes}
                onChange={(event) => setRequestNotes(event.target.value)}
                placeholder="Describe lo que se necesita en general"
              />
            </label>

            <div className="request-lines-head">
              <h4>Productos solicitados</h4>
              <button className="btn btn-success" onClick={addRequestLine}>
                <Plus size={14} />
                Agregar producto
              </button>
            </div>

            <div className="request-lines-grid">
              {requestLines.map((line, index) => (
                <article key={`request-line-${index}`} className="request-line-card">
                  <label>
                    Producto
                    <select
                      value={line.productId}
                      onChange={(event) => updateRequestLine(index, 'productId', event.target.value)}
                    >
                      {requestProducts.map((product) => (
                        <option key={`request-product-${product.ProductID}`} value={String(product.ProductID)}>
                          {product.ProductID} - {product.ProductName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cantidad
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(event) => updateRequestLine(index, 'quantity', event.target.value)}
                    />
                  </label>
                  <label>
                    Descripcion
                    <input
                      value={line.description}
                      onChange={(event) => updateRequestLine(index, 'description', event.target.value)}
                      placeholder="Detalle adicional para este producto"
                    />
                  </label>
                  <button
                    className="btn btn-danger"
                    onClick={() => removeRequestLine(index)}
                    disabled={requestLines.length === 1}
                  >
                    <Trash2 size={14} />
                    Quitar
                  </button>
                </article>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeSupplierRequestModal}>
                <X size={15} />
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={submitSupplierRequest} disabled={requestLoading}>
                <FileDown size={15} />
                Generar PDF
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
