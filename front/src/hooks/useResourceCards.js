import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { resourcesApi } from '../services/resourcesApi'
import { RESOURCES } from '../config/resources'
import { isPlainObject } from '../utils/format'
import { buildResourceIdPath, extractIdValuesFromRow } from '../utils/resource'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [20, 50, 100]

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

const sortRows = (rows, field, direction) => {
  if (!field) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const left = a?.[field]
    const right = b?.[field]

    if (left === right) {
      return 0
    }

    if (left === null || left === undefined) {
      return 1
    }

    if (right === null || right === undefined) {
      return -1
    }

    const leftComparable = String(left).toLowerCase()
    const rightComparable = String(right).toLowerCase()

    if (direction === 'desc') {
      return rightComparable.localeCompare(leftComparable, 'es')
    }

    return leftComparable.localeCompare(rightComparable, 'es')
  })
}

export function useResourceCards(resource) {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [formData, setFormData] = useState({})
  const [editingPath, setEditingPath] = useState(null)
  const [foreignKeyOptions, setForeignKeyOptions] = useState({})

  const fields = useMemo(() => getUnionKeys(rows), [rows])
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const formFields = useMemo(() => {
    if (Array.isArray(resource.formFields) && resource.formFields.length > 0) {
      return resource.formFields
    }
    return fields
  }, [resource.formFields, fields])

  const foreignKeyConfig = useMemo(() => resource.foreignKeys || {}, [resource.foreignKeys])
  const fieldTypes = useMemo(() => resource.fieldTypes || {}, [resource.fieldTypes])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase())
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const stored = localStorage.getItem('cards-page-size')
    const parsed = Number(stored)
    if (PAGE_SIZE_OPTIONS.includes(parsed)) {
      setPageSizeState(parsed)
    }
  }, [])

  const filteredRows = useMemo(() => {
    if (!debouncedQuery) {
      return rows
    }

    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(debouncedQuery))
  }, [rows, debouncedQuery])

  const sortedRows = useMemo(() => {
    return sortRows(filteredRows, sortField, sortDirection)
  }, [filteredRows, sortField, sortDirection])

  const list = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await resourcesApi.list(resource.key)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener la lista'
      setError(message)
      await Swal.fire({
        title: 'Error al cargar',
        text: message,
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRows([])
    setQuery('')
    setDebouncedQuery('')
    setError('')
    setFormOpen(false)
    setEditingPath(null)
    setFormData({})
    setForeignKeyOptions({})
    setCurrentPage(1)
    setSortField('')
    setSortDirection('asc')
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
    const parseValueByType = (field, rawValue) => {
      const type = fieldTypes[field]

      if (type === 'number') {
        const parsed = Number(rawValue)
        return Number.isNaN(parsed) ? rawValue : parsed
      }

      if (type === 'checkbox') {
        if (rawValue === true || rawValue === false) {
          return rawValue ? 1 : 0
        }
        if (rawValue === '1' || rawValue === 'true') {
          return 1
        }
        if (rawValue === '0' || rawValue === 'false') {
          return 0
        }
        return rawValue
      }

      return rawValue
    }

    const basePayload = Object.fromEntries(
      Object.entries(rawFormData)
        .filter(([, value]) => value !== '')
        .map(([key, value]) => [key, parseValueByType(key, value)])
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
    loadForeignKeyOptions().catch(async () => {
      const message = 'No se pudieron cargar algunas opciones relacionadas'
      setError(message)
      await Swal.fire({
        title: 'Error al cargar datos',
        text: message,
        icon: 'error',
      })
    })
  }

  const openEditForm = (row) => {
    const idValues = extractIdValuesFromRow(resource, row, {})
    const idPath = buildResourceIdPath(resource, idValues)
    if (!idPath) {
      const message = 'No se pudo determinar el ID para editar este registro'
      setError(message)
      void Swal.fire({
        title: 'No se pudo editar',
        text: message,
        icon: 'error',
      })
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
    loadForeignKeyOptions().catch(async () => {
      const message = 'No se pudieron cargar algunas opciones relacionadas'
      setError(message)
      await Swal.fire({
        title: 'Error al cargar datos',
        text: message,
        icon: 'error',
      })
    })
  }

  const remove = async (row) => {
    const idValues = extractIdValuesFromRow(resource, row, {})
    const idPath = buildResourceIdPath(resource, idValues)
    if (!idPath) {
      const message = 'No se pudo determinar el ID para eliminar este registro'
      setError(message)
      void Swal.fire({
        title: 'No se pudo eliminar',
        text: message,
        icon: 'error',
      })
      return
    }

    const confirmation = await Swal.fire({
      title: 'Confirmar eliminacion',
      text: 'Esta accion puede afectar datos relacionados. Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await resourcesApi.deleteByPath(idPath)
      await Swal.fire({
        title: 'Eliminado',
        text: 'El registro se elimino correctamente',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
      })
      await list()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el registro'
      setError(message)
      await Swal.fire({
        title: 'No se pudo eliminar',
        text: message,
        icon: 'error',
      })
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
        await Swal.fire({
          title: 'Registro creado',
          text: 'La informacion se guardo correctamente',
          icon: 'success',
          timer: 1600,
          showConfirmButton: false,
        })
      } else {
        if (!resource.canUpdate || !editingPath) {
          throw new Error('Este recurso no soporta actualización o no tiene un ID válido')
        }
        await resourcesApi.updateByPath(editingPath, buildPayloadForSubmit(formData, 'edit'))
        await Swal.fire({
          title: 'Registro actualizado',
          text: 'Los cambios se guardaron correctamente',
          icon: 'success',
          timer: 1600,
          showConfirmButton: false,
        })
      }

      setFormOpen(false)
      await list()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el registro'
      setError(message)
      await Swal.fire({
        title: 'No se pudo guardar',
        text: message,
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, resource.key, pageSize, sortField, sortDirection])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRows.length / pageSize))
  }, [sortedRows.length, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedRows = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const start = (safePage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [currentPage, sortedRows, totalPages, pageSize])

  const visibleFields = useMemo(() => {
    if (formFields.length > 0) {
      return formFields
    }

    if (Object.keys(formData).length > 0) {
      return Object.keys(formData)
    }

    return fields
  }, [fields, formData, formFields])

  const sortFields = useMemo(() => {
    const fromConfig = Array.isArray(resource.formFields) ? resource.formFields : []
    const fallback = fields
    const merged = fromConfig.length ? fromConfig : fallback
    return merged.slice(0, 12)
  }, [fields, resource.formFields])

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(nextPage)
  }

  const setPageSize = (nextSize) => {
    if (!PAGE_SIZE_OPTIONS.includes(nextSize)) {
      return
    }
    setPageSizeState(nextSize)
    localStorage.setItem('cards-page-size', String(nextSize))
  }

  const visibleStart = sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const visibleEnd = Math.min(currentPage * pageSize, sortedRows.length)

  return {
    rows,
    totalRows: rows.length,
    filteredRows,
    sortedRows,
    paginatedRows,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
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
    error,
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
