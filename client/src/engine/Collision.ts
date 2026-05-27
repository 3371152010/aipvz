import { CELL_W, CELL_H, GRID_OFFSET_X, GRID_OFFSET_Y } from './constants'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function rectOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function gridToPixel(row: number, col: number): { x: number; y: number } {
  return {
    x: GRID_OFFSET_X + col * CELL_W + CELL_W / 2,
    y: GRID_OFFSET_Y + row * CELL_H + CELL_H / 2,
  }
}

export function pixelToGrid(px: number, py: number): { row: number; col: number } | null {
  const col = Math.floor((px - GRID_OFFSET_X) / CELL_W)
  const row = Math.floor((py - GRID_OFFSET_Y) / CELL_H)
  if (row < 0 || row >= 5 || col < 0 || col >= 9) return null
  return { row, col }
}

export function getZombieRect(x: number, row: number): Rect {
  const y = GRID_OFFSET_Y + row * CELL_H + 10
  return { x: x - 15, y, w: 30, h: 80 }
}

export function getPlantRect(row: number, col: number): Rect {
  const { x, y } = gridToPixel(row, col)
  return { x: x - 25, y: y - 35, w: 50, h: 70 }
}

export function getProjectileRect(x: number, y: number): Rect {
  return { x: x - 5, y: y - 5, w: 10, h: 10 }
}

export function getSunRect(x: number, y: number): Rect {
  return { x: x - 15, y: y - 15, w: 30, h: 30 }
}
