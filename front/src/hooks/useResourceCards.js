import { useEffect, useMemo, useState } from 'react'
import { resourcesApi } from '../services/resourcesApi'
import { isPlainObject } from '../utils/format'
import { buildResourceIdPath, extractIdValuesFromRow } from '../utils/resource'

const getUnionKeys = (rows) => {
  const set = new Set()
  rows.slice(0, 20).forEach((row) => {
    if (isPlainObject(row)) {
      Object.keys(row).forEach((key) => set.add(key))
    }
  })
  return Array.from(set)
}

const createEmptyByFields = (fields) =>
  fields.reduce((acc, field) => {
    acc[field] = ''
    return acc
  }, {})

export function useResourceCards(resource) {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultMessage, setResultMessage] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [formData, setFormData] = useState({})
  const [editingPath, setEditingPath] = useState(null)

  const fields = useMemo(() => getUnionKeys(rows), [rows])

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return rows
    }

    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(normalizedQuery))
  }, [rows, query])

  const list = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await resourcesApi.list(resource.key)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener la lista')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRows([])
    setQuery('')
    setError('')
    setResultMessage('')
    setFormOpen(false)
    setEditingPath(null)
    setFormData({})
    list()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.key])

  const openCreateForm = () => {
    setFormMode('create')
    setEditingPath(null)
    setFormData(createEmptyByFields(fields))
    setFormOpen(true)
  }

  const openEditForm = (row) => {
    const idValues = extractIdValuesFromRow(resource, row, {})
    const idPath = buildResourceIdPath(resource, idValues)
    if (!idPath) {
      setError('No se pudo determinar el ID para editar este registro')
      return
    }

    setFormMode('edit')
    setEditingPath(idPath)
    setFormData({ ...row })
    setFormOpen(true)
  }

  const remove = async (row) => {
    const idValues = extractIdValuesFromRow(resource, row, {})
    const idPath = buildResourceIdPath(resource, idValues)
    if (!idPath) {
      setError('No se pudo determinar el ID para eliminar este registro')
      return
    }

    setLoading(true)
    setError('')
    try {
      await resourcesApi.deleteByPath(idPath)
      setResultMessage('Registro eliminado correctamente')
      await list()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
    } finally {
      setLoading(false)
    }
  }

  const submitForm = async () => {
    setLoading(true)
    setError('')

    try {
      if (formMode === 'create') {
        await resourcesApi.create(resource.key, formData)
        setResultMessage('Registro creado correctamente')
      } else {
        if (!resource.canUpdate || !editingPath) {
          throw new Error('Este recurso no soporta actualización o no tiene un ID válido')
        }
        await resourcesApi.updateByPath(editingPath, formData)
        setResultMessage('Registro actualizado correctamente')
      }

      setFormOpen(false)
      await list()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  const visibleFields = useMemo(() => {
    if (Object.keys(formData).length > 0) {
      return Object.keys(formData)
    }
    return fields
  }, [fields, formData])

  return {
    rows,
    filteredRows,
    fields,
    visibleFields,
    query,
    setQuery,
    loading,
    error,
    resultMessage,
    clearResultMessage: () => setResultMessage(''),
    list,
    formOpen,
    formMode,
    formData,
    setFormData,
    openCreateForm,
    openEditForm,
    closeForm: () => setFormOpen(false),
    submitForm,
    remove,
  }
}
