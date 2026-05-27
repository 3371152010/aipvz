import request from './request'

export function getTotalRank() {
  return request.get('/rank/total')
}

export function getStarsRank() {
  return request.get('/rank/stars')
}

export function getSpeedRank() {
  return request.get('/rank/speed')
}
