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
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users/', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
}

export const listsApi = {
  create: (data: any) => api.post('/lists/', data),
  list: () => api.get('/lists/'),
  get: (id: number) => api.get(`/lists/${id}`),
  update: (id: number, data: any) => api.put(`/lists/${id}`, data),
  delete: (id: number) => api.delete(`/lists/${id}`),
  getRecords: (id: number, params?: any) => api.get(`/lists/${id}/records`, { params }),
  createRecord: (id: number, data: any) => api.post(`/lists/${id}/records`, data),
  updateRecord: (listId: number, recordId: number, data: any) =>
    api.put(`/lists/${listId}/records/${recordId}`, data),
  deleteRecord: (listId: number, recordId: number) =>
    api.delete(`/lists/${listId}/records/${recordId}`),
  importExcel: (listId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/lists/${listId}/import-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportExcel: (listId: number) =>
    api.get(`/lists/${listId}/export-excel`, { responseType: 'blob' }),
  exportExpediente: (listId: number) =>
    api.get(`/lists/${listId}/export-expediente`, { responseType: 'blob' }),
}

export const reportsApi = {
  create: (data: any) => api.post('/reports/', data),
  list: () => api.get('/reports/'),
  get: (id: number) => api.get(`/reports/${id}`),
  generateExcel: (id: number) => api.post(`/reports/${id}/generate-excel`),
  generatePdf: (id: number) => api.post(`/reports/${id}/generate-pdf`),
  download: (id: number, type: 'excel' | 'pdf') =>
    api.get(`/reports/${id}/download/${type}`, { responseType: 'blob' }),
}

export default api
