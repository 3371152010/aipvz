import type { PlacedPlant, ActiveZombie, Projectile } from '../../types/game'
import type { GameEngine, Particle } from '../GameEngine'

export interface BehaviorContext {
  plant: PlacedPlant
  engine: GameEngine
  dt: number
  getGridCenter: (row: number, col: number) => { x: number; y: number }
  spawnProjectile: (p: Projectile) => void
  spawnParticles: (x: number, y: number, count: number, colors: string[], speedMin: number, speedMax: number, maxLife: number) => void
  findZombieInRow: (row: number, minX?: number) => ActiveZombie | undefined
  findZombiesInArea: (centerRow: number, centerCol: number, rowRadius: number, colRadius: number) => ActiveZombie[]
  removePlant: () => void
}

export interface BehaviorHandler {
  onUpdate?(ctx: BehaviorContext): void
  onPlace?(ctx: BehaviorContext): void
  onContact?(ctx: BehaviorContext, zombie: ActiveZombie): void
}
