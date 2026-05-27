export interface User {
  id: string
  email: string
  nickname: string
  avatarUrl: string | null
  role: 'USER' | 'ADMIN' | 'GUEST'
  coins: number
  gems: number
  plantSlots: number
  createdAt: string
}
