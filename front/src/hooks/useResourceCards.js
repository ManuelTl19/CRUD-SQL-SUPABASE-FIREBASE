import { useEffect, useMemo, useState } from 'react'
import { resourcesApi } from '../services/resourcesApi'
import { RESOURCES } from '../config/resources'
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
  const [foreignKeyOptions, setForeignKeyOptions] = useState({})

  const fields = useMemo(() => getUnionKeys(rows), [rows])
  const formFields = useMemo(() => {
    if (Array.isArray(resource.formFields) && resource.formFields.length > 0) {
      return resource.formFields
    }
    return fields
  }, [resource.formFields, fields])

  const foreignKeyConfig = useMemo(() => resource.foreignKeys || {}, [resource.foreignKeys])

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
    setForeignKeyOptions({})
    list()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.key])

  const loadForeignKeyOptions = async () => {
    const entries = Object.entries(foreignKeyConfig)
    if (entries.length === 0) {
      setForeignKeyOptions({})
      return
    }

    const lookupByKey = Object.fromEntries(RESOURCES.map((entry) => [entry.key, entry]))

    const uniqueResourceKeys = Array.from(new Set(entries.map(([, config]) => config.resourceKey)))

    const datasets = await Promise.all(
      uniqueResourceKeys.map(async (resourceKey) => {
        const data = await resourcesApi.list(resourceKey)
        return [resourceKey, Array.isArray(data) ? data : []]
      })
    )

    const datasetMap = Object.fromEntries(datasets)
    const nextOptions = {}

    entries.forEach(([field, config]) => {
      const rowsForResource = datasetMap[config.resourceKey] || []
      const refResource = lookupByKey[config.resourceKey]
      const fallbackId = refResource?.idKeys?.[0]
      const valueKey = config.valueKey || fallbackId

      nextOptions[field] = rowsForResource
        .map((row) => {
          const value = row?.[valueKey]
          if (value === undefined || value === null || value === '') {
            return null
          }

          const label = config.labelKey && row?.[config.labelKey] != null
            ? `${value} - ${String(row[config.labelKey])}`
            : String(value)

          return {
            value: String(value),
            label,
          }
        })
        .filter(Boolean)
    })

    setForeignKeyOptions(nextOptions)
  }

  const buildPayloadForSubmit = (rawFormData, mode) => {
    const basePayload = Object.fromEntries(
      Object.entries(rawFormData).filter(([, value]) => value !== '')
    )

    if (mode === 'edit') {
      const idSet = new Set(resource.idKeys)
      return Object.fromEntries(
        Object.entries(basePayload).filter(([key]) => !idSet.has(key))
      )
    }

    return basePayload
  }

  const openCreateForm = () => {
    setFormMode('create')
    setEditingPath(null)
    setFormData(createEmptyByFields(formFields))
    setFormOpen(true)
    loadForeignKeyOptions().catch(() => {
      setError('No se pudieron cargar algunas opciones relacionadas')
    })
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
    const initialData = createEmptyByFields(formFields)
    formFields.forEach((field) => {
      initialData[field] = row?.[field] ?? ''
    })
    setFormData(initialData)
    setFormOpen(true)
    loadForeignKeyOptions().catch(() => {
      setError('No se pudieron cargar algunas opciones relacionadas')
    })
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
        await resourcesApi.create(resource.key, buildPayloadForSubmit(formData, 'create'))
        setResultMessage('Registro creado correctamente')
      } else {
        if (!resource.canUpdate || !editingPath) {
          throw new Error('Este recurso no soporta actualización o no tiene un ID válido')
        }
        await resourcesApi.updateByPath(editingPath, buildPayloadForSubmit(formData, 'edit'))
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
    if (formFields.length > 0) {
      return formFields
    }

    if (Object.keys(formData).length > 0) {
      return Object.keys(formData)
    }

    return fields
  }, [fields, formData, formFields])

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
    foreignKeyOptions,
    openCreateForm,
    openEditForm,
    closeForm: () => setFormOpen(false),
    submitForm,
    remove,
  }
}
