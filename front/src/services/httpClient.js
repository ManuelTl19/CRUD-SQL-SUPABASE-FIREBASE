import { API_BASE_URL } from '../config/env'
import { isPlainObject } from '../utils/format'

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const rawText = await response.text()
  let payload = null

  if (rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      payload = rawText
    }
  }

  if (!response.ok) {
    const message =
      (isPlainObject(payload) && (payload.error || payload.message)) ||
      `Error ${response.status}: ${response.statusText}`
    throw new Error(String(message))
  }

  return payload
}
