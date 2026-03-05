export const createInitialIdValues = (resource) => {
  const values = {}
  resource.idKeys.forEach((idKey) => {
    values[idKey] = ''
  })
  return values
}

export const buildResourceIdPath = (resource, idValues) => {
  const missing = resource.idKeys.some((idKey) => !String(idValues[idKey] || '').trim())
  if (missing) {
    return null
  }

  const composed = resource.idKeys.map((idKey) =>
    encodeURIComponent(String(idValues[idKey]).trim())
  )

  return `/${resource.key}/${composed.join('/')}`
}

export const extractIdValuesFromRow = (resource, row, currentValues) => {
  const nextValues = { ...currentValues }
  const rowKeys = Object.keys(row)

  resource.idKeys.forEach((idKey) => {
    const directValue = row[idKey]
    if (directValue !== undefined && directValue !== null) {
      nextValues[idKey] = String(directValue)
      return
    }

    const normalizedWanted = idKey.toLowerCase().replace(/_/g, '')

    const exactKey = rowKeys.find((rowKey) => rowKey.toLowerCase() === idKey.toLowerCase())
    if (exactKey) {
      nextValues[idKey] = String(row[exactKey] ?? '')
      return
    }

    const looseKey = rowKeys.find((rowKey) => {
      const normalizedCurrent = rowKey.toLowerCase().replace(/_/g, '')
      return normalizedCurrent === normalizedWanted
    })

    if (looseKey) {
      nextValues[idKey] = String(row[looseKey] ?? '')
    }
  })

  return nextValues
}
