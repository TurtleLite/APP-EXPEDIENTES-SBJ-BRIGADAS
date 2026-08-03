import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
}

export const usersApi = {
  list: () => api.get('/users/'),
  me: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  get: (id: string | number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users/', data),
  update: (id: string | number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string | number) => api.delete(`/users/${id}`),
}

export const listsApi = {
  create: (data: any) => api.post('/lists/', data),
  list: () => api.get('/lists/'),
  get: (id: string | number) => api.get(`/lists/${id}`),
  update: (id: string | number, data: any) => api.put(`/lists/${id}`, data),
  delete: (id: string | number) => api.delete(`/lists/${id}`),
  getRecords: (id: string | number, params?: any) => api.get(`/lists/${id}/records`, { params }),
  getRecordsCount: (id: string | number) => api.get(`/lists/${id}/records/count`),
  createRecord: (id: string | number, data: any) => api.post(`/lists/${id}/records`, data),
  updateRecord: (listId: string | number, recordId: string | number, data: any) =>
    api.put(`/lists/${listId}/records/${recordId}`, data),
  deleteRecord: (listId: string | number, recordId: string | number) =>
    api.delete(`/lists/${listId}/records/${recordId}`),
  importExcel: (listId: string | number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/lists/${listId}/import-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportExcel: (listId: string | number) =>
    api.get(`/lists/${listId}/export-excel`, { responseType: 'blob' }),
  exportExpediente: (listId: string | number) =>
    api.get(`/lists/${listId}/export-expediente`, { responseType: 'blob' }),
  getEspecialidades: (listId: string | number) =>
    api.get(`/lists/${listId}/especialidades`),
  getFieldValues: (listId: string | number, field: string) =>
    api.get(`/lists/${listId}/field-values`, { params: { field } }),
  exportExpedienteSelected: async (listId: string | number, ids: string[]) => {
    const res = await api.post(`/lists/${listId}/export-expediente-selected`, { ids }, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    const cd = res.headers['content-disposition']
    const match = cd && cd.match(/filename="?(.+?)"?\s*$/i)
    a.download = match ? match[1] : 'expedientes_seleccionados.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  },
}

export const reportsApi = {
  create: (data: any) => api.post('/reports/', data),
  list: () => api.get('/reports/'),
  get: (id: string | number) => api.get(`/reports/${id}`),
  preview: (id: string | number) => api.get(`/reports/${id}/preview`),
  generateExcel: (id: string | number) => api.post(`/reports/${id}/generate-excel`),
  download: (id: string | number) =>
    api.get(`/reports/${id}/download`, { responseType: 'blob' }),
  delete: (id: string | number) => api.delete(`/reports/${id}`),
}

export const dayListsApi = {
  list: () => api.get('/day-lists/'),
  get: (date: string) => api.get(`/day-lists/${date}`),
  save: (date: string, recordIds: (string | number)[]) =>
    api.put(`/day-lists/${date}`, { record_ids: recordIds }),
  delete: (date: string) => api.delete(`/day-lists/${date}`),
  exportExcel: (date: string) =>
    api.get(`/day-lists/${date}/export-excel`, { responseType: 'blob' }),
}

export default api
