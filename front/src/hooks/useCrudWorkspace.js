// Hook personalizado: encapsula estado y comportamiento reutilizable de la UI.
import { useEffect, useMemo, useState } from 'react'
import { RESOURCES } from '../config/resources'
import { resourcesApi } from '../services/resourcesApi'
import { isPlainObject, parseJsonBody, prettifyJson } from '../utils/format'
import {
  buildResourceIdPath,
  createInitialIdValues,
  extractIdValuesFromRow,
} from '../utils/resource'

export function useCrudWorkspace() {
  const [selectedResourceKey, setSelectedResourceKey] = useState(RESOURCES[0].key)
  const [rows, setRows] = useState([])
  const [bodyText, setBodyText] = useState('{\n\n}')
  const [idValues, setIdValues] = useState({})
  const [selectedRow, setSelectedRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const resource = useMemo(
    () => RESOURCES.find((entry) => entry.key === selectedResourceKey) || RESOURCES[0],
    [selectedResourceKey]
  )

  const resourceIdPath = useMemo(
    () => buildResourceIdPath(resource, idValues),
    [resource, idValues]
  )

  const tableColumns = useMemo(() => {
    const fromSelected = selectedRow && isPlainObject(selectedRow) ? Object.keys(selectedRow) : []
    if (fromSelected.length) {
      return fromSelected
    }

    const firstRow = rows[0]
    if (isPlainObject(firstRow)) {
      return Object.keys(firstRow)
    }

    return []
  }, [rows, selectedRow])

  useEffect(() => {
    setRows([])
    setResult(null)
    setError('')
    setSelectedRow(null)
    setIdValues(createInitialIdValues(resource))
    setBodyText('{\n\n}')
  }, [resource])

  const execute = async (action, callback) => {
    setLoading(true)
    setError('')

    try {
      const data = await callback()
      setResult({ action, data })
      return data
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Error inesperado')
      return null
    } finally {
      setLoading(false)
    }
  }

  const listAll = async () => {
    const data = await execute('GET_ALL', () => resourcesApi.list(resource.key))

    if (Array.isArray(data)) {
      setRows(data)
      if (data[0] && isPlainObject(data[0])) {
        setBodyText(prettifyJson(data[0]))
      }
    } else {
      setRows([])
    }
  }

  const getById = async () => {
    if (!resourceIdPath) {
      setError(`Completa los IDs: ${resource.idKeys.join(', ')}`)
      return
    }

    const data = await execute('GET_BY_ID', () => resourcesApi.getByPath(resourceIdPath))
    if (isPlainObject(data)) {
      setSelectedRow(data)
      setBodyText(prettifyJson(data))
    }
  }

  const createItem = async () => {
    let payload
    try {
      payload = parseJsonBody(bodyText)
    } catch (err) {
      setError(err.message)
      return
    }

    await execute('CREATE', () => resourcesApi.create(resource.key, payload))
    await listAll()
  }

  const updateItem = async () => {
    if (!resource.canUpdate) {
      setError('Este recurso no soporta UPDATE en el backend actual')
      return
    }

    if (!resourceIdPath) {
      setError(`Completa los IDs: ${resource.idKeys.join(', ')}`)
      return
    }

    let payload
    try {
      payload = parseJsonBody(bodyText)
    } catch (err) {
      setError(err.message)
      return
    }

    await execute('UPDATE', () => resourcesApi.updateByPath(resourceIdPath, payload))
    await listAll()
  }

  const deleteItem = async () => {
    if (!resourceIdPath) {
      setError(`Completa los IDs: ${resource.idKeys.join(', ')}`)
      return
    }

    await execute('DELETE', () => resourcesApi.deleteByPath(resourceIdPath))
    await listAll()
  }

  const selectRow = (row) => {
    if (!isPlainObject(row)) {
      return
    }

    setSelectedRow(row)
    setBodyText(prettifyJson(row))
    setIdValues((current) => extractIdValuesFromRow(resource, row, current))
  }

  return {
    resources: RESOURCES,
    resource,
    selectedResourceKey,
    setSelectedResourceKey,
    rows,
    tableColumns,
    idValues,
    setIdValues,
    bodyText,
    setBodyText,
    result,
    error,
    loading,
    listAll,
    getById,
    createItem,
    updateItem,
    deleteItem,
    selectRow,
  }
}
