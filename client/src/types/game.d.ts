export interface GameConfig {
  world: number
  level: number
  name: string
  totalWaves: number
  allowedPlants: number[]
  initialSun: number
  sunDropInterval: number
  isNight: boolean
  hasPool: boolean
}

export interface PlantConfig {
  id: number
  name: string
  cost: number
  cooldown: number
  hp: number
  damage: number
  attackInterval: number
  range: 'row' | 'area' | 'single' | 'self'
}

export interface ZombieConfig {
  id: number
  name: string
  hp: number
  speed: number
  damage: number
}

export interface PlacedPlant {
  id: string
  plantType: number
  row: number
  col: number
  hp: number
  maxHp?: number
  damage?: number          // override for form_shift etc.
  attackTimer: number
  growTimer?: number      // for sun_producer_growing
  growStage?: number
  hasRegenerated?: boolean // for wall_regen
  armed?: boolean          // for mine
}

export interface ActiveZombie {
  id: string
  zombieType: number
  row: number
  x: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  state: 'walking' | 'eating' | 'dying'
  deathTimer?: number
  slowed?: boolean
  slowTimer?: number
  stunned?: boolean
  stunTimer?: number
  hasJumped?: boolean
  enraged?: boolean
  summoned?: boolean
  hasIron?: boolean        // for magnet-shroom targeting
}

export interface Projectile {
  id: string
  x: number
  y: number
  row: number
  speed: number
  damage: number
  slow: boolean
  // Extended fields for new plant types
  projectileType?: 'pea' | 'ice_pea' | 'cabbage' | 'watermelon' | 'kernel' | 'spike' | 'laser' | 'rock' | 'arrow' | 'fire' | 'missile' | 'lightning' | 'spore'
  splashRadius?: number
  stunChance?: number
  stunDuration?: number
  pushback?: number
  pierceCount?: number
  hitZombies?: string[]     // track which zombies were hit (for piercing)
  chainCount?: number
  chainRange?: number
  tracking?: boolean
  trackingTarget?: string
  isLob?: boolean
  lobHeight?: number
  lobProgress?: number
  targetX?: number
  targetY?: number
  isBoomerang?: boolean
  boomerangPhase?: 'out' | 'return'
  maxRange?: number
  traveledDistance?: number
  balloonPop?: boolean
}

export interface GameState {
  sun: number
  plants: PlacedPlant[]
  zombies: ActiveZombie[]
  projectiles: Projectile[]
  currentWave: number
  totalWaves: number
  gamePhase: 'preparing' | 'playing' | 'paused' | 'won' | 'lost'
  lawnMowers: boolean[]
  selectedPlantType: number | null
  selectedTool: 'plant' | 'shovel' | null
}
