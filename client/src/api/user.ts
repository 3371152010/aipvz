import request from './request'

export function getUserInventory() {
  return request.get('/users/me/inventory')
}

export function getUserProfile() {
  return request.get('/users/me')
}

export function updateUserProfile(data: { nickname?: string; avatarUrl?: string }) {
  return request.patch('/users/me', data)
}
