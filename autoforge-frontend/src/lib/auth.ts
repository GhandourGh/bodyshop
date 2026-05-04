/**
 * Client-side auth helpers backed by localStorage.
 * The token + user are populated by the login flow in `pages/Login.tsx`.
 */

const TOKEN_KEY = 'af_token'
const USER_KEY = 'af_user'

export type StoredUser = {
  id?: string
  name?: string
  email?: string
  role?: string
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as StoredUser) : null
  } catch {
    return null
  }
}

export function getStoredRole(): string {
  return (getStoredUser()?.role || '').toLowerCase()
}

export function isAdminRole(): boolean {
  return getStoredRole() === 'admin'
}

export function isCustomerRole(): boolean {
  return getStoredRole() === 'customer'
}

export function isStaffRole(): boolean {
  const r = getStoredRole()
  return r === 'admin' || r === 'mechanic'
}

export function setStoredAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
