import { request } from './httpClient'

export const resourcesApi = {
  list(resourceKey) {
    return request(`/api/${resourceKey}`)
  },

  getByPath(resourceIdPath) {
    return request(`/api${resourceIdPath}`)
  },

  create(resourceKey, body) {
    return request(`/api/${resourceKey}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateByPath(resourceIdPath, body) {
    return request(`/api${resourceIdPath}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  deleteByPath(resourceIdPath) {
    return request(`/api${resourceIdPath}`, {
      method: 'DELETE',
    })
  },
}
