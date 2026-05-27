export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
