import request from './request'

export function getLevels(world?: number) {
  return request.get('/levels', { params: world ? { world } : {} })
}

export function getLevel(id: string) {
  return request.get(`/levels/${id}`)
}

export function getLevelByWorldAndLevel(world: number, level: number) {
  return request.get(`/levels/${world}/${level}`)
}

export function getWorldOverview(world: number) {
  return request.get(`/levels/${world}/overview`)
}

export function submitBattle(data: {
  levelId: string
  won: boolean
  plantsLost: number
  durationSec: number
  plantsUsed: number[]
}) {
  return request.post('/battles/submit', data)
}

export function getBattleHistory(page = 1, pageSize = 20) {
  return request.get('/battles/history', { params: { page, pageSize } })
}
