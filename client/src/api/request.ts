import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

request.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      if (auth.refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${auth.refreshToken}` },
          })
          auth.setTokens(data.data.accessToken, data.data.refreshToken)
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return axios(error.config)
        } catch {
          auth.logout()
          window.location.href = '/login'
        }
      } else {
        auth.logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default request
