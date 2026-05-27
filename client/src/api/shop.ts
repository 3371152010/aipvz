import request from './request'

export function getShopItems() {
  return request.get('/shop/items')
}

export function buyItem(itemId: string) {
  return request.post('/shop/buy', { itemId })
}

export function exchangeGems(gems: number) {
  return request.post('/shop/exchange', { gems })
}

export function buyPlantSlot() {
  return request.post('/shop/buy-slot')
}
