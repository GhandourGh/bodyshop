import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Inject auth token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('af_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const apiKey = import.meta.env.VITE_AI_API_KEY
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('af_token')
      localStorage.removeItem('af_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Separate client for Next.js backend API (handles its own auth via Bearer token)
export const backendClient = axios.create({
  baseURL: '/backend',
  timeout: 30000,
})

backendClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('af_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

backendClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('af_token')
      localStorage.removeItem('af_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default apiClient
