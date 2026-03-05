import {
  AtSign,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
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

export function ResourceCardsPage() {
  const params = useParams()
  const resource =
    RESOURCES.find((entry) => entry.key === params.resourceKey) || RESOURCES[0]

  const {
    filteredRows,
    fields,
    visibleFields,
    query,
    setQuery,
    loading,
    error,
    resultMessage,
    clearResultMessage,
    list,
    formOpen,
    formMode,
    formData,
    setFormData,
    openCreateForm,
    openEditForm,
    closeForm,
    submitForm,
    remove,
  } = useResourceCards(resource)

  const cards = useMemo(() => {
    return filteredRows.map((row, index) => {
      const titleField = getTitleField(row)
      const detailKeys = Object.keys(row).filter((key) => key !== titleField).slice(0, 4)

      return {
        id: `${titleField}-${index}`,
        row,
        titleField,
        detailKeys,
      }
    })
  }, [filteredRows])

  return (
    <main className="content">
      <header className="header card">
        <div className="header-title-wrap">
          <div className="header-badge">
            <AtSign size={16} />
            <span>Página de Recurso</span>
          </div>
          <h1>{resource.label}</h1>
          <p className="header-subtitle">
            Vista por tarjetas con acciones rápidas de crear, editar y eliminar.
          </p>
        </div>
        <button className="btn btn-primary" onClick={list} disabled={loading}>
          <RefreshCw size={16} />
          Actualizar
        </button>
      </header>

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
          <button className="btn btn-secondary">
            <Search size={15} />
            Buscar
          </button>
        </div>

        <button className="btn btn-success" onClick={openCreateForm}>
          <Plus size={16} />
          @ Nuevo
        </button>
      </section>

      {error ? <div className="alert error">{error}</div> : null}
      {resultMessage ? (
        <div className="alert success" onClick={clearResultMessage}>
          {resultMessage}
        </div>
      ) : null}

      <section className="cards-grid">
        {cards.map((card) => (
          <article key={card.id} className="data-card">
            <div className="data-card-header">
              <h3>{String(card.row[card.titleField] ?? 'Sin título')}</h3>
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

            <p className="card-title-key">{card.titleField}</p>

            <div className="kv-list">
              {card.detailKeys.map((key) => (
                <div key={key} className="kv-item">
                  <span>{key}</span>
                  <strong>{String(card.row[key] ?? '-')}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}

        {cards.length === 0 ? (
          <article className="empty-card">
            <p>No hay resultados para mostrar.</p>
            <button className="btn btn-success" onClick={openCreateForm}>
              <Plus size={16} />
              Crear primer registro
            </button>
          </article>
        ) : null}
      </section>

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
                  {field}
                  <input
                    type="text"
                    value={formData[field] ?? ''}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field]: event.target.value,
                      }))
                    }
                    placeholder={`Valor para ${field}`}
                  />
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
