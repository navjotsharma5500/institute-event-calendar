export const IC_ADMIN_AUTH_KEY = 'icAdminAuthenticated'
export const IC_ADMIN_SESSION_KEY = 'icAdminSession'

export function isIcAdminAuthenticated() {
  return localStorage.getItem(IC_ADMIN_AUTH_KEY) === 'true'
}

export function setIcAdminSession(password) {
  localStorage.setItem(IC_ADMIN_AUTH_KEY, 'true')
  localStorage.setItem(IC_ADMIN_SESSION_KEY, password)
}

export function clearIcAdminSession() {
  localStorage.removeItem(IC_ADMIN_AUTH_KEY)
  localStorage.removeItem(IC_ADMIN_SESSION_KEY)
}
