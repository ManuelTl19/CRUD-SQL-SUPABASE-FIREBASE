import {
  AtSign,
  ArrowDownAZ,
  ArrowUpZA,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { RESOURCES } from '../config/resources'
import { useResourceCards } from '../hooks/useResourceCards'

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

  return (
    <main className="content">
      <header className="header card">
        <div className="header-title-wrap">
          <div className="header-badge">
            <AtSign size={16} />
            <span>Pagina de Recurso</span>
          </div>
          <h1>{resource.label}</h1>
          <p className="header-subtitle">
            Gestion profesional con filtros, paginacion y formularios inteligentes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={list} disabled={loading}>
          <RefreshCw size={16} />
          Actualizar
        </button>
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
          <strong>{resource.canUpdate ? 'Edicion completa' : 'Solo alta/baja'}</strong>
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
          <label className="control-inline">
            <SlidersHorizontal size={14} />
            Tarjetas
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
        </div>
      </section>

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
          ? cards.map((card) => (
              <article key={card.id} className="data-card">
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

                <div className="kv-list">
                  {card.detailKeys.map((key) => (
                    <div key={key} className="kv-item">
                      <span>{fieldLabels[key] || key}</span>
                      <strong>{formatValue(card.row[key])}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))
          : null}

        {!loadingSkeleton && cards.length === 0 ? (
          <article className="empty-card">
            <p>No hay resultados para mostrar.</p>
            <button className="btn btn-success" onClick={openCreateForm}>
              <Plus size={16} />
              Crear primer registro
            </button>
          </article>
        ) : null}
      </section>

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
    </main>
  )
}
