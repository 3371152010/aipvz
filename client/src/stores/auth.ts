import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/user'
import request from '../api/request'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isGuest = ref(false)

  const isLoggedIn = computed(() => !!accessToken.value)

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function setUser(u: User) {
    user.value = u
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    isGuest.value = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function restoreSession() {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    if (access && refresh) {
      accessToken.value = access
      refreshToken.value = refresh
    }
  }

  async function fetchUser() {
    try {
      const { data } = await request.get('/users/me')
      if (data?.data) {
        user.value = data.data as User
      }
    } catch { /* ignore */ }
  }

  return { user, accessToken, refreshToken, isGuest, isLoggedIn, setTokens, setUser, logout, restoreSession, fetchUser }
})
