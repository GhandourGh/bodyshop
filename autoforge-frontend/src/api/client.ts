import axios from 'axios'
import { clearAuth, getStoredToken } from '@/lib/auth'

const FASTAPI_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * `apiClient` → FastAPI AI microservice (port 8000 by default).
 * FastAPI uses its own X-API-Key auth, so a 401 here does NOT mean the user's
 * session is expired — never wipe localStorage on its responses.
 */
export const apiClient = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  const apiKey = import.meta.env.VITE_AI_API_KEY
  if (apiKey) config.headers['X-API-Key'] = apiKey

  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

/**
 * `backendClient` → Next.js Postgres-backed API (proxied via Vite at /backend).
 * Owns the user session, so a 401 here means token invalid → wipe + redirect.
 */
export const backendClient = axios.create({
  baseURL: '/backend',
  timeout: 30000,
})

backendClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

backendClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default apiClient
