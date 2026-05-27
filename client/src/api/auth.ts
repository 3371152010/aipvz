import request from './request'

export function login(email: string, password: string) {
  return request.post('/auth/login', { email, password })
}

export function register(email: string, password: string, nickname: string) {
  return request.post('/auth/register', { email, password, nickname })
}

export function guestLogin() {
  return request.post('/auth/guest')
}

export function refreshToken(token: string) {
  return request.post('/auth/refresh', {}, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
