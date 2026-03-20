// Utilidad: funciones puras de apoyo para formato y transformaciones comunes.
export const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const prettifyJson = (value) => JSON.stringify(value, null, 2)

export const parseJsonBody = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('JSON inválido en el cuerpo de la petición')
  }
}
